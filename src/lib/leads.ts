import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { site } from "@/config/site";
import { sendMail, smtpConfigured } from "./mailer";

const clean = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

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
  const url = clean(process.env.LEAD_WEBHOOK_URL);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: site.url, ...lead }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
    return true;
  } catch (e) {
    console.error("[leads] webhook failed:", (e as Error).message);
    return false;
  }
}

async function toEmail(lead: Lead) {
  const to = clean(process.env.LEAD_NOTIFY_TO) || site.contact.email;
  if (!smtpConfigured() || !to) {
    console.warn("[leads] SMTP not configured or no recipient specified; skipping email notification.");
    return false;
  }
  try {
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
  } catch (err) {
    console.error("[leads] toEmail dispatch failed:", (err as Error).message);
    return false;
  }
}

async function toFile(lead: Lead) {
  if (clean(process.env.LEAD_FILE_LOG) === "0") return false;
  try {
    const dir = path.join(process.cwd(), ".data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(lead) + "\n", "utf8");
    return true;
  } catch (err) {
    console.warn("[leads] toFile write skipped (read-only filesystem or inaccessible path):", (err as Error).message);
    return false;
  }
}

/**
 * Fan a lead out to every configured sink. Returns true if at least one
 * sink accepted it, so the API can tell the visitor honestly whether
 * their enquiry was recorded.
 */
export async function saveLead(lead: Lead): Promise<boolean> {
  const results = await Promise.allSettled([toWebhook(lead), toEmail(lead), toFile(lead)]);
  results.forEach((r) => r.status === "rejected" && console.error("[leads] sink rejected:", r.reason?.message || r.reason));
  const accepted = results.some((r) => r.status === "fulfilled" && r.value === true);
  if (!accepted) {
    console.warn("[leads] no sink accepted lead for:", lead.email, "(verify SMTP credentials in Vercel Environment Variables)");
  }
  return accepted;
}
