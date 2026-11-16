export type CategoryId = "technical" | "onpage" | "aeo" | "geo" | "performance" | "ai";
export type Status = "pass" | "warn" | "fail";
export type Impact = "high" | "medium" | "low";

export interface Check {
  id: string;
  category: CategoryId;
  title: string;
  status: Status;
  impact: Impact;
  /** What we observed. */
  finding: string;
  /** What to do about it. Empty for passes. */
  recommendation: string;
  /** Example URLs affected (site-wide checks). */
  examples?: string[];
}

export interface CategoryScore {
  id: CategoryId;
  label: string;
  /** null when this part of the audit was not run (e.g. API key not configured). */
  score: number | null;
  passed: number;
  warnings: number;
  failed: number;
}

export interface PageSummary {
  url: string;
  status: number;
  title: string;
  words: number;
  /** Count of failing / warning checks on this page. */
  fails: number;
  warns: number;
}

/** Part 1: whole-site crawl. Produced by /api/audit. */
export interface CrawlResult {
  kind: "crawl";
  version: 2;
  url: string;
  finalUrl: string;
  host: string;
  fetchedAt: string;
  responseMs: number;
  pagesCrawled: number;
  pagesDiscovered: number;
  brand: { name: string; title: string; description: string };
  checks: Check[];
  pages: PageSummary[];
}

/** Part 2: PageSpeed Insights. Produced by /api/audit/speed. */
export interface SpeedResult {
  kind: "speed";
  host: string;
  url: string;
  strategy: "mobile";
  score: number; // 0-100 Lighthouse performance
  lab: { fcp: number; lcp: number; tbt: number; cls: number; si: number };
  field: null | {
    overall: "FAST" | "AVERAGE" | "SLOW" | string;
    lcp?: { p75: number; category: string };
    cls?: { p75: number; category: string };
    inp?: { p75: number; category: string };
  };
  opportunities: { title: string; savingsMs: number }[];
  checks: Check[];
}

export interface AiAnswer {
  engine: string;
  mentioned: boolean;
  cited: boolean;
  excerpt: string;
  sources: string[]; // domains
  error?: string;
}

/** Part 3: AI visibility. Produced by /api/audit/ai. */
export interface AiResult {
  kind: "ai";
  host: string;
  brand: string;
  category: string;
  engines: string[];
  prompts: { prompt: string; branded: boolean; answers: AiAnswer[] }[];
  shareOfVoice: number; // 0-100, unbranded prompts where the brand was mentioned
  topSources: { domain: string; count: number }[];
  checks: Check[];
}

/** The three parts merged and scored. Computed on the client for display and on the server for the PDF. */
export interface CombinedReport {
  host: string;
  finalUrl: string;
  fetchedAt: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: CategoryScore[];
  checks: Check[];
  crawl: CrawlResult;
  speed: SpeedResult | null;
  ai: AiResult | null;
}

export const CATEGORY_META: Record<CategoryId, { label: string; weight: number; blurb: string }> = {
  technical: { label: "Technical SEO", weight: 0.2, blurb: "Can search engines reach, crawl and index the site?" },
  onpage: { label: "On-page SEO", weight: 0.2, blurb: "Do the pages clearly tell Google what they are about?" },
  aeo: { label: "AEO readiness", weight: 0.15, blurb: "Is the content structured to win direct answers?" },
  geo: { label: "GEO readiness", weight: 0.15, blurb: "Can AI engines read, trust and cite the site?" },
  performance: { label: "Speed & Core Web Vitals", weight: 0.15, blurb: "How fast does the site load for real visitors on mobile?" },
  ai: { label: "AI visibility", weight: 0.15, blurb: "Do ChatGPT and Perplexity mention the brand today?" },
};

export const IMPACT_WEIGHT: Record<Impact, number> = { high: 3, medium: 2, low: 1 };
