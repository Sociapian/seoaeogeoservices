# seoaeogeoservices.com

SEO, AEO & GEO services website for Sociapa, built with Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS. Includes a free audit tool that crawls a site, runs Google PageSpeed, checks ChatGPT and Perplexity for brand mentions, and emails a branded PDF report.

## Run it

```bash
npm install
cp .env.example .env.local     # fill in the keys below
npm run dev                    # http://localhost:3000
npm run build && npm start     # production
```

Node 18.18 or newer.

## Keys and settings for go-live

| Feature | Setting | Without it |
| --- | --- | --- |
| Signed audit results | `AUDIT_SECRET` | Required in production |
| Google speed test | `PAGESPEED_API_KEY` (free) | Works only on Google's tiny anonymous quota |
| AI visibility | `OPENAI_API_KEY` and/or `PERPLEXITY_API_KEY` | Section shows "Not available"; score re-weights |
| Email the PDF | `SMTP_*` | Report downloads in the browser instead |
| Lead capture | `LEAD_WEBHOOK_URL` and/or `LEAD_NOTIFY_TO` + SMTP | Leads only go to `.data/leads.jsonl` |

Sociapa's address, phone, WhatsApp, email and social profiles are already filled in `src/config/site.ts` (taken from sociapa.com). Still to confirm there: the PIN code (`address.postalCode`), working hours, and the registered legal name used in the privacy policy (`parent.legalName`). All form notifications go to `mail@sociapa.com` unless `LEAD_NOTIFY_TO` is set.

**AI cost:** each audit makes about 9 calls (1 to write the questions, then 4 questions × 2 engines with web search). Check current OpenAI and Perplexity pricing; `AI_DAILY_LIMIT` caps daily usage.

**Email deliverability:** send from your own domain and set up SPF, DKIM and DMARC for it, or reports will land in spam.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Homepage: hero with the "Free audit & growth review" enquiry form, services, explainer videos, SEO vs AEO vs GEO, process, industries, plans, latest blog posts, FAQ |
| `/free-seo-audit` | Audit tool with live scores and report form |
| `/blog` | Blog index with SEO / AEO / GEO filter |
| `/blog/[slug]` | Article pages (key takeaways, table of contents, FAQ, related posts) |
| `/contact` | Sociapa contact details, social profiles and contact form |
| `/privacy-policy` | Privacy policy (India DPDP Act, 2023), linked from every form and the footer |
| `/blog/rss.xml`, `/llms.txt`, `/sitemap.xml` | Generated automatically, including every blog post |

## Explainer videos

Three 20-second silent explainers (SEO, AEO, GEO) live in `public/videos/` as WebM (about 1 MB, served first) and MP4 (about 3 MB, Safari fallback), each with a poster image. They appear in the homepage "SEO, AEO and GEO in 20 seconds each" section (`src/components/VideoShowcase.tsx`); copy and transcripts are in `src/content/videos.ts`. Each video has VideoObject schema and a sitemap entry, and files are cached for a year. To replace a video, keep the same file names or update the paths in `videos.ts`.

## Review pack

`docs/review-pack.pdf` has screenshots of every page (desktop and mobile), the full copy deck, SEO metadata, the audit flow and developer handoff notes.

## Homepage enquiry form

The hero form ("Get your free audit & growth review") collects business name, business type, name, phone, business email and website, and posts to `/api/enquiry`. Each request is validated (disposable and non-existent email domains are rejected), saved as a lead of type `enquiry`, sent to `LEAD_NOTIFY_TO`, and acknowledged to the visitor by email when SMTP is configured. Business types and the four "review includes" chips are in `src/content/enquiry.ts`; the response-time promise ("one business day") is `site.contact.responseTime` in `src/config/site.ts`.

If you set `site.contact.whatsapp`, a floating "Chat with us" WhatsApp button appears on every page.

## Blog

Each article is a Markdown file in `src/content/blog/`. To publish a new one, add `my-new-post.md`:

```markdown
---
title: "Your article title"
seoTitle: "Shorter title for Google (55 characters or fewer)"
description: "One or two sentences for search results and social cards (about 150 characters)."
date: "2026-11-20"
updated: "2026-11-20"
category: SEO            # SEO, AEO or GEO
tags: ["tag one", "tag two"]
takeaways:               # shown in the Key takeaways box at the top
  - "First key point."
  - "Second key point."
faq:                     # optional; adds an FAQ section and FAQPage schema
  - q: "A question?"
    a: "The answer."
---

Intro paragraph...

## A section heading   (H2s build the table of contents)
```

Rebuild and deploy. The article gets its own page, share image, BlogPosting schema, and entries in the sitemap, RSS feed and llms.txt automatically. Covers are generated from the category, so no images are needed.

## Animations

- Hero entrance: staggered fade-up, rotating word in the headline, drifting colour blobs, form card slides in.
- Scroll reveals: any element with `data-reveal` (optionally `="left" | "right" | "zoom" | "fade"`) animates in once; children of a `data-stagger="100"` container animate in sequence. One observer handles the whole site (`src/components/motion/RevealObserver.tsx`).
- Count-up numbers, filling score bars, the process timeline line, card lifts, button light sweeps, link underlines, reading-progress bar and live table of contents on articles.
- Content is never hidden from search engines: reveal styles apply only once JavaScript is running (`html.js`), with a 2.5 s safety fallback. Visitors with "reduce motion" switched on see everything instantly.

## API

| Endpoint | Body | Returns |
| --- | --- | --- |
| `POST /api/audit` | `{ url }` | Crawl result + sealed copy |
| `POST /api/audit/speed` | `{ url }` | PageSpeed result + sealed copy |
| `POST /api/audit/ai` | `{ crawl: sealed }` | AI visibility result + sealed copy |
| `POST /api/audit/report` | lead fields + `{ crawl, speed?, ai? }` sealed | JSON (emailed) or PDF |
| `POST /api/enquiry` | businessName, businessType, name, phone, email, website? | `{ ok }` |
| `POST /api/contact` | contact form fields | `{ ok }` |

## Deploying

- **Vercel**: set the env vars, `LEAD_FILE_LOG=0`. The audit routes need up to 60 to 120 seconds (`maxDuration` is set per route); make sure your plan allows it.
- **VPS / Docker**: `npm run build && npm start` behind Nginx or Caddy with HTTPS.

Rate limits and the AI daily cap are in-memory per instance; use Redis/Upstash if you run several instances.

See `docs/ARCHITECTURE.md` for how the audit works.
