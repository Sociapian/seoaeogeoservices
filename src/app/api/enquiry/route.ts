import { NextResponse } from "next/server";
import { z } from "zod";
import { site } from "@/config/site";
import { BUSINESS_TYPES } from "@/content/enquiry";
import { checkEmail } from "@/lib/email-check";
import { clientIp, fail, rateLimit } from "@/lib/http";
import { saveLead } from "@/lib/leads";
import { sendMail, smtpConfigured } from "@/lib/mailer";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (max: number) => z.string().trim().max(max);

const schema = z.object({
  businessName: text(100).min(2, "Please enter your business name."),
  businessType: z.enum(BUSINESS_TYPES, { errorMap: () => ({ message: "Please select your business type." }) }),
  name: text(80).min(2, "Please enter your name."),
  phone: text(20).regex(/^[+()\-\s\d]{7,20}$/, "Please enter a valid phone number."),
  email: z.string().trim().toLowerCase().email("Please enter a valid business email.").max(120),
  website: text(200)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v), "Please enter a valid website, e.g. yourbrand.com"),
  /** Honeypot: hidden field real visitors never fill. */
  website_url: z.string().max(500).optional(),
  /** Google reCAPTCHA v3/v2 verification token. */
  recaptchaToken: z.string().optional(),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Short acknowledgement so the visitor knows the request landed. */
async function acknowledge(to: string, name: string, businessName: string) {
  const first = name.split(" ")[0];
  const text = `Hi ${first},

Thanks for requesting a free audit and growth review for ${businessName}. A strategist from ${site.parent.name} will review your website and get back to you within ${site.contact.responseTime}.

While you wait, you can run our instant audit: ${site.url}/free-seo-audit

${site.name}
${site.url}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#12102a;max-width:560px">
<p>Hi ${esc(first)},</p>
<p>Thanks for requesting a free audit and growth review for <b>${esc(businessName)}</b>. A strategist from ${esc(site.parent.name)} will review your website and get back to you within ${esc(site.contact.responseTime)}.</p>
<p>While you wait, you can run our instant audit and see your SEO, AEO and GEO scores:</p>
<p><a href="${site.url}/free-seo-audit" style="display:inline-block;background:#ff6a3d;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Run the instant audit</a></p>
<p style="color:#74718f;font-size:13px">${esc(site.name)} · ${esc(site.url.replace(/^https?:\/\//, ""))}</p></div>`;
  await sendMail({ to, subject: `We've received your request, ${first}`, text, html, replyTo: process.env.LEAD_NOTIFY_TO || site.contact.email });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`enquiry:${ip}`, 5, 10 * 60_000)) return fail("Too many requests. Please try again shortly.", 429);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Please check the form and try again.");
  const { website_url, recaptchaToken, ...data } = parsed.data;
  if (website_url) return NextResponse.json({ ok: true }); // bot: pretend success

  const recaptcha = await verifyRecaptcha(recaptchaToken, "enquiry");
  if (!recaptcha.success) return fail(recaptcha.error || "Security check failed.", 403);

  const problem = await checkEmail(data.email);
  if (problem) return fail(problem, 422);

  const saved = await saveLead({
    type: "enquiry",
    ...data,
    website: data.website || undefined,
    ip,
    userAgent: req.headers.get("user-agent") || undefined,
    createdAt: new Date().toISOString(),
  });
  if (!saved) return fail("We could not record your request right now. Please email us directly.", 503);

  if (smtpConfigured()) {
    acknowledge(data.email, data.name, data.businessName).catch((e) => console.error("[enquiry] acknowledgement failed:", e.message));
  }
  return NextResponse.json({ ok: true });
}
