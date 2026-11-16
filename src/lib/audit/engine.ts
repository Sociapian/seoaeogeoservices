/**
 * Part 1 of the audit: crawl up to CRAWL_MAX_PAGES pages of a site, run the
 * page-level checks on each, and roll them up into site-wide checks.
 */
import { AuditError, normalizeUrl, safeFetch, type FetchResult } from "./fetcher";
import { runChecks, type Snapshot } from "./checks";
import type { Check, CrawlResult, PageSummary, Status } from "./types";

const STATUS_VALUE: Record<Status, number> = { pass: 1, warn: 0.5, fail: 0 };
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|zip|rar|gz|mp4|mov|webm|mp3|wav|xml|json|txt|css|js|mjs|map|woff2?|ttf|docx?|xlsx?|pptx?|csv)$/i;

/** Checks that describe the whole domain: taken from the start page only. */
const HOME_ONLY = new Set(["https", "status", "response-time", "compression", "robots-txt", "sitemap", "llms-txt", "ai-crawlers", "entity-schema", "trust-pages"]);
/** Checks that only need to be satisfied somewhere on the site (e.g. an FAQ section). */
const ANY_PAGE = new Set(["faq-schema", "question-headings", "direct-answers", "snippet-structure", "citations", "freshness-authorship"]);

interface CrawledPage {
  url: string;
  status: number;
  ms: number;
  checks: Check[];
  snapshot: Snapshot | null;
}

const env = (k: string, d: number, min: number, max: number) => Math.min(max, Math.max(min, Number(process.env[k]) || d));
const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "");
export const pathOf = (u: string) => {
  try {
    const x = new URL(u);
    return (x.pathname + x.search) || "/";
  } catch {
    return u;
  }
};
function keyOf(u: URL) {
  const p = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : "/";
  return `${bareHost(u.hostname)}${p}${u.search}`;
}

// ---------- robots.txt rules for our crawler (group "*") ----------
function robotsMatcher(robots: string | null) {
  if (!robots) return () => true;
  const rules: { allow: boolean; re: RegExp; len: number }[] = [];
  let inStar = false;
  let lastAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    if (k === "user-agent") {
      if (!lastAgent) inStar = false;
      if (v === "*" || /sociapa/i.test(v)) inStar = true;
      lastAgent = true;
      continue;
    }
    lastAgent = false;
    if (!inStar || (k !== "allow" && k !== "disallow") || !v) continue;
    const pattern = v.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\\\$$/, "$").replace(/\*/g, ".*");
    rules.push({ allow: k === "allow", re: new RegExp("^" + pattern), len: v.length });
  }
  return (path: string) => {
    let best: { allow: boolean; len: number } | null = null;
    for (const r of rules) if (r.re.test(path) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
    return !best || best.allow;
  };
}

async function tryFetch(url: string, maxBytes = 300_000): Promise<FetchResult | null> {
  try {
    const r = await safeFetch(url, { timeoutMs: 6000, maxBytes });
    return r.status >= 200 && r.status < 300 ? r : null;
  } catch {
    return null;
  }
}

const looksLikeHtml = (s: string) => /<html|<!doctype/i.test(s.slice(0, 500));
const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));

async function readSitemaps(origin: string, robotsTxt: string | null) {
  const candidates = robotsTxt ? [...robotsTxt.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]) : [];
  // Also try the standard locations, in case robots.txt points somewhere unreachable.
  for (const d of [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]) if (!candidates.includes(d)) candidates.push(d);
  const urls: string[] = [];
  let found = false;
  for (const sm of candidates.slice(0, 4)) {
    if (found) break;
    const r = await tryFetch(sm, 3_000_000);
    if (!r || !/<(urlset|sitemapindex)/i.test(r.body)) continue;
    found = true;
    if (/<sitemapindex/i.test(r.body)) {
      for (const child of locs(r.body).slice(0, 3)) {
        const c = await tryFetch(child, 3_000_000);
        if (c) urls.push(...locs(c.body));
        if (urls.length > 500) break;
      }
    } else urls.push(...locs(r.body));
    if (urls.length > 500) break;
  }
  return { found, urls: urls.slice(0, 500) };
}

