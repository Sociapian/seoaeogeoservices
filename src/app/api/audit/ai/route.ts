import { NextResponse } from "next/server";
import { z } from "zod";
import { configuredEngines, runAiVisibility } from "@/lib/audit/ai-visibility";
import { seal, unseal } from "@/lib/audit/sign";
import type { CrawlResult } from "@/lib/audit/types";
import { clientIp, fail, rateLimit } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const body = z.object({ crawl: z.object({ payload: z.string().max(400_000), signature: z.string() }) });

/** Global daily cap so a traffic spike cannot run up the AI bill. Per server instance. */
let day = "";
let used = 0;
function underDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    used = 0;
  }
  return ++used <= (Number(process.env.AI_DAILY_LIMIT) || 100);
}

/**
 * Part 3: AI visibility. Requires the signed crawl result, so this endpoint
 * (and the paid AI APIs behind it) can only be used for a site that was just audited.
 */
export async function POST(req: Request) {
  if (!configuredEngines().length) return fail("AI visibility check is not configured.", 501);
  if (!rateLimit(`ai:${clientIp(req)}`, 4, 10 * 60_000)) return fail("Too many requests. Please try again shortly.", 429);

  const parsed = body.safeParse(await req.json().catch(() => null));
  const crawl = parsed.success ? unseal<CrawlResult>(parsed.data.crawl, "crawl") : null;
  if (!crawl) return fail("Please run the audit again.", 409);
  if (!underDailyCap()) return fail("The AI visibility check has reached today's limit. Please try again tomorrow.", 503);

  try {
    const result = await runAiVisibility(crawl);
    return NextResponse.json({ ok: true, result, sealed: seal(result) });
  } catch (e) {
    console.error("[ai]", (e as Error).message);
    return fail("The AI engines did not respond. Please try again later.", 502);
  }
}
