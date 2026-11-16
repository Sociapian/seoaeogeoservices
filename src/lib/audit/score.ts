/**
 * Pure scoring functions, shared by the browser (live display) and the
 * server (PDF). No Node-only imports allowed in this file.
 */
import {
  CATEGORY_META,
  IMPACT_WEIGHT,
  type AiResult,
  type CategoryId,
  type CategoryScore,
  type Check,
  type CombinedReport,
  type CrawlResult,
  type SpeedResult,
} from "./types";

const STATUS_VALUE = { pass: 1, warn: 0.5, fail: 0 } as const;

export function categoryScores(checks: Check[]): CategoryScore[] {
  return (Object.keys(CATEGORY_META) as CategoryId[]).map((id) => {
    const list = checks.filter((c) => c.category === id);
    const max = list.reduce((s, c) => s + IMPACT_WEIGHT[c.impact], 0);
    const got = list.reduce((s, c) => s + IMPACT_WEIGHT[c.impact] * STATUS_VALUE[c.status], 0);
    return {
      id,
      label: CATEGORY_META[id].label,
      score: list.length ? Math.round((got / max) * 100) : null,
      passed: list.filter((c) => c.status === "pass").length,
      warnings: list.filter((c) => c.status === "warn").length,
      failed: list.filter((c) => c.status === "fail").length,
    };
  });
}

/** Weighted mean of the categories that were measured; weights are renormalised over those. */
export function overallScore(categories: CategoryScore[]): number {
  const measured = categories.filter((c) => c.score !== null);
  const w = measured.reduce((s, c) => s + CATEGORY_META[c.id].weight, 0);
  if (!w) return 0;
  return Math.round(measured.reduce((s, c) => s + (c.score as number) * CATEGORY_META[c.id].weight, 0) / w);
}

export function grade(score: number): CombinedReport["grade"] {
  return score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
}

/** Failing first, then warnings; within each, highest impact first. */
export function prioritise(checks: Check[]): Check[] {
  const rank = (c: Check) => (c.status === "fail" ? 0 : 10) - IMPACT_WEIGHT[c.impact];
  return checks.filter((c) => c.status !== "pass").sort((a, b) => rank(a) - rank(b));
}

export function combine(crawl: CrawlResult, speed: SpeedResult | null, ai: AiResult | null): CombinedReport {
  const checks = [...crawl.checks, ...(speed?.checks ?? []), ...(ai?.checks ?? [])];
  const categories = categoryScores(checks);
  const score = overallScore(categories);
  return {
    host: crawl.host,
    finalUrl: crawl.finalUrl,
    fetchedAt: crawl.fetchedAt,
    score,
    grade: grade(score),
    categories,
    checks,
    crawl,
    speed,
    ai,
  };
}