function detectBrand(home: Snapshot | null, host: string): string {
  const label = bareHost(host).split(".")[0];
  if (home?.orgName && home.orgName.length <= 60) return home.orgName;
  if (home?.siteName && home.siteName.length <= 60) return home.siteName;
  const segs = (home?.title || "").split(/\s+[|\-–—:·]\s+/).map((s) => s.trim()).filter(Boolean);
  const hit = segs.find((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").includes(label.replace(/[^a-z0-9]/g, "")));
  if (hit && hit.length <= 60) return hit;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ---------- roll page checks up into site checks ----------
function aggregate(pages: CrawledPage[]): Check[] {
  const ok = pages.filter((p) => p.checks.length);
  const home = ok[0];
  if (!home) return [];
  const n = ok.length;
  return home.checks.map((hc) => {
    if (HOME_ONLY.has(hc.id) || n === 1) return hc;
    const per = ok.map((p) => ({ url: p.url, c: p.checks.find((c) => c.id === hc.id)! })).filter((x) => x.c);
    const passing = per.filter((x) => x.c.status === "pass");
    const failing = per.filter((x) => x.c.status !== "pass");
    const examples = failing.slice(0, 5).map((x) => pathOf(x.url));
    if (ANY_PAGE.has(hc.id)) {
      if (passing.length)
        return { ...hc, status: "pass", recommendation: "", finding: `${passing.length} of ${n} crawled pages pass (for example ${pathOf(passing[0].url)}).` };
      const best = per.find((x) => x.c.status === "warn") ?? per[0];
      return { ...best.c, finding: `None of the ${n} crawled pages fully pass. Best result (${pathOf(best.url)}): ${best.c.finding}`, examples };
    }
    const avg = per.reduce((s, x) => s + STATUS_VALUE[x.c.status], 0) / per.length;
    const status: Status = avg >= 0.9 ? "pass" : avg >= 0.6 ? "warn" : "fail";
    const first = failing[0];
    return {
      ...hc,
      status,
      finding: `${passing.length} of ${per.length} pages pass.${first ? ` For example ${pathOf(first.url)}: ${first.c.finding}` : ""}`,
      recommendation: status === "pass" ? "" : (first?.c.recommendation ?? hc.recommendation),
      examples: status === "pass" ? undefined : examples,
    };
  });
}

function siteChecks(pages: CrawledPage[]): Check[] {
  const out: Check[] = [];
  const broken = pages.filter((p) => p.status >= 400);
  out.push({
    id: "broken-pages", category: "technical", title: "No broken internal pages", impact: "high",
    status: broken.length === 0 ? "pass" : broken.length <= 2 ? "warn" : "fail",
    finding: broken.length ? `${broken.length} of ${pages.length} crawled URLs returned an error (${[...new Set(broken.map((b) => b.status))].join(", ")}).` : `All ${pages.length} crawled URLs loaded without errors.`,
    recommendation: broken.length ? "Fix or 301-redirect broken URLs and update the internal links pointing to them. Broken pages waste crawl budget and lose link equity." : "",
    examples: broken.slice(0, 5).map((b) => pathOf(b.url)),
  });

  const ok = pages.filter((p) => p.snapshot && !p.snapshot.noindex);
  const dupes = (key: "title" | "description") => {
    const groups = new Map<string, string[]>();
    for (const p of ok) {
      const v = (p.snapshot![key] || "").trim().toLowerCase();
      if (!v) continue;
      groups.set(v, [...(groups.get(v) || []), p.url]);
    }
    return [...groups.values()].filter((g) => g.length > 1);
  };
  const dt = dupes("title");
  out.push({
    id: "duplicate-titles", category: "onpage", title: "Unique page titles", impact: "medium",
    status: dt.length === 0 ? "pass" : dt.length <= 2 ? "warn" : "fail",
    finding: dt.length ? `${dt.length} title(s) are shared by more than one page.` : `All ${ok.length} indexable pages have distinct titles.`,
    recommendation: dt.length ? "Give every page its own title that describes that page's specific topic. Duplicate titles make pages compete with each other in search." : "",
    examples: dt.flat().slice(0, 5).map(pathOf),
  });
  const dd = dupes("description");
  out.push({
    id: "duplicate-descriptions", category: "onpage", title: "Unique meta descriptions", impact: "low",
    status: dd.length === 0 ? "pass" : dd.length <= 2 ? "warn" : "fail",
    finding: dd.length ? `${dd.length} meta description(s) are shared by more than one page.` : "No duplicate meta descriptions found.",
    recommendation: dd.length ? "Write a unique meta description for each page summarising what that page offers." : "",
    examples: dd.flat().slice(0, 5).map(pathOf),
  });
  return out;
}

export async function runCrawl(input: string): Promise<CrawlResult> {
  const start = normalizeUrl(input);
  const first = await safeFetch(start);
  const type = first.headers.get("content-type") || "";
  if (type && !/html|xml|text\/plain/i.test(type)) throw new AuditError("not_html", "That address does not return a web page.");

  const finalUrl = new URL(first.finalUrl);
  const origin = finalUrl.origin;
  const host = finalUrl.hostname;

  const [robotsRes, llmsRes] = await Promise.all([tryFetch(`${origin}/robots.txt`), tryFetch(`${origin}/llms.txt`, 50_000)]);
  const robotsTxt = robotsRes && !looksLikeHtml(robotsRes.body) ? robotsRes.body : null;
  const llmsTxtFound = !!llmsRes && !looksLikeHtml(llmsRes.body) && llmsRes.body.trim().length > 20;
  const sitemap = await readSitemaps(origin, robotsTxt);
  const allowed = robotsMatcher(robotsTxt);

  const maxPages = env("CRAWL_MAX_PAGES", 25, 1, 50);
  const deadline = Date.now() + env("CRAWL_BUDGET_MS", 30_000, 5_000, 120_000);
  const concurrency = 4;

  const seen = new Set<string>([keyOf(finalUrl), keyOf(start)]);
  const queue: string[] = [];
  const enqueue = (raw: string) => {
    let u: URL;
    try {
      u = new URL(raw, origin);
    } catch {
      return;
    }
    if (!/^https?:$/.test(u.protocol) || bareHost(u.hostname) !== bareHost(host)) return;
    u.hash = "";
    if (SKIP_EXT.test(u.pathname) || !allowed(u.pathname + u.search)) return;
    const k = keyOf(u);
    if (seen.has(k)) return;
    seen.add(k);
    queue.push(u.toString());
  };

  const pages: CrawledPage[] = [];
  const analyse = (res: FetchResult, url: string): CrawledPage => {
    const isOk = res.status >= 200 && res.status < 300;
    // The start page is always analysed so its status shows up in the report.
    if (!isOk && pages.length > 0) return { url, status: res.status, ms: res.ms, checks: [], snapshot: null };
    const { checks, snapshot } = runChecks({
      finalUrl: new URL(res.finalUrl),
      status: res.status,
      headers: res.headers,
      html: res.body,
      responseMs: res.ms,
      robotsTxt,
      sitemapFound: sitemap.found,
      llmsTxtFound,
    });
    return { url, status: res.status, ms: res.ms, checks, snapshot };
  };

  const home = analyse(first, finalUrl.toString());
  pages.push(home);
  home.snapshot?.links.forEach(enqueue);
  sitemap.urls.forEach(enqueue);

  let inFlight = 0;
  await new Promise<void>((resolve) => {
    const pump = () => {
      if ((pages.length + inFlight >= maxPages || !queue.length || Date.now() > deadline) && inFlight === 0) return resolve();
      while (inFlight < concurrency && queue.length && pages.length + inFlight < maxPages && Date.now() <= deadline) {
        const url = queue.shift()!;
        inFlight++;
        safeFetch(url, { timeoutMs: 10_000, maxBytes: 1_500_000, maxRedirects: 3 })
          .then((res) => {
            const ct = res.headers.get("content-type") || "";
            const landed = new URL(res.finalUrl);
            if (ct && !/html/i.test(ct)) return;
            if (bareHost(landed.hostname) !== bareHost(host)) return;
            if (landed.toString() !== url) {
              const k = keyOf(landed);
              if (seen.has(k) && keyOf(new URL(url)) !== k) return; // redirected to a page we already have
              seen.add(k);
            }
            const page = analyse(res, res.finalUrl);
            pages.push(page);
            page.snapshot?.links.forEach(enqueue);
          })
          .catch(() => pages.push({ url, status: 599, ms: 0, checks: [], snapshot: null }))
          .finally(() => {
            inFlight--;
            pump();
          });
      }
      if (inFlight === 0) resolve();
    };
    pump();
  });

  const checks = [...aggregate(pages), ...siteChecks(pages)];
  const pageSummaries: PageSummary[] = pages.map((p) => ({
    url: p.url,
    status: p.status,
    title: p.snapshot?.title || "",
    words: p.snapshot?.wordCount || 0,
    fails: p.checks.filter((c) => c.status === "fail" && !HOME_ONLY.has(c.id)).length,
    warns: p.checks.filter((c) => c.status === "warn" && !HOME_ONLY.has(c.id)).length,
  }));

  return {
    kind: "crawl",
    version: 2,
    url: start.toString(),
    finalUrl: finalUrl.toString(),
    host,
    fetchedAt: new Date().toISOString(),
    responseMs: first.ms,
    pagesCrawled: pages.length,
    pagesDiscovered: seen.size,
    brand: {
      name: detectBrand(home.snapshot, host),
      title: home.snapshot?.title || "",
      description: home.snapshot?.description || "",
    },
    checks,
    pages: pageSummaries,
  };
}
