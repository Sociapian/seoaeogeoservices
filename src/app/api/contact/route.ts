import { NextResponse } from "next/server";
import { clientIp, contactSchema, fail, rateLimit } from "@/lib/http";
import { saveLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) return fail("Too many requests. Please try again shortly.", 429);

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Please check the form and try again.");
  const { website_url, ...data } = parsed.data;
  // Honeypot tripped: pretend success so bots do not learn anything.
  if (website_url) return NextResponse.json({ ok: true });

  const saved = await saveLead({
    type: "contact",
    ...data,
    ip,
    userAgent: req.headers.get("user-agent") || undefined,
    createdAt: new Date().toISOString(),
  });
  if (!saved) return fail("We could not record your enquiry right now. Please email us directly.", 503);
  return NextResponse.json({ ok: true });
}
