import Link from "next/link";
import {
  ArrowRight, Bot, Check, ChevronDown, Compass, FileText, MessageCircleQuestion, MessageSquare, PlayCircle, Search, Sparkles, Zap,
} from "lucide-react";
import { site } from "@/config/site";
import { auditIncludes, comparison, faqs, industries, pillars, plans, process, reasons } from "@/content/home";
import { videos } from "@/content/videos";
import { getAllPosts, toMeta } from "@/lib/blog";
import { EnquiryForm } from "@/components/EnquiryForm";
import { HeroAuditForm } from "@/components/HeroAuditForm";
import { JsonLd, faqSchema, serviceSchema, videoSchema } from "@/components/JsonLd";
import { VideoShowcase } from "@/components/VideoShowcase";
import { PostCard } from "@/components/blog/PostCard";
import { CountUp } from "@/components/motion/CountUp";
import { WordRotator } from "@/components/motion/WordRotator";

const ICONS = { seo: Search, aeo: MessageCircleQuestion, geo: Bot } as const;

/** AI and answer engines we optimise for (names only, no third-party logos). */
const ENGINES = [
  { name: "ChatGPT", icon: MessageSquare },
  { name: "Gemini", icon: Sparkles },
  { name: "Perplexity", icon: Compass },
  { name: "Copilot", icon: Bot },
  { name: "Grok", icon: Zap },
  { name: "AI Overviews", icon: Search },
];

const d = (ms: number) => ({ animationDelay: `${ms}ms` });

