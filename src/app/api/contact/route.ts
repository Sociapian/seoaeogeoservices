import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { clientIp, contactSchema, fail, rateLimit } from "@/lib/http";
import { saveLead } from "@/lib/leads";
import { sendMail, smtpConfigured } from "@/lib/mailer";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function acknowledgeContact(to: string, name: string) {
  const first = name.split(" ")[0];
  const siteUrl = "https://www.seoaeogeoservices.com";
  const text = `Hi ${first},

Thank you for reaching out to ${site.parent.name}. We have received your message and our team will get back to you within ${site.contact.responseTime}.

If you have urgent questions, you can also reach us directly at ${site.contact.email} or call ${site.contact.phone}.

${site.name}
${siteUrl}`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#12102a;max-width:560px">
<p>Hi ${esc(first)},</p>
<p>Thank you for reaching out to <b>${esc(site.parent.name)}</b>. We have received your message and our team will review it and get back to you within ${esc(site.contact.responseTime)}.</p>
<p>In the meantime, feel free to explore our free instant audit tool: <a href="${siteUrl}/free-seo-audit" style="color:#ff6a3d;font-weight:bold;text-decoration:none">${siteUrl.replace(/^https?:\/\//, "")}/free-seo-audit</a></p>
<p style="color:#74718f;font-size:13px;margin-top:24px">${esc(site.name)} · ${esc(siteUrl.replace(/^https?:\/\//, ""))}</p></div>`;

  await sendMail({
    to,
    subject: `We've received your message, ${first}`,
    text,
    html,
    replyTo: process.env.LEAD_NOTIFY_TO || site.contact.email,
  });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) return fail("Too many requests. Please try again shortly.", 429);

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Please check the form and try again.");
  const { website_url, recaptchaToken, ...data } = parsed.data;
  // Honeypot tripped: pretend success so bots do not learn anything.
  if (website_url) return NextResponse.json({ ok: true });

  const recaptcha = await verifyRecaptcha(recaptchaToken, "contact");
  if (!recaptcha.success) return fail(recaptcha.error || "Security check failed.", 403);

  const saved = await saveLead({
    type: "contact",
    ...data,
    ip,
    userAgent: req.headers.get("user-agent") || undefined,
    createdAt: new Date().toISOString(),
  });
  if (!saved) return fail("We could not record your enquiry right now. Please email us directly.", 503);

  if (smtpConfigured()) {
    try {
      await acknowledgeContact(data.email, data.name);
    } catch (e) {
      console.error("[contact] acknowledgement failed:", (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}
