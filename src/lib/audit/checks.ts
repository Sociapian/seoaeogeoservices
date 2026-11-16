import * as cheerio from "cheerio";
import type { Check, CategoryId, Impact, Status } from "./types";

export interface PageContext {
  finalUrl: URL;
  status: number;
  headers: Headers;
  html: string;
  responseMs: number;
  robotsTxt: string | null;
  sitemapFound: boolean;
  llmsTxtFound: boolean;
}

export interface Snapshot {
  title: string;
  description: string;
  h1: string;
  wordCount: number;
  images: number;
  internalLinks: number;
  externalLinks: number;
  schemaTypes: string[];
  /** og:site_name, used to detect the brand name. */
  siteName: string;
  /** Organization schema name, used to detect the brand name. */
  orgName: string;
  noindex: boolean;
  /** Absolute same-site URLs linked from this page (crawl frontier). */
  links: string[];
}

const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"];
const QUESTION_RE = /^(what|why|how|when|where|who|which|can|does|do|is|are|should|will)\b|\?\s*$/i;

/** Which user-agents are fully disallowed ("Disallow: /") in robots.txt. */
export function blockedAgents(robots: string, agents: string[]): string[] {
  const groups: { agents: string[]; rules: string[] }[] = [];
  let cur: { agents: string[]; rules: string[] } | null = null;
  let lastWasAgent = false;
  for (const line of robots.split(/\r?\n/)) {
    const clean = line.replace(/#.*/, "").trim();
    const m = clean.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && key === "disallow") cur.rules.push(val);
    }
  }
  const fullBlock = (g?: { rules: string[] }) => !!g && g.rules.some((r) => r === "/" || r === "/*");
  const star = groups.find((g) => g.agents.includes("*"));
  return agents.filter((a) => {
    const own = groups.find((g) => g.agents.includes(a.toLowerCase()));
    return own ? fullBlock(own) : fullBlock(star);
  });
}

function collectSchemaTypes($: cheerio.CheerioAPI): { types: string[]; nodes: any[] } {
  const types = new Set<string>();
  const nodes: any[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n["@type"]) {
      nodes.push(n);
      ([] as string[]).concat(n["@type"]).forEach((t) => types.add(String(t)));
    }
    Object.values(n).forEach(walk);
  };
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      walk(JSON.parse($(el).contents().text()));
    } catch {
      /* invalid JSON-LD is ignored here and simply not counted */
    }
  });
  $("[itemtype]").each((_, el) => {
    const t = ($(el).attr("itemtype") || "").split("/").pop();
    if (t) types.add(t);
  });
  return { types: [...types], nodes };
}

