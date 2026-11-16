import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditError } from "@/lib/audit/fetcher";
import { runSpeed } from "@/lib/audit/pagespeed";
import { seal } from "@/lib/audit/sign";
import { clientIp, fail, rateLimit } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const body = z.object({ url: z.string().min(3).max(2000) });

/** Part 2: Google PageSpeed Insights. Runs in parallel with the crawl. */
export async function POST(req: Request) {
  if (!rateLimit(`speed:${clientIp(req)}`, 6, 10 * 60_000)) return fail("Too many requests. Please try again shortly.", 429);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Please enter a website address.");
  try {
    const result = await runSpeed(parsed.data.url);
    return NextResponse.json({ ok: true, result, sealed: seal(result) });
  } catch (e) {
    return fail(e instanceof AuditError ? e.message : "Speed test unavailable right now.", 502);
  }
}
