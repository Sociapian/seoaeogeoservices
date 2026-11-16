# Architecture

## Audit flow

```
Visitor enters brand.com
   │
   ├──► POST /api/audit/speed ─────► Google PageSpeed Insights (mobile)      ─┐ runs in parallel
   │                                                                           │
   └──► POST /api/audit ──────────► crawler (engine.ts)                       │
            fetch homepage, robots.txt, llms.txt, sitemap(s)                   │
            queue sitemap URLs + internal links (robots.txt respected)         │
            fetch up to CRAWL_MAX_PAGES pages, 4 at a time                     │
            run checks.ts on each page → roll up into site-wide checks         │
            ▼                                                                  │
         signed crawl result ──► POST /api/audit/ai ─► ai-visibility.ts        │
                                   1. write 3 buyer questions (no brand name)  │
                                   2. ask ChatGPT + Perplexity with web search │
                                   3. 1 direct brand question                  │
                                   4. detect mentions / citations / rivals     │
   ◄──────────── results stream into the page as each part finishes ◄─────────┘
   │
   └──► Visitor enters name + email → POST /api/audit/report
            verify all signatures → MX + disposable check → combine + score
            → build PDF (pdf-lib) → email it (SMTP) and/or download → save lead
```

The audit is **stateless**: no database. Each part returns its result plus an HMAC-signed copy; the browser sends the signed copies back for the report. The server rejects anything it did not sign, so the PDF cannot be faked and the paid AI endpoint only runs for a site that was just crawled.

## Scoring

- Each check: pass = 1, improve = 0.5, fix = 0, weighted by impact (high 3, medium 2, low 1).
- Category score = weighted points earned ÷ possible × 100.
- Overall = Technical 20% + On-page 20% + AEO 15% + GEO 15% + Speed 15% + AI visibility 15%. If speed or AI could not run, the remaining weights are scaled up to 100%.
- Grade: A ≥ 90, B ≥ 75, C ≥ 60, D ≥ 40, else F.

### Site-wide roll-up (crawl)

| Type | Checks | Rule |
| --- | --- | --- |
| Domain-level | HTTPS, status, response time, compression, robots.txt, sitemap, llms.txt, AI crawlers, entity schema, trust pages | Taken from the start page |
| Anywhere on site | FAQ schema, question headings, answer paragraphs, lists/tables, citations, freshness/authorship | Pass if any crawled page passes |
| Every page | Title, meta description, H1, headings, alt text, content depth, internal links, canonical, indexable, OG, etc. | Average across pages: ≥ 0.9 pass, ≥ 0.6 improve, else fix. Affected URLs listed. |
| Site checks | Broken pages, duplicate titles, duplicate meta descriptions | Computed across all crawled pages |

### Speed (pagespeed.ts)

Lighthouse performance score, LCP, CLS and TBT from the lab test; when Google has Chrome UX Report data for the URL, real-user LCP, CLS, INP and the overall Core Web Vitals verdict replace the lab values. Top opportunities (e.g. "Reduce unused JavaScript, save 1.3 s") go into the fix text.

### AI visibility (ai-visibility.ts)

- **Brand name**: Organization schema name → og:site_name → title segment matching the domain → domain label.
- **Questions**: generated from the site's title and description for `AI_COUNTRY`; fallback templates if generation fails.
- **Engines**: ChatGPT (OpenAI Responses API, `web_search` tool) and Perplexity (Agent API, `fast` preset). Both return answer text plus cited URLs.
- **Mentioned**: brand name or domain appears in the answer, or the domain is cited. **Cited**: the domain is among the sources. **Recognised**: the direct brand question gets a substantive answer (not "I couldn't find information").
- **Checks**: share of buyer-question answers mentioning the brand (≥ 50% pass), citations on buyer questions (≥ 2 pass), brand recognition by every engine.
- **Rivals**: domains the engines cited instead, ranked. This is often the most useful sales insight.
- AI answers vary run to run; the report labels this a snapshot.

## Email delivery

`REPORT_DELIVERY=email` (default with SMTP) sends the PDF as an attachment and shows "Report sent to …" instead of downloading. Before sending: disposable-domain block, optional business-email rule, and an MX lookup so mistyped or fake domains are rejected immediately. The lead record stores `reportEmailed: true` when the mail server accepted it.

## Security

- SSRF guard on every crawled URL and redirect hop (no private, loopback or link-local addresses), timeouts and size caps.
- Polite crawling: robots.txt rules for `*` are respected, non-HTML files skipped, 4 concurrent requests.
- Per-IP rate limits on every endpoint and a daily cap on AI checks.
- zod validation and a honeypot on forms; signed results with constant-time comparison.

## Files

```
src/lib/audit/
  fetcher.ts         SSRF-safe fetch
  checks.ts          34 page-level checks
  engine.ts          crawler + site-wide roll-up
  pagespeed.ts       Google PageSpeed Insights
  ai-visibility.ts   ChatGPT + Perplexity check
  score.ts           scoring (shared by browser and server)
  pdf.ts             PDF report
  sign.ts            HMAC seal / unseal
src/lib/mailer.ts, email-check.ts, report-email.ts, leads.ts
src/app/api/audit/{route.ts, speed/, ai/, report/}
src/components/VideoShowcase.tsx + src/content/videos.ts   explainer videos (public/videos/)
src/app/api/enquiry/route.ts                              homepage enquiry form
src/app/blog/, src/lib/blog.ts, src/content/blog/*.md     blog
src/components/motion/                                    RevealObserver, CountUp, WordRotator
```

## Homepage enquiry

`EnquiryForm` (client) → `POST /api/enquiry` → zod validation (business type must be one of `BUSINESS_TYPES`) → `checkEmail` (disposable list, optional business-email rule, MX lookup that is skipped if the server's own DNS is failing) → `saveLead({ type: "enquiry" })` → team notification via the lead sinks → acknowledgement email to the visitor (SMTP only, fire-and-forget).

## Blog

`src/lib/blog.ts` reads `src/content/blog/*.md` at build time (gray-matter for front matter, marked for Markdown). H2/H3 headings get stable ids; H2s form the table of contents; external links open in a new tab; tables are wrapped for horizontal scrolling. Client components import only `src/lib/blog-shared.ts` (types, category colours, date formatting) so no Node APIs reach the browser bundle.

Generated per post: static page (`/blog/[slug]`, `dynamicParams = false`), Open Graph image, BlogPosting + BreadcrumbList (+ FAQPage) schema, sitemap entry, RSS item and llms.txt line.

## Animation system

CSS keyframes live in `tailwind.config.ts`; reveal styles in `globals.css`. An inline script in `<head>` adds `html.js` before first paint; `RevealObserver` adds `.is-visible` via one IntersectionObserver and re-scans on DOM changes (client navigation). If the observer has not started within 2.5 s, the `js` class is removed so nothing stays hidden. `prefers-reduced-motion` disables all motion.
