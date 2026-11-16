import type { Transporter } from "nodemailer";

let transport: Transporter | null = null;

export const smtpConfigured = () => !!process.env.SMTP_HOST;

async function getTransport(): Promise<Transporter> {
  if (transport) return transport;
  const nodemailer = (await import("nodemailer")).default;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  bcc?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export async function sendMail(mail: Mail): Promise<void> {
  if (!smtpConfigured()) throw new Error("SMTP is not configured");
  const t = await getTransport();
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...mail });
}

/**
 * How the PDF reaches the visitor:
 *  - "email":    emailed only (proves the address is real). Default when SMTP is configured.
 *  - "both":     downloaded immediately and emailed.
 *  - "download": downloaded only. Default when SMTP is not configured.
 */
export function reportDelivery(): "email" | "both" | "download" {
  const v = (process.env.REPORT_DELIVERY || "").toLowerCase();
  if (!smtpConfigured()) {
    if (v === "email" || v === "both") console.warn("[report] REPORT_DELIVERY needs SMTP settings; falling back to download.");
    return "download";
  }
  return v === "both" || v === "download" ? v : "email";
}
