---
title: "Technical SEO checklist: 20 checks every website should pass"
seoTitle: "Technical SEO Checklist: 20 Checks Every Site Needs"
description: "A practical technical SEO checklist covering crawling, indexing, Core Web Vitals, on-page basics and AI crawler access, with what good looks like for each check."
date: "2026-11-03"
updated: "2026-11-03"
category: SEO
tags: ["technical SEO", "checklist", "Core Web Vitals", "site audit"]
takeaways:
  - "Technical SEO makes sure search engines and AI crawlers can reach, read and index your pages."
  - "Start with crawling and indexing: status codes, robots.txt, sitemap, canonicals and noindex tags."
  - "Core Web Vitals targets are LCP 2.5 s or less, INP 200 ms or less and CLS 0.1 or less."
  - "Recheck after every redesign, migration or CMS plugin change. Most technical problems are introduced by accident."
faq:
  - q: "How often should I run a technical SEO audit?"
    a: "Run a quick automated check monthly and a full audit at least twice a year, plus before and after any redesign, migration or major plugin change."
  - q: "Which technical SEO issues matter most?"
    a: "Anything that stops pages being crawled or indexed comes first: server errors, accidental noindex tags, robots.txt blocks and broken redirects. Speed and on-page issues come next."
---

Great content cannot rank if search engines cannot reach it. **Technical SEO** is the foundation: it makes sure crawlers can find, read and index your pages, and that visitors get a fast, stable experience. Use this checklist to review your own site. Each item says what to check and what good looks like.

## Crawling and indexing

### 1. HTTPS everywhere

Every page should load over HTTPS, and every HTTP URL should redirect to its HTTPS version with a single 301 redirect.

### 2. Healthy status codes

Important pages should return `200`. Removed pages should return `404` or `410`, or redirect to the closest relevant page. Look out for "soft 404s": error pages that return `200`.

### 3. A sensible robots.txt

Your `robots.txt` should allow crawling of public pages, block only what you mean to block (admin areas, internal search results) and list your sitemap. One wrong `Disallow: /` can remove an entire site from search.

### 4. An XML sitemap

List every indexable URL, keep it updated automatically, reference it in `robots.txt`, and submit it in Google Search Console and Bing Webmaster Tools. Do not include redirected, noindexed or error URLs.

### 5. No accidental noindex

Check for `noindex` in robots meta tags and `X-Robots-Tag` headers. Staging settings that are copied to the live site are a common cause of sudden traffic loss.

### 6. Canonical tags

Each page should have a self-referencing canonical URL, and duplicate or parameter versions should point to the preferred URL.

### 7. Clean redirects

Avoid chains (A → B → C) and loops. Point internal links straight at the final URL.

### 8. No broken internal links

Broken links waste crawl effort and frustrate visitors. Fix them or redirect the target.

## Speed and experience

### 9. Core Web Vitals

Google's thresholds for a good experience, measured at the 75th percentile of real visits, are:

| Metric | What it measures | Good |
| --- | --- | --- |
| Largest Contentful Paint (LCP) | Loading of the main content | 2.5 s or less |
| Interaction to Next Paint (INP) | Responsiveness to taps and clicks | 200 ms or less |
| Cumulative Layout Shift (CLS) | Visual stability | 0.1 or less |

Check them in PageSpeed Insights and the Core Web Vitals report in Search Console.

### 10. Fast server response

Aim for a server response under roughly 800 ms. Full-page caching and a CDN usually make the biggest difference.

### 11. Optimised images

Serve modern formats such as WebP or AVIF at the size they are displayed, set width and height to prevent layout shift, and lazy-load images below the fold (but never the main hero image).

### 12. Mobile-friendly layout

Use a responsive viewport (`width=device-width`), readable text without zooming and tap targets that are easy to hit. Google indexes the mobile version of your site.

## On-page foundations

### 13. Unique titles

Every page needs its own descriptive title of roughly 50 to 60 characters. Duplicate titles make pages compete with each other.

### 14. Meta descriptions

Write a unique 140 to 160 character description for each important page. It does not directly affect ranking, but it is your pitch in the results.

### 15. One clear H1 and logical headings

Use one `H1` that states the page topic, then `H2` and `H3` headings in order.

### 16. Descriptive image alt text

Add alt text to meaningful images. It helps accessibility and image search.

### 17. Structured data

Add relevant schema: `Organization` on the homepage, `BreadcrumbList` on inner pages, and `Article`, `Product` or `Service` where they fit. Validate it with Google's Rich Results Test.

## Search engines and AI crawlers

### 18. Content in the HTML

If your key content only appears after JavaScript runs, some crawlers will miss it, and most AI crawlers do not execute JavaScript at all. Server-side rendering or pre-rendering solves this.

### 19. Deliberate AI crawler rules

Decide which AI crawlers you allow: for example `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot` and `Google-Extended`. If you want to appear in AI answers, do not block them by accident.

### 20. Language and region signals

Declare the page language with the `lang` attribute. If you serve several languages or countries, use `hreflang` annotations so each audience gets the right version.

## Run the checks automatically

Our [free SEO, AEO and GEO audit](/free-seo-audit) crawls up to 25 pages of your site and runs more than 40 of these checks, including Google PageSpeed and an AI visibility test, then sends you a prioritised PDF. If you would rather have our team review everything and fix it with you, [request a free growth review](/#enquiry).