export function runChecks(ctx: PageContext): { checks: Check[]; snapshot: Snapshot } {
  const $ = cheerio.load(ctx.html);
  const checks: Check[] = [];
  const add = (
    id: string,
    category: CategoryId,
    title: string,
    impact: Impact,
    status: Status,
    finding: string,
    recommendation = "",
  ) => checks.push({ id, category, title, impact, status, finding, recommendation: status === "pass" ? "" : recommendation });

  const origin = ctx.finalUrl.origin;
  const host = ctx.finalUrl.hostname.replace(/^www\./, "");

  // ---------- Extract ----------
  const title = $("head > title").first().text().trim().replace(/\s+/g, " ");
  const meta = (name: string) =>
    ($(`meta[name="${name}" i]`).attr("content") || $(`meta[property="${name}" i]`).attr("content") || "").trim();
  const description = meta("description");
  const robotsMeta = `${meta("robots")} ${meta("googlebot")} ${ctx.headers.get("x-robots-tag") || ""}`.toLowerCase();
  const canonical = ($('link[rel="canonical" i]').attr("href") || "").trim();
  const h1s = $("h1").map((_, e) => $(e).text().trim().replace(/\s+/g, " ")).get().filter(Boolean);
  const h2s = $("h2").map((_, e) => $(e).text().trim().replace(/\s+/g, " ")).get().filter(Boolean);
  const h3s = $("h3").map((_, e) => $(e).text().trim().replace(/\s+/g, " ")).get().filter(Boolean);
  const { types: schemaTypes, nodes: schemaNodes } = collectSchemaTypes($);
  const hasType = (...t: string[]) => schemaTypes.some((s) => t.includes(s));

  const $body = cheerio.load(ctx.html);
  $body("script,style,noscript,svg,template,iframe").remove();
  const bodyText = $body("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").length : 0;

  const imgs = $("img").toArray();
  const imgsNoAlt = imgs.filter((i) => $(i).attr("alt") === undefined).length;

  let internalLinks = 0;
  let externalLinks = 0;
  let trustLinks = 0;
  const linkSet = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = ($(a).attr("href") || "").trim();
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;
    try {
      const u = new URL(href, ctx.finalUrl);
      if (!/^https?:$/.test(u.protocol)) return;
      if (u.hostname.replace(/^www\./, "") === host) {
        internalLinks++;
        u.hash = "";
        linkSet.add(u.toString());
        if (/about|contact|team|privacy|terms/i.test(u.pathname + " " + $(a).text())) trustLinks++;
      } else externalLinks++;
    } catch {
      /* ignore malformed hrefs */
    }
  });

  // ---------- Technical SEO ----------
  const https = ctx.finalUrl.protocol === "https:";
  add("https", "technical", "Secure connection (HTTPS)", "high", https ? "pass" : "fail",
    https ? "The page is served over HTTPS." : "The page is served over plain HTTP.",
    "Install an SSL certificate and 301-redirect every HTTP URL to its HTTPS version. Browsers flag HTTP pages as not secure and Google uses HTTPS as a ranking signal.");

  const ok = ctx.status >= 200 && ctx.status < 300;
  add("status", "technical", "Page returns a healthy status code", "high", ok ? "pass" : "fail",
    `The server responded with HTTP ${ctx.status}.`,
    "The page must return HTTP 200 to be indexed. Fix server errors, or make sure crawlers are not being blocked by a firewall or bot-protection rule.");

  const ms = ctx.responseMs;
  add("response-time", "technical", "Server response time", "medium", ms < 800 ? "pass" : ms < 1800 ? "warn" : "fail",
    `The server started responding in ${ms} ms (measured from our audit server).`,
    "Aim for under 800 ms. Enable full-page caching, put a CDN in front of the site, and review slow plugins or database queries.");

  const kb = Math.round(Buffer.byteLength(ctx.html) / 1024);
  add("html-size", "technical", "HTML document size", "low", kb < 300 ? "pass" : kb < 800 ? "warn" : "fail",
    `The HTML document is ${kb} KB.`,
    "Keep HTML lean. Remove inline scripts, inline SVG sprites and unused markup so crawlers reach your content quickly.");

  const enc = (ctx.headers.get("content-encoding") || "").toLowerCase();
  add("compression", "technical", "Text compression", "low", /gzip|br|zstd|deflate/.test(enc) ? "pass" : "warn",
    enc ? `Responses are compressed with ${enc}.` : "No compression header was returned for the HTML.",
    "Enable Brotli or Gzip compression on the server or CDN to cut transfer size by 60 to 80 percent.");

  add("robots-txt", "technical", "robots.txt file", "medium", ctx.robotsTxt !== null ? "pass" : "warn",
    ctx.robotsTxt !== null ? "A robots.txt file is present." : "No robots.txt file was found at the site root.",
    "Add a robots.txt file that allows crawling of public pages and links to your XML sitemap.");

  add("sitemap", "technical", "XML sitemap", "medium", ctx.sitemapFound ? "pass" : "fail",
    ctx.sitemapFound ? "An XML sitemap was found." : "No XML sitemap was found in robots.txt or at /sitemap.xml.",
    "Generate an XML sitemap listing every indexable URL, reference it in robots.txt and submit it in Google Search Console and Bing Webmaster Tools.");

  const noindex = /noindex/.test(robotsMeta);
  add("indexable", "technical", "Page is indexable", "high", noindex ? "fail" : "pass",
    noindex ? "A noindex directive is present, so search engines will drop this page." : "No noindex directive was found.",
    "Remove the noindex directive from the robots meta tag or X-Robots-Tag header if this page should appear in search.");

  let canonStatus: Status = "warn";
  let canonFinding = "No canonical tag was found.";
  if (canonical) {
    try {
      const c = new URL(canonical, ctx.finalUrl);
      const same = c.hostname.replace(/^www\./, "") === host;
      canonStatus = same ? "pass" : "warn";
      canonFinding = same ? `Canonical URL is set to ${c.toString()}.` : `Canonical points to a different domain (${c.hostname}).`;
    } catch {
      canonFinding = "The canonical tag contains an invalid URL.";
    }
  }
  add("canonical", "technical", "Canonical URL", "medium", canonStatus, canonFinding,
    "Add a self-referencing <link rel=\"canonical\"> with the absolute preferred URL to every page to consolidate duplicate signals.");

  const viewport = $('meta[name="viewport" i]').attr("content") || "";
  add("viewport", "technical", "Mobile viewport", "high", /width\s*=\s*device-width/i.test(viewport) ? "pass" : "fail",
    viewport ? `Viewport is set to "${viewport}".` : "No responsive viewport meta tag was found.",
    "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">. Google indexes the mobile version of your site first.");

  const lang = ($("html").attr("lang") || "").trim();
  add("lang", "technical", "Language declared", "low", lang ? "pass" : "warn",
    lang ? `The page declares lang="${lang}".` : "The <html> tag has no lang attribute.",
    "Add a lang attribute (for example lang=\"en-IN\") so search engines and screen readers know the page language.");

  // ---------- On-page SEO ----------
  const tl = title.length;
  add("title", "onpage", "Title tag", "high", !tl ? "fail" : tl >= 30 && tl <= 65 ? "pass" : "warn",
    tl ? `Title is ${tl} characters: "${title.slice(0, 90)}".` : "The page has no <title> tag.",
    "Write a unique 50 to 60 character title that leads with the primary keyword and ends with the brand name.");

  const dl = description.length;
  add("meta-description", "onpage", "Meta description", "high", !dl ? "fail" : dl >= 110 && dl <= 165 ? "pass" : "warn",
    dl ? `Meta description is ${dl} characters.` : "The page has no meta description.",
    "Write a 140 to 160 character description that states the benefit and includes a call to action. It is your ad copy in the search results.");

  add("h1", "onpage", "Single H1 heading", "high", h1s.length === 1 ? "pass" : h1s.length === 0 ? "fail" : "warn",
    h1s.length === 1 ? `One H1 found: "${h1s[0].slice(0, 90)}".` : h1s.length === 0 ? "No H1 heading was found." : `${h1s.length} H1 headings were found.`,
    "Use exactly one H1 that describes the page topic and contains the primary keyword. Use H2 and H3 for sections.");

  add("headings", "onpage", "Heading structure", "medium", h2s.length >= 2 ? "pass" : h2s.length === 1 ? "warn" : "fail",
    `Found ${h2s.length} H2 and ${h3s.length} H3 headings.`,
    "Break content into clearly labelled H2 sections with H3 sub-points. A logical outline helps both readers and crawlers understand the page.");

  const altPct = imgs.length ? Math.round(((imgs.length - imgsNoAlt) / imgs.length) * 100) : 100;
  add("img-alt", "onpage", "Image alt text", "medium", altPct >= 90 ? "pass" : altPct >= 60 ? "warn" : "fail",
    imgs.length ? `${imgs.length - imgsNoAlt} of ${imgs.length} images have an alt attribute (${altPct}%).` : "No <img> elements were found on the page.",
    "Add descriptive alt text to every meaningful image and an empty alt=\"\" to decorative ones. Alt text drives image search and accessibility.");

  add("content-depth", "onpage", "Content depth", "high", wordCount >= 600 ? "pass" : wordCount >= 250 ? "warn" : "fail",
    `About ${wordCount} words of visible text were found in the HTML.`,
    "Thin pages rarely rank. Expand the page to fully cover the topic: what it is, who it is for, how it works, pricing factors, proof and FAQs.");

  add("internal-links", "onpage", "Internal linking", "medium", internalLinks >= 10 ? "pass" : internalLinks >= 3 ? "warn" : "fail",
    `Found ${internalLinks} internal links.`,
    "Link to your key service and category pages using descriptive anchor text so authority flows to the pages you want to rank.");

  const ogOk = !!(meta("og:title") && meta("og:description") && meta("og:image"));
  add("open-graph", "onpage", "Open Graph tags", "low", ogOk ? "pass" : meta("og:title") ? "warn" : "fail",
    ogOk ? "og:title, og:description and og:image are all present." : "One or more of og:title, og:description and og:image are missing.",
    "Add complete Open Graph tags so links shared on WhatsApp, LinkedIn and Facebook show a proper title, description and image.");

  add("twitter-card", "onpage", "Twitter / X card", "low", meta("twitter:card") ? "pass" : "warn",
    meta("twitter:card") ? `twitter:card is set to "${meta("twitter:card")}".` : "No twitter:card meta tag was found.",
    "Add <meta name=\"twitter:card\" content=\"summary_large_image\"> for rich previews on X.");

  const favicon = $('link[rel~="icon" i], link[rel="shortcut icon" i], link[rel="apple-touch-icon" i]').length > 0;
  add("favicon", "onpage", "Favicon", "low", favicon ? "pass" : "warn",
    favicon ? "A favicon is declared." : "No favicon link tag was found.",
    "Declare a favicon. Google shows it beside your result on mobile, and it improves brand recognition.");

  // ---------- AEO ----------
  add("structured-data", "aeo", "Structured data present", "high", schemaTypes.length ? "pass" : "fail",
    schemaTypes.length ? `Schema types found: ${schemaTypes.slice(0, 8).join(", ")}.` : "No JSON-LD or microdata structured data was found.",
    "Add JSON-LD structured data. Schema is how answer engines confirm what your page is about without guessing.");

  add("faq-schema", "aeo", "FAQ / Q&A schema", "medium", hasType("FAQPage", "QAPage", "HowTo") ? "pass" : "fail",
    hasType("FAQPage", "QAPage", "HowTo") ? "FAQ, Q&A or HowTo schema is present." : "No FAQPage, QAPage or HowTo schema was found.",
    "Add an FAQ section answering real customer questions and mark it up with FAQPage schema so assistants can lift your answers directly.");

  const qHeads = [...h2s, ...h3s].filter((h) => QUESTION_RE.test(h)).length;
  add("question-headings", "aeo", "Question-style headings", "medium", qHeads >= 3 ? "pass" : qHeads >= 1 ? "warn" : "fail",
    `${qHeads} headings are phrased as questions.`,
    "Rewrite key subheadings as the questions people actually ask (\"How much does X cost?\"). Answer engines match queries to question headings.");

  let directAnswers = 0;
  $("h2, h3").each((_, h) => {
    const p = $(h).nextAll("p").first().text().trim();
    const n = p ? p.split(/\s+/).length : 0;
    if (n >= 20 && n <= 70) directAnswers++;
  });
  add("direct-answers", "aeo", "Concise answer paragraphs", "medium", directAnswers >= 3 ? "pass" : directAnswers >= 1 ? "warn" : "fail",
    `${directAnswers} headings are followed by a concise 20 to 70 word answer.`,
    "Under each heading, lead with a 40 to 60 word direct answer before going into detail. This is the format featured snippets and voice assistants quote.");

  const lists = $("ul li, ol li").length;
  const tables = $("table").length;
  add("snippet-structure", "aeo", "Lists and tables", "low", lists >= 5 || tables >= 1 ? "pass" : "warn",
    `Found ${lists} list items and ${tables} tables.`,
    "Present steps as numbered lists and comparisons as tables. Structured blocks are far more likely to be pulled into answer boxes.");

  add("breadcrumb-schema", "aeo", "Breadcrumb schema", "low", hasType("BreadcrumbList") ? "pass" : "warn",
    hasType("BreadcrumbList") ? "BreadcrumbList schema is present." : "No BreadcrumbList schema was found.",
    "Add BreadcrumbList schema so engines understand where this page sits in your site hierarchy.");

  // ---------- GEO ----------
  add("llms-txt", "geo", "llms.txt file", "low", ctx.llmsTxtFound ? "pass" : "warn",
    ctx.llmsTxtFound ? "An llms.txt file is published." : "No llms.txt file was found at the site root.",
    "Publish /llms.txt summarising who you are, what you offer and your most important URLs. It is an emerging convention that gives AI systems a clean brief on your brand.");

  const blocked = ctx.robotsTxt ? blockedAgents(ctx.robotsTxt, AI_BOTS) : [];
  add("ai-crawlers", "geo", "AI crawlers allowed", "high", blocked.length === 0 ? "pass" : blocked.length >= 4 ? "fail" : "warn",
    blocked.length ? `robots.txt blocks: ${blocked.join(", ")}.` : "No major AI crawler is blocked in robots.txt.",
    "If you want to appear in AI answers, allow GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended in robots.txt. Blocked crawlers cannot cite you.");

  const org = schemaNodes.find((n) =>
    ([] as string[]).concat(n["@type"]).some((t) => /Organization|LocalBusiness|Corporation|ProfessionalService|Store|Person/.test(String(t))));
  const sameAs = org ? ([] as string[]).concat(org.sameAs || []).length : 0;
  add("entity-schema", "geo", "Brand entity schema", "high", org && sameAs >= 2 ? "pass" : org ? "warn" : "fail",
    org ? `Organization-type schema found with ${sameAs} sameAs profile link(s).` : "No Organization or LocalBusiness schema was found.",
    "Add Organization schema with name, logo, address, contact point and sameAs links to your LinkedIn, Instagram, Google Business Profile and other official profiles. This is how AI models tie mentions back to your brand.");

  const dated = !!(meta("article:published_time") || meta("article:modified_time") || $("time[datetime]").length ||
    schemaNodes.some((n) => n.datePublished || n.dateModified));
  const authored = !!(meta("author") || $('[rel="author"]').length || schemaNodes.some((n) => n.author));
  add("freshness-authorship", "geo", "Freshness and authorship signals", "medium", dated && authored ? "pass" : dated || authored ? "warn" : "fail",
    `Publish/updated date: ${dated ? "found" : "not found"}. Author: ${authored ? "found" : "not found"}.`,
    "Show a visible author and a last-updated date, and include them in schema. Generative engines prefer sources that are attributable and current.");

  add("citations", "geo", "Outbound citations", "low", externalLinks >= 2 ? "pass" : "warn",
    `Found ${externalLinks} links to external sources.`,
    "Back claims with links to credible sources and original data. Pages with verifiable statistics and citations are quoted more often by AI engines.");

  const ratio = ctx.html.length ? bodyText.length / ctx.html.length : 0;
  add("server-rendered", "geo", "Content readable without JavaScript", "high", wordCount >= 250 && ratio > 0.03 ? "pass" : wordCount >= 100 ? "warn" : "fail",
    `${wordCount} words are available in the raw HTML (text-to-code ratio ${(ratio * 100).toFixed(1)}%).`,
    "Most AI crawlers do not execute JavaScript. Server-render or pre-render your key content so it is present in the initial HTML.");

  add("trust-pages", "geo", "About and contact pages linked", "medium", trustLinks >= 2 ? "pass" : trustLinks === 1 ? "warn" : "fail",
    `Found ${trustLinks} links to about, contact, team or policy pages.`,
    "Link clearly to About, Contact and policy pages. They are core experience, expertise, authority and trust signals for both Google and AI engines.");

  return {
    checks,
    snapshot: {
      title,
      description,
      h1: h1s[0] || "",
      wordCount,
      images: imgs.length,
      internalLinks,
      externalLinks,
      schemaTypes: schemaTypes.slice(0, 12),
      siteName: meta("og:site_name"),
      orgName: org && typeof org.name === "string" ? org.name.trim() : "",
      noindex,
      links: [...linkSet],
    },
  };
}
