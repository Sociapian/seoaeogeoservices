import type { Transporter } from "nodemailer";

const clean = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

export const smtpConfigured = () => !!clean(process.env.SMTP_HOST);

let transport: Transporter | null = null;

async function getTransport(): Promise<Transporter> {
  if (transport) return transport;
  const nodemailer = (await import("nodemailer")).default;
  const host = clean(process.env.SMTP_HOST);
  const port = Number(clean(process.env.SMTP_PORT) || 587);
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS);

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
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
  const from = clean(process.env.SMTP_FROM) || clean(process.env.SMTP_USER);
  await t.sendMail({ from, ...mail });
}

/**
 * How the PDF reaches the visitor:
 *  - "email":    emailed only (proves the address is real). Default when SMTP is configured.
 *  - "both":     downloaded immediately and emailed.
 *  - "download": downloaded only. Default when SMTP is not configured.
 */
export function reportDelivery(): "email" | "both" | "download" {
  const v = clean(process.env.REPORT_DELIVERY).toLowerCase();
  if (!smtpConfigured()) {
    if (v === "email" || v === "both") console.warn("[report] REPORT_DELIVERY needs SMTP settings; falling back to download.");
    return "download";
  }
  return v === "both" || v === "download" ? v : "email";
}
