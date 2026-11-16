import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, Clock, PenLine } from "lucide-react";
import { JsonLd, blogPostingSchema, breadcrumbSchema, faqSchema } from "@/components/JsonLd";
import { PostCard } from "@/components/blog/PostCard";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { Toc } from "@/components/blog/Toc";
import { site } from "@/config/site";
import { CATEGORY_STYLE, formatDate, getAllPosts, getPost, toMeta } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: post.author, url: site.parent.url }],
    keywords: post.tags,
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T09:00:00+05:30`,
      modifiedTime: `${post.updated}T09:00:00+05:30`,
      authors: [post.author],
      section: post.category,
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const { accent, label } = CATEGORY_STYLE[post.category];
  const related = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 2).map(toMeta);

  return (
    <>
      <ReadingProgress targetId="article-body" />

      <header className="hero-bg relative overflow-hidden text-white">
        <div className="grid-fade absolute inset-0" aria-hidden />
        <div className="blob right-[-5rem] top-[-3rem] h-80 w-80 animate-drift" style={{ background: `${accent}66` }} aria-hidden />
        <div className="container relative max-w-4xl py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-brand-200 animate-fade-in">
            <Link href="/" className="hover:text-white">Home</Link> <span aria-hidden>/</span>{" "}
            <Link href="/blog" className="hover:text-white">Blog</Link> <span aria-hidden>/</span> <span className="text-white">{post.category}</span>
          </nav>
          <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink animate-fade-up" style={{ background: accent }}>
            {post.category} · {label}
          </p>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl animate-fade-up" style={{ animationDelay: ".08s" }}>
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-brand-100 animate-fade-up" style={{ animationDelay: ".16s" }}>{post.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-200 animate-fade-up" style={{ animationDelay: ".24s" }}>
            <span className="inline-flex items-center gap-2"><PenLine size={15} aria-hidden /> {post.author}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} aria-hidden /> <time dateTime={post.date}>{formatDate(post.date)}</time></span>
            {post.updated !== post.date && <span>Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>}
            <span className="inline-flex items-center gap-2"><Clock size={15} aria-hidden /> {post.readingMinutes} min read</span>
          </div>
        </div>
      </header>

      <div className="container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article id="article-body" className="min-w-0">
          {post.takeaways.length > 0 && (
            <aside data-reveal className="mb-10 rounded-2xl border border-brand-100 bg-paper p-6" aria-label="Key takeaways">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-brand-700">Key takeaways</h2>
              <ul className="mt-4 space-y-3" data-stagger="90">
                {post.takeaways.map((t) => (
                  <li key={t} data-reveal="left" className="flex gap-3 text-[15px] leading-relaxed text-ink">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0" style={{ color: accent }} aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div
            className="prose prose-brand max-w-none md:prose-lg prose-headings:scroll-mt-28 prose-headings:font-extrabold prose-a:font-semibold prose-table:text-sm [&_.table-wrap]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {post.faq.length > 0 && (
            <section className="mt-14" aria-labelledby="faq-title">
              <h2 id="faq-title" className="text-2xl font-extrabold">Frequently asked questions</h2>
              <div className="mt-5 space-y-3">
                {post.faq.map((f) => (
                  <details key={f.q} className="group rounded-2xl border border-brand-100 bg-white px-5 open:shadow-card">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                      <h3 className="text-base font-bold">{f.q}</h3>
                      <ChevronDown size={18} className="shrink-0 text-brand-600 transition group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="pb-5 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div data-reveal className="mt-14 flex items-start gap-4 rounded-2xl border border-brand-100 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent text-lg font-extrabold text-white">S</span>
            <div>
              <p className="font-extrabold">{post.author}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Written by the search and AI visibility team at <a href={site.parent.url} className="font-semibold text-brand-700">{site.parent.name}</a>, a digital marketing agency founded in {site.parent.founded} and based in {site.address.locality}, India.
              </p>
            </div>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <Toc items={post.toc} />
            <div className="rounded-2xl bg-brand-900 p-6 text-white">
              <p className="text-lg font-extrabold leading-snug">How does your site score?</p>
              <p className="mt-2 text-sm text-brand-200">Free audit: SEO, AEO, GEO, speed and AI visibility.</p>
              <Link href="/free-seo-audit" className="btn-primary mt-5 w-full">Run free audit</Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="bg-paper py-16">
        <div className="container">
          <div data-reveal="zoom" className="hero-bg relative overflow-hidden rounded-[2rem] px-6 py-10 text-white md:flex md:items-center md:justify-between md:px-12">
            <div className="grid-fade absolute inset-0" aria-hidden />
            <div className="relative max-w-xl">
              <h2 className="text-2xl font-extrabold md:text-3xl">Want us to do this for your brand?</h2>
              <p className="mt-2 text-brand-100">Get a free audit and growth review from the {site.parent.name} team. We reply within {site.contact.responseTime}.</p>
            </div>
            <Link href="/#enquiry" className="btn-primary relative mt-6 md:mt-0">Request free review <ArrowRight size={16} aria-hidden /></Link>
          </div>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-2xl font-extrabold">Keep reading</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2" data-stagger="110">
                {related.map((p) => <PostCard key={p.slug} post={p} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <JsonLd data={blogPostingSchema(post)} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      {post.faq.length > 0 && <JsonLd data={faqSchema(post.faq)} />}
    </>
  );
}