/** Sample report card used in the audit section; bars fill and score counts up on reveal. */
function SampleReport() {
  const rows = [
    { label: "Technical SEO", value: 92, color: "bg-mint" },
    { label: "On-page SEO", value: 78, color: "bg-mint" },
    { label: "AEO readiness", value: 61, color: "bg-amber-400" },
    { label: "GEO readiness", value: 44, color: "bg-red-400" },
    { label: "AI visibility", value: 33, color: "bg-red-400" },
  ];
  return (
    <div data-reveal="right" className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="rounded-3xl bg-white p-6 text-ink shadow-lift">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Sample audit report</p>
            <p className="mt-1 text-sm font-extrabold">yourbrand.com</p>
          </div>
          <div className="relative grid h-16 w-16 place-items-center">
            <span className="absolute inset-0 rounded-full border-[6px] border-amber-400" />
            <span className="absolute inset-0 rounded-full border-[6px] border-amber-400 animate-ping-soft" />
            <span className="text-xl font-extrabold"><CountUp to={68} /></span>
          </div>
        </div>
        <ul className="mt-6 space-y-4">
          {rows.map((r, i) => (
            <li key={r.label}>
              <div className="flex justify-between text-xs font-bold"><span>{r.label}</span><span>{r.value}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-50">
                <div className={`fill-bar h-full rounded-full ${r.color}`} style={{ width: `${r.value}%`, ["--bar-delay" as string]: `${i * 120}ms` }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-50 p-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><FileText size={16} /></span>
          <p className="text-xs font-semibold text-brand-900">Prioritized fixes emailed as a PDF you can share</p>
        </div>
      </div>
      <div className="absolute -left-6 top-24 hidden rounded-2xl bg-white px-4 py-3 text-ink shadow-card animate-float sm:block">
        <p className="flex items-center gap-2 text-xs font-bold"><Sparkles size={14} className="text-accent" /> AI crawlers: allowed</p>
      </div>
      <div className="absolute -right-4 bottom-24 hidden rounded-2xl bg-white px-4 py-3 text-ink shadow-card animate-float sm:block" style={d(1200)}>
        <p className="flex items-center gap-2 text-xs font-bold"><Check size={14} className="text-mint" /> Mentioned by ChatGPT: 1 of 3</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const latest = getAllPosts().slice(0, 3).map(toMeta);

  return (
    <>
      {/* ---------- Hero: headline + enquiry form ---------- */}
      <section className="hero-bg relative overflow-hidden text-white">
        <div className="grid-fade absolute inset-0" aria-hidden />
        <div className="blob left-[-8rem] top-[30%] h-80 w-80 bg-accent/40 animate-drift" aria-hidden />
        <div className="blob right-[10%] top-[-6rem] h-96 w-96 bg-brand-400/50 animate-drift" style={{ animationDelay: "-6s" }} aria-hidden />
        <div className="container relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-100 animate-fade-up">
              SEO · AEO · GEO services in India
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.4rem] animate-fade-up" style={d(80)}>
              Get found on Google.
              <span className="block">
                Get cited by{" "}
                <WordRotator
                  words={["ChatGPT", "Gemini", "Perplexity", "Copilot"]}
                  srText="AI assistants like ChatGPT, Gemini, Perplexity and Google AI Overviews."
                  className="bg-gradient-to-r from-[#ffb199] to-accent bg-clip-text text-transparent"
                />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100 animate-fade-up" style={d(160)}>
              {site.parent.name}&apos;s SEO, AEO and GEO team helps brands across India rank on Google, win answer boxes and get recommended by AI assistants, with one strategy and one team.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2.5" aria-label="AI and answer engines we optimise for">
              {ENGINES.map((e, i) => (
                <li
                  key={e.name}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:border-white/60 hover:bg-white/10 animate-fade-up"
                  style={d(240 + i * 70)}
                >
                  <e.icon size={16} className="text-brand-200" aria-hidden /> {e.name}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={d(700)}>
              <Link href="/free-seo-audit" className="btn-primary h-12 px-7">Run instant free audit <ArrowRight size={16} aria-hidden /></Link>
              <a href="#watch" className="btn-outline-light h-12"><PlayCircle size={18} aria-hidden /> Watch 20-sec explainers</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold text-brand-100 animate-fade-in" style={d(900)}>
              {["Rank on Google and Bing", "Win featured snippets", "Get recommended by AI"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={16} className="text-mint" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
          <EnquiryForm responseTime={site.contact.responseTime} />
        </div>
      </section>

      {/* ---------- Fact strip ---------- */}
      <section aria-label="About Sociapa" className="border-b border-brand-100 bg-paper">
        <dl className="container grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4" data-stagger="100">
          {[
            { value: <>Since {site.parent.founded}</>, label: "Sociapa has been growing brands online" },
            { value: <CountUp to={parseInt(site.parent.teamSize, 10) || 40} suffix="+" />, label: "Strategists, writers, developers and designers" },
            { value: <>3 in 1</>, label: "SEO, AEO and GEO under a single roadmap" },
            { value: <CountUp to={40} suffix="+" />, label: "Checks in every free audit report" },
          ].map((s) => (
            <div key={s.label} data-reveal className="px-2 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-3xl font-extrabold text-brand-700 md:text-4xl">{s.value}</span>
                <span className="mt-1 block text-sm text-ink-soft">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Pillars overview ---------- */}
      <section id="services" className="section">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <p className="eyebrow">What we do</p>
            <h2 className="h2 mt-4">Three ways people find brands today. One team to win all three.</h2>
            <p className="lead">
              Search has moved beyond ten blue links. People ask Google, they ask voice assistants and they ask AI chatbots. Each one chooses brands differently, so each needs its own optimization.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3" data-stagger="130">
            {pillars.map((p) => {
              const Icon = ICONS[p.id];
              return (
                <article key={p.id} data-reveal className="card card-hover group flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white transition duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-accent">
                      <Icon size={22} aria-hidden />
                    </span>
                    <span className="text-4xl font-extrabold text-brand-100 transition group-hover:text-brand-200">{p.tag}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold">{p.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{p.oneLine}</p>
                  <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-xs font-bold text-brand-800">Goal: {p.goal}</p>
                  <Link href={`#${p.id}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 group-hover:text-accent">
                    Explore {p.tag} services <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Explainer videos ---------- */}
      <section id="watch" className="section relative overflow-hidden bg-[#140d38] text-white" aria-labelledby="watch-title">
        <div className="grid-fade absolute inset-0" aria-hidden />
        <div className="blob right-[-6rem] bottom-0 h-80 w-80 bg-brand-500/40 animate-drift" aria-hidden />
        <div className="container relative">
          <div className="mb-10 max-w-2xl" data-reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100 ring-1 ring-white/15">
              <PlayCircle size={14} aria-hidden /> Watch
            </p>
            <h2 id="watch-title" className="h2 mt-4">SEO, AEO and GEO in 20 seconds each</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-200 md:text-lg">
              Three short explainers from the {site.parent.name} team on what each discipline does, what we work on and how we measure the result.
            </p>
          </div>
          <VideoShowcase videos={videos} />
        </div>
      </section>

      {/* ---------- Comparison ---------- */}
      <section id="compare" className="section bg-paper">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <p className="eyebrow">SEO vs AEO vs GEO</p>
            <h2 className="h2 mt-4">What is the difference between SEO, AEO and GEO?</h2>
            <p className="lead">
              SEO ranks your pages in search results. AEO makes your content the direct answer. GEO gets your brand cited inside AI-generated responses. They share one foundation and reinforce each other.
            </p>
          </div>
          <div data-reveal="zoom" className="mt-10 overflow-x-auto rounded-xl2 border border-brand-100 bg-white shadow-card">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">Comparison of SEO, AEO and GEO</caption>
              <thead>
                <tr className="bg-brand-900 text-white">
                  <th scope="col" className="px-5 py-4 font-bold">&nbsp;</th>
                  {comparison.columns.map((c) => (
                    <th key={c} scope="col" className="px-5 py-4 text-base font-extrabold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((r, i) => (
                  <tr key={r.label} className={`transition-colors hover:bg-brand-50 ${i % 2 ? "bg-brand-50/50" : ""}`}>
                    <th scope="row" className="px-5 py-4 align-top font-bold text-ink">{r.label}</th>
                    {r.values.map((v) => (
                      <td key={v} className="px-5 py-4 align-top leading-relaxed text-ink-soft">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- Detailed services ---------- */}
      {pillars.map((p, idx) => {
        const Icon = ICONS[p.id];
        return (
          <section key={p.id} id={p.id} className={`section ${idx % 2 ? "bg-paper" : ""}`}>
            <div className="container grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
              <div className="lg:sticky lg:top-28 lg:self-start" data-reveal="left">
                <p className="eyebrow"><Icon size={14} aria-hidden /> {p.tag} services</p>
                <h2 className="h2 mt-4">{p.name} ({p.tag})</h2>
                <h3 className="mt-6 text-base font-extrabold">What is {p.tag}?</h3>
                <p className="mt-2 text-base leading-relaxed text-ink-soft">{p.definition}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/free-seo-audit" className="btn-primary">Check my {p.tag} score</Link>
                  <a href="#enquiry" className="btn-ghost">Talk to an expert</a>
                </div>
                <a href={`#video-${p.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-accent">
                  <PlayCircle size={18} aria-hidden /> Watch the 20-second {p.tag} explainer
                </a>
              </div>
              <div>
                <h3 className="text-lg font-extrabold" data-reveal>What our {p.tag} service includes</h3>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2" data-stagger="80">
                  {p.deliverables.map((d) => (
                    <li key={d.title} data-reveal className="group rounded-2xl border border-brand-100 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-mint/15 text-mint transition group-hover:scale-110 group-hover:bg-mint group-hover:text-white">
                        <Check size={15} aria-hidden />
                      </span>
                      <h4 className="mt-3 text-sm font-extrabold">{d.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{d.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      {/* ---------- Audit CTA ---------- */}
      <section className="section">
        <div className="container">
          <div className="hero-bg relative overflow-hidden rounded-[2rem] px-6 py-12 text-white md:px-14 md:py-16">
            <div className="grid-fade absolute inset-0" aria-hidden />
            <div className="blob left-[40%] top-[-4rem] h-72 w-72 bg-accent/30 animate-drift" aria-hidden />
            <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
              <div data-reveal="left">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100 ring-1 ring-white/15">
                  <span className="relative flex h-2 w-2"><span className="absolute inset-0 rounded-full bg-mint animate-ping-soft" /><span className="relative h-2 w-2 rounded-full bg-mint" /></span>
                  Free tool · instant results
                </p>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">Get your free SEO, AEO and GEO audit report</h2>
                <p className="mt-4 max-w-lg text-brand-100">
                  Enter your website and see how it scores for search engines, answer engines and AI assistants. Get a PDF report with a prioritized list of fixes.
                </p>
                <div className="mt-7"><HeroAuditForm id="cta-url" /></div>
                <ul className="mt-7 grid gap-x-6 gap-y-2.5 text-sm font-semibold text-brand-100 sm:grid-cols-2">
                  {auditIncludes.map((a) => (
                    <li key={a} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-mint" aria-hidden /> {a}</li>
                  ))}
                </ul>
              </div>
              <SampleReport />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Process ---------- */}
      <section id="process" className="section bg-paper">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <p className="eyebrow">How we work</p>
            <h2 className="h2 mt-4">How does our SEO, AEO and GEO process work?</h2>
            <p className="lead">We follow five steps: audit, strategy, foundation fixes, content and authority building, then monthly measurement. Every step has a clear output you can review.</p>
          </div>
          <div className="relative mt-12" data-reveal="fade">
            <div className="draw-line absolute left-[10%] right-[10%] top-[34px] hidden h-0.5 bg-gradient-to-r from-brand-300 via-accent to-mint lg:block" aria-hidden />
            <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-5" data-stagger="140">
              {process.map((s) => (
                <li key={s.step} data-reveal className="card card-hover relative">
                  <span className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-accent text-sm font-extrabold text-white shadow-[0_0_0_6px_#faf9ff]">{s.step}</span>
                  <h3 className="mt-4 text-lg font-extrabold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Why Sociapa ---------- */}
      <section id="why" className="section">
        <div className="container">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow">Why {site.parent.name}</p>
            <h2 className="h2 mt-4">Why choose Sociapa for SEO, AEO and GEO?</h2>
            <p className="lead">
              {site.parent.name} is a digital marketing agency founded in {site.parent.founded} and based in {site.address.locality}, India. This vertical brings our search, content, development and PR teams together around one goal: making your brand the answer.
            </p>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-stagger="100">
            {reasons.map((r, i) => (
              <li key={r.title} data-reveal className="card card-hover group">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Industries ---------- */}
      <section id="industries" className="section relative overflow-hidden bg-brand-900 text-white">
        <div className="blob left-[-5rem] bottom-[-5rem] h-80 w-80 bg-accent/25 animate-drift" aria-hidden />
        <div className="container relative">
          <div className="max-w-2xl" data-reveal>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100">Industries</p>
            <h2 className="h2 mt-4">Search and AI visibility for every kind of brand</h2>
          </div>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-xl2 bg-white/10 sm:grid-cols-2 lg:grid-cols-4" data-stagger="70">
            {industries.map((i) => (
              <li key={i.name} data-reveal="fade" className="group bg-brand-900 p-6 transition duration-300 hover:bg-brand-800">
                <h3 className="text-base font-extrabold transition group-hover:text-[#ffb199]">{i.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-200">{i.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Plans ---------- */}
      <section id="plans" className="section">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <p className="eyebrow">Engagement models</p>
            <h2 className="h2 mt-4">Choose the scope that fits your stage</h2>
            <p className="lead">Every engagement starts with an audit and a custom quote, so you pay for the work that will move your numbers.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3" data-stagger="130">
            {plans.map((p) => {
              const featured = "featured" in p && p.featured;
              return (
                <article key={p.name} data-reveal className={`card card-hover flex flex-col ${featured ? "border-brand-500 ring-2 ring-brand-500 lg:-translate-y-2" : ""}`}>
                  {featured && <span className="mb-3 w-fit rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Most chosen scope</span>}
                  <h3 className="text-xl font-extrabold">{p.name}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{p.fit}</p>
                  <ul className="mt-5 flex-1 space-y-3">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-sm"><Check size={17} className="mt-0.5 shrink-0 text-mint" aria-hidden />{pt}</li>
                    ))}
                  </ul>
                  <a href="#enquiry" className={`mt-7 ${featured ? "btn-primary" : "btn-ghost"}`}>Request a quote</a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Blog teaser ---------- */}
      {latest.length > 0 && (
        <section id="blog" className="section bg-paper">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
              <div className="max-w-2xl">
                <p className="eyebrow">From the blog</p>
                <h2 className="h2 mt-4">Guides on SEO, AEO and GEO</h2>
                <p className="lead">Practical articles from our team on ranking in Google and getting cited by AI assistants.</p>
              </div>
              <Link href="/blog" className="btn-ghost">View all articles <ArrowRight size={15} aria-hidden /></Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-stagger="120">
              {latest.map((p) => <PostCard key={p.slug} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="section">
        <div className="container max-w-3xl">
          <div className="text-center" data-reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="h2 mt-4">Frequently asked questions</h2>
          </div>
          <div className="mt-10 space-y-3" data-stagger="60">
            {faqs.map((f, i) => (
              <details key={f.q} open={i === 0} data-reveal className="group rounded-2xl border border-brand-100 bg-white px-5 transition-shadow open:shadow-card hover:border-brand-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-bold">{f.q}</h3>
                  <ChevronDown size={18} className="shrink-0 text-brand-600 transition duration-300 group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-ink-soft animate-fade-in">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="pb-20">
        <div className="container">
          <div data-reveal="zoom" className="hero-bg relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white">
            <div className="grid-fade absolute inset-0" aria-hidden />
            <div className="blob left-[20%] top-[-5rem] h-72 w-72 bg-accent/30 animate-drift" aria-hidden />
            <div className="relative">
              <h2 className="h2 mx-auto max-w-2xl">Ready to be the answer your customers find?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">Start with a free audit, or ask the {site.parent.name} team for a free growth review and roadmap.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href="#enquiry" className="btn-primary h-12 px-7">Request free growth review</a>
                <Link href="/free-seo-audit" className="btn-outline-light h-12">Run instant audit</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={faqSchema(faqs)} />
      {pillars.map((p) => (
        <JsonLd key={p.id} data={serviceSchema(p.name, p.definition, p.id)} />
      ))}
      {videos.map((v) => (
        <JsonLd key={`v-${v.id}`} data={videoSchema(v)} />
      ))}
    </>
  );
}
