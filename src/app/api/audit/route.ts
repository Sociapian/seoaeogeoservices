import { NextResponse } from "next/server";
import { z } from "zod";
import { runCrawl } from "@/lib/audit/engine";
import { AuditError } from "@/lib/audit/fetcher";
import { seal } from "@/lib/audit/sign";
import { clientIp, fail, rateLimit } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ url: z.string().min(3).max(2000) });

/** Part 1: crawl the site. Returns the result plus a signed copy for the report step. */
export async function POST(req: Request) {
  if (!rateLimit(`audit:${clientIp(req)}`, 6, 10 * 60_000))
    return fail("You have run several audits in a short time. Please try again in a few minutes.", 429);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Please enter a website address.");

  try {
    const result = await runCrawl(parsed.data.url);
    return NextResponse.json({ ok: true, result, sealed: seal(result) });
  } catch (e) {
    if (e instanceof AuditError) return fail(e.message, e.code === "invalid_url" ? 400 : 422);
    console.error("[audit] unexpected error", e);
    return fail("Something went wrong while auditing that site. Please try again.", 500);
  }
}
