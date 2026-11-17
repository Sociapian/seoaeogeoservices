import { NextResponse } from "next/server";
import { z } from "zod";

/** Fixed-window in-memory limiter. For multi-instance deployments swap for Redis / Upstash. */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  return ++b.count <= limit;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const fail = (message: string, status = 400) => NextResponse.json({ ok: false, error: message }, { status });

const text = (max: number) => z.string().trim().max(max);

export const leadFields = {
  name: text(80).min(2, "Please enter your name."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(120),
  phone: text(20)
    .regex(/^[+()\-\s\d]{7,20}$/, "Please enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  company: text(100).optional(),
  /** Honeypot: real visitors never fill this hidden field. */
  website_url: z.string().max(500).optional(),
  /** Google reCAPTCHA v3/v2 verification token. */
  recaptchaToken: z.string().optional(),
};

export const contactSchema = z.object({
  ...leadFields,
  website: text(200).optional(),
  service: text(60).optional(),
  message: text(2000).min(10, "Please tell us a little about what you need."),
});
