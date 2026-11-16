import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { BlogExplorer } from "@/components/blog/BlogExplorer";
import { JsonLd, blogSchema, breadcrumbSchema } from "@/components/JsonLd";
import { site } from "@/config/site";
import { getAllPosts, toMeta } from "@/lib/blog";

export const metadata: Metadata = {
  title: "SEO, AEO & GEO Blog: Search and AI Visibility Guides",
  description: "Practical guides from Sociapa on SEO, Answer Engine Optimization and Generative Engine Optimization: rank on Google and get cited by ChatGPT, Gemini and Perplexity.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "Sociapa SEO, AEO & GEO blog" }] } },
  openGraph: {
    url: "/blog",
    type: "website",
    title: "SEO, AEO & GEO Blog | Sociapa",
    description: "Practical guides on ranking in Google and getting cited by AI assistants.",
    images: ["/opengraph-image"],
  },
};

export default function BlogIndex() {
  const posts = getAllPosts().map(toMeta);
  return (
    <>
      <section className="hero-bg relative overflow-hidden text-white">
        <div className="grid-fade absolute inset-0" aria-hidden />
        <div className="blob left-[-6rem] top-10 h-72 w-72 bg-accent/50 animate-drift" aria-hidden />
        <div className="container relative py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-brand-200 animate-fade-in">
            <Link href="/" className="hover:text-white">Home</Link> <span aria-hidden>/</span> <span className="text-white">Blog</span>
          </nav>
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100 ring-1 ring-white/15 animate-fade-up">
            {site.parent.name} insights
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl animate-fade-up" style={{ animationDelay: ".08s" }}>
            Guides to ranking on Google and getting cited by AI
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-100 animate-fade-up" style={{ animationDelay: ".16s" }}>
            Practical, no-fluff articles on SEO, AEO and GEO from the team that does the work every day.
          </p>
          <a href="/blog/rss.xml" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-200 hover:text-white animate-fade-up" style={{ animationDelay: ".24s" }}>
            <Rss size={15} aria-hidden /> Subscribe via RSS
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <BlogExplorer posts={posts} />
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <div data-reveal="zoom" className="hero-bg relative overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white md:px-14">
            <div className="grid-fade absolute inset-0" aria-hidden />
            <div className="relative">
              <h2 className="text-3xl font-extrabold">See how your own site scores</h2>
              <p className="mx-auto mt-3 max-w-xl text-brand-100">Run the free audit for SEO, AEO, GEO, speed and AI visibility, or ask our team for a free growth review.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/free-seo-audit" className="btn-primary">Run free audit <ArrowRight size={16} aria-hidden /></Link>
                <Link href="/#enquiry" className="btn-outline-light">Request growth review</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={blogSchema(posts)} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
    </>
  );
}
