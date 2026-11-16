import { site } from "@/config/site";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildReportPdf } from "@/lib/audit/pdf";
import { combine } from "@/lib/audit/score";
import { unseal } from "@/lib/audit/sign";
import type { AiResult, CrawlResult, SpeedResult } from "@/lib/audit/types";
import { checkEmail } from "@/lib/email-check";
import { clientIp, fail, leadFields, rateLimit } from "@/lib/http";
import { saveLead } from "@/lib/leads";
import { reportDelivery, sendMail } from "@/lib/mailer";
import { reportEmail } from "@/lib/report-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sealed = z.object({ payload: z.string().max(400_000), signature: z.string().regex(/^[a-f0-9]{64}$/) });
const body = z.object({
  ...leadFields,
  crawl: sealed,
  speed: sealed.optional().nullable(),
  ai: sealed.optional().nullable(),
});

const bare = (h: string) => h.toLowerCase().replace(/^www\./, "");

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`report:${ip}`, 10, 10 * 60_000)) return fail("Too many requests. Please try again shortly.", 429);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Please check the form and try again.");
  const { crawl: c, speed: s, ai: a, website_url, ...lead } = parsed.data;
  if (website_url) return fail("Please check the form and try again.");

  const crawl = unseal<CrawlResult>(c, "crawl");
  if (!crawl) return fail("This audit has expired. Please run the audit again to get your report.", 409);
  // Optional parts are only used if genuine and for the same site.
  const speedRaw = unseal<SpeedResult>(s, "speed");
  const aiRaw = unseal<AiResult>(a, "ai");
  const speed = speedRaw && bare(speedRaw.host) === bare(crawl.host) ? speedRaw : null;
  const ai = aiRaw && bare(aiRaw.host) === bare(crawl.host) ? aiRaw : null;

  const delivery = reportDelivery();
  if (delivery !== "download") {
    const problem = await checkEmail(lead.email);
    if (problem) return fail(problem, 422);
  }

  const report = combine(crawl, speed, ai);
  const pdf = Buffer.from(await buildReportPdf(report, { name: lead.name, company: lead.company }));
  const file = `seo-aeo-geo-audit-${crawl.host.replace(/[^a-z0-9.-]/gi, "")}.pdf`;

  let emailed = false;
  if (delivery !== "download") {
    try {
      const mail = reportEmail(report, lead.name);
      await sendMail({
        to: lead.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        replyTo: process.env.LEAD_NOTIFY_TO || site.contact.email,
        bcc: process.env.REPORT_BCC || undefined,
        attachments: [{ filename: file, content: pdf, contentType: "application/pdf" }],
      });
      emailed = true;
    } catch (e) {
      console.error("[report] email failed:", (e as Error).message);
    }
  }

  await saveLead({
    type: "audit",
    ...lead,
    website: crawl.finalUrl,
    auditScore: report.score,
    pagesCrawled: crawl.pagesCrawled,
    aiShareOfVoice: ai?.shareOfVoice,
    reportEmailed: delivery === "download" ? undefined : emailed,
    ip,
    userAgent: req.headers.get("user-agent") || undefined,
    createdAt: new Date().toISOString(),
  });

  if (delivery === "email") {
    if (!emailed) return fail("We could not send the email just now. Please check the address and try again.", 502);
    return NextResponse.json({ ok: true, delivery: "email", email: lead.email });
  }

  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${file}"`,
      "cache-control": "no-store",
      "x-report-emailed": emailed ? "1" : "0",
    },
  });
}
