import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { site } from "@/config/site";
import { sendMail, smtpConfigured } from "./mailer";

export interface Lead {
  type: "contact" | "audit" | "enquiry";
  businessName?: string;
  businessType?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  service?: string;
  message?: string;
  auditScore?: number;
  /** Audit leads: true when the PDF was accepted by the mail server for this address. */
  reportEmailed?: boolean;
  pagesCrawled?: number;
  aiShareOfVoice?: number;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

async function toWebhook(lead: Lead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: site.url, ...lead }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  return true;
}

async function toEmail(lead: Lead) {
  const to = process.env.LEAD_NOTIFY_TO || site.contact.email;
  if (!smtpConfigured() || !to) return false;
  const rows = Object.entries(lead)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
  await sendMail({
    to,
    replyTo: lead.email,
    subject: `[${site.name}] New ${({ audit: "audit report lead", contact: "contact enquiry", enquiry: "free audit & growth review request" } as const)[lead.type]}: ${lead.businessName ? `${lead.businessName} (${lead.name})` : lead.name}`,
    text: rows,
  });
  return true;
}

async function toFile(lead: Lead) {
  if (process.env.LEAD_FILE_LOG === "0") return false;
  const dir = path.join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(lead) + "\n", "utf8");
  return true;
}

/**
 * Fan a lead out to every configured sink. Returns true if at least one
 * sink accepted it, so the API can tell the visitor honestly whether
 * their enquiry was recorded.
 */
export async function saveLead(lead: Lead): Promise<boolean> {
  const results = await Promise.allSettled([toWebhook(lead), toEmail(lead), toFile(lead)]);
  results.forEach((r) => r.status === "rejected" && console.error("[leads] sink failed:", r.reason?.message || r.reason));
  return results.some((r) => r.status === "fulfilled" && r.value);
}
