import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Bot, FileSearch, Gauge, MessageCircleQuestion, Sparkles, Wrench } from "lucide-react";
import { AuditTool } from "@/components/AuditTool";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/JsonLd";
import { site } from "@/config/site";
import { reportDelivery } from "@/lib/mailer";

export const metadata: Metadata = {
  title: "Free SEO, AEO & GEO Audit with AI Visibility Check",
  description:
    "Free audit: we crawl 25 pages, run 40+ checks, test Google page speed and check if ChatGPT and Perplexity mention your brand. Get a PDF with fixes.",
  alternates: { canonical: "/free-seo-audit" },
  openGraph: {
    url: "/free-seo-audit",
    images: ["/opengraph-image"],
    title: "Free SEO, AEO & GEO Audit Report",
    description: "Whole-site crawl, Google speed test and ChatGPT/Perplexity visibility check. PDF with prioritized fixes.",
  },
};

const areas = [
  { icon: Wrench, title: "Technical SEO", weight: "20%", items: ["HTTPS, status codes and broken pages", "robots.txt and XML sitemap", "Indexability and canonical tags", "Mobile viewport and language", "Server response and compression"] },
  { icon: FileSearch, title: "On-page SEO", weight: "20%", items: ["Titles and meta descriptions", "Duplicate titles across pages", "H1 and heading structure", "Image alt text and content depth", "Internal links and social tags"] },
  { icon: MessageCircleQuestion, title: "AEO readiness", weight: "15%", items: ["Structured data", "FAQ and HowTo schema", "Question-style headings", "Concise answer paragraphs", "Lists, tables and breadcrumbs"] },
  { icon: Sparkles, title: "GEO readiness", weight: "15%", items: ["AI crawler access in robots.txt", "llms.txt", "Brand entity schema", "Freshness and authorship", "Content readable without JavaScript"] },
  { icon: Gauge, title: "Speed & Core Web Vitals", weight: "15%", items: ["Google Lighthouse mobile score", "Largest Contentful Paint", "Layout shift and responsiveness", "Real-user Chrome data when available", "Top speed opportunities"] },
  { icon: Bot, title: "AI visibility", weight: "15%", items: ["Buyer questions asked to ChatGPT", "Same questions asked to Perplexity", "Is your brand mentioned?", "Is your website cited?", "Which sites AI cites instead"] },
];

const auditFaqs = [
  { q: "How does the free SEO audit work?", a: "Enter your website and three things run at once. Our crawler reads up to 25 pages through your sitemap and internal links and runs SEO, AEO and GEO checks on each. Google PageSpeed Insights tests your homepage on mobile. Then we ask ChatGPT and Perplexity real buyer questions about your category to see whether they mention your brand. Results appear as each part finishes." },
  { q: "How is the audit score calculated?", a: "Each check passes, needs improvement or fails, and is weighted by impact. Page-level checks are scored by the share of crawled pages that pass. Technical SEO and On-page SEO each count for 20% of the overall score; AEO, GEO, Speed and AI visibility count for 15% each. If a part cannot run, the others are re-weighted." },
  { q: "How do you check if ChatGPT and Perplexity mention my brand?", a: "We identify your category from your website, write three questions a buyer would ask without naming you, and ask them to ChatGPT and Perplexity with live web search switched on. We also ask one direct question about your brand. We record whether you were mentioned, whether your site was cited as a source, and which sites were cited instead. AI answers vary between runs, so treat it as a snapshot." },
  { q: "Is the audit report really free?", a: "Yes. Viewing your scores needs no signup. We ask for your name and email to send you the full PDF report." },
  { q: "What does the free audit not cover?", a: "It covers up to 25 pages and a handful of AI questions. It does not measure backlinks, keyword rankings or competitor traffic. Those are part of a full manual audit by the Sociapa team." },
];

export default function AuditPage() {
  const delivery = reportDelivery();
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container py-14 text-center md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-ink-mute">
            <Link href="/" className="hover:text-brand-600">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Free SEO audit</span>
          </nav>
          <p className="eyebrow animate-fade-up">Free tool by {site.parent.name}</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl animate-fade-up" style={{ animationDelay: "80ms" }}>
            Free SEO audit with speed and AI visibility scores
          </h1>
          <p className="lead mx-auto max-w-2xl animate-fade-up" style={{ animationDelay: "160ms" }}>
            We crawl up to 25 pages of your site, run Google&apos;s speed test and ask ChatGPT and Perplexity about your category. See your scores instantly and get a PDF with prioritized fixes.
          </p>
          <div className="mt-9">
            <Suspense fallback={<div className="mx-auto h-16 max-w-2xl animate-pulse rounded-full bg-brand-100" />}>
              <AuditTool delivery={delivery} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <h2 className="h2">What does the audit check?</h2>
            <p className="lead">More than 40 checks in six areas. Each area is scored out of 100 and weighted into your overall score.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-stagger="100">
            {areas.map((a) => (
              <article key={a.title} data-reveal className="card card-hover group">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><a.icon size={20} aria-hidden /></span>
                <h3 className="mt-4 text-lg font-extrabold">{a.title}</h3>
                <p className="mt-1 text-xs font-bold text-brand-700">{a.weight} of overall score</p>
                <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                  {a.items.map((i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />{i}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-paper">
        <div className="container max-w-3xl">
          <h2 className="h2 text-center">Questions about the audit</h2>
          <div className="mt-10 space-y-6" data-stagger="90">
            {auditFaqs.map((f) => (
              <div key={f.q} data-reveal className="card">
                <h3 className="text-base font-extrabold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-ink-soft">Need a deeper audit with backlinks, competitors and more AI questions?</p>
            <Link href="/contact" className="btn-brand mt-4">Request a full audit</Link>
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Free SEO audit", path: "/free-seo-audit" }])} />
      <JsonLd data={faqSchema(auditFaqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free SEO, AEO & GEO Audit Tool",
          url: `${site.url}/free-seo-audit`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          provider: { "@id": `${site.url}/#organization` },
        }}
      />
    </>
  );
}
