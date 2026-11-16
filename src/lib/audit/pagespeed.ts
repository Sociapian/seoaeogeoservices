/**
 * Part 2 of the audit: Google PageSpeed Insights (Lighthouse lab data on a
 * mobile profile, plus Chrome UX Report field data when the site has enough
 * real-user traffic). Get a free key at
 * https://developers.google.com/speed/docs/insights/v5/get-started
 */
import { AuditError, normalizeUrl } from "./fetcher";
import type { Check, SpeedResult, Status } from "./types";

const PSI = process.env.PAGESPEED_API_URL || "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const band = (v: number, good: number, ok: number): Status => (v <= good ? "pass" : v <= ok ? "warn" : "fail");
const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const catStatus = (c?: string): Status => (c === "FAST" ? "pass" : c === "AVERAGE" ? "warn" : "fail");

export async function runSpeed(input: string): Promise<SpeedResult> {
  const url = normalizeUrl(input);
  const qs = new URLSearchParams({ url: url.toString(), strategy: "mobile", category: "performance" });
  if (process.env.PAGESPEED_API_KEY) qs.set("key", process.env.PAGESPEED_API_KEY);

  let data: any;
  try {
    const res = await fetch(`${PSI}?${qs}`, { signal: AbortSignal.timeout(Number(process.env.PAGESPEED_TIMEOUT_MS) || 70_000) });
    data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `PageSpeed responded ${res.status}`);
  } catch (e) {
    console.error("[speed]", (e as Error).message);
    throw new AuditError("unreachable", "Google PageSpeed could not measure this site right now.");
  }

  const lh = data.lighthouseResult;
  const audits = lh?.audits ?? {};
  const num = (id: string) => Number(audits[id]?.numericValue ?? 0);
  const score = Math.round((lh?.categories?.performance?.score ?? 0) * 100);
  const lab = { fcp: num("first-contentful-paint"), lcp: num("largest-contentful-paint"), tbt: num("total-blocking-time"), cls: num("cumulative-layout-shift"), si: num("speed-index") };

  const m = data.loadingExperience?.metrics;
  const fm = (k: string, scale = 1) => (m?.[k] ? { p75: Number(m[k].percentile) / scale, category: String(m[k].category) } : undefined);
  const field = m && data.loadingExperience?.overall_category
    ? {
        overall: data.loadingExperience.overall_category,
        lcp: fm("LARGEST_CONTENTFUL_PAINT_MS"),
        cls: fm("CUMULATIVE_LAYOUT_SHIFT_SCORE", 100),
        inp: fm("INTERACTION_TO_NEXT_PAINT"),
      }
    : null;

  const opportunities = Object.values<any>(audits)
    .filter((a) => a?.details?.type === "opportunity" && (a.details.overallSavingsMs ?? 0) >= 100 && (a.score ?? 1) < 0.9)
    .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
    .slice(0, 5)
    .map((a) => ({ title: String(a.title), savingsMs: Math.round(a.details.overallSavingsMs) }));

  const checks: Check[] = [];
  const add = (c: Omit<Check, "category">) => checks.push({ ...c, category: "performance", recommendation: c.status === "pass" ? "" : c.recommendation });
  const oppText = opportunities.length
    ? ` Biggest opportunities: ${opportunities.slice(0, 3).map((o) => `${o.title.replace(/\.$/, "")} (save about ${secs(o.savingsMs)})`).join("; ")}.`
    : "";

  add({
    id: "perf-score", title: "Mobile performance score", impact: "high",
    status: score >= 90 ? "pass" : score >= 50 ? "warn" : "fail",
    finding: `Google Lighthouse scores the homepage ${score}/100 on a simulated mid-range mobile phone.`,
    recommendation: `Aim for 90 or above.${oppText} Compress and lazy-load images, defer non-critical JavaScript and use a CDN.`,
  });

  if (field) {
    add({
      id: "cwv-field", title: "Core Web Vitals (real Chrome users)", impact: "high",
      status: catStatus(field.overall),
      finding: `Google's Chrome UX Report rates real-user experience on this URL as ${String(field.overall).toLowerCase()}.`,
      recommendation: "Core Web Vitals are a Google ranking signal. Fix the individual metrics below until all three are in the good range for 75% of visits.",
    });
  }

  const lcp = field?.lcp ? { v: field.lcp.p75, src: "real users, 75th percentile" } : { v: lab.lcp, src: "lab test" };
  add({
    id: "lcp", title: "Largest Contentful Paint (loading)", impact: "high", status: band(lcp.v, 2500, 4000),
    finding: `Main content appears after ${secs(lcp.v)} (${lcp.src}). Good is 2.5 s or less.`,
    recommendation: "Serve the hero image in WebP or AVIF at the right size, preload it, avoid lazy-loading it, and cut server response time.",
  });

  const cls = field?.cls ? { v: field.cls.p75, src: "real users" } : { v: lab.cls, src: "lab test" };
  add({
    id: "cls", title: "Cumulative Layout Shift (visual stability)", impact: "medium", status: band(cls.v, 0.1, 0.25),
    finding: `Layout shift score is ${cls.v.toFixed(2)} (${cls.src}). Good is 0.1 or less.`,
    recommendation: "Set width and height on images, videos and ad slots, and avoid inserting banners above existing content after load.",
  });

  if (field?.inp) {
    add({
      id: "inp", title: "Interaction to Next Paint (responsiveness)", impact: "medium", status: band(field.inp.p75, 200, 500),
      finding: `Pages respond to taps and clicks in ${Math.round(field.inp.p75)} ms (real users). Good is 200 ms or less.`,
      recommendation: "Break up long JavaScript tasks, remove unused third-party scripts and defer work that is not needed for the first interaction.",
    });
  } else {
    add({
      id: "tbt", title: "Total Blocking Time (responsiveness, lab)", impact: "medium", status: band(lab.tbt, 200, 600),
      finding: `The main thread is blocked for ${Math.round(lab.tbt)} ms during load. Good is 200 ms or less.`,
      recommendation: "Reduce and split JavaScript bundles, remove unused third-party scripts and defer non-critical code.",
    });
  }

  return { kind: "speed", host: url.hostname, url: url.toString(), strategy: "mobile", score, lab, field, opportunities, checks };
}
