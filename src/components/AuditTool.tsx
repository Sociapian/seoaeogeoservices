"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle, ArrowRight, Bot, CheckCircle2, Download, FileText, Gauge, Globe, Loader2, Mail, RotateCcw, XCircle,
} from "lucide-react";
import { combine, prioritise } from "@/lib/audit/score";
import type { AiResult, Check, CrawlResult, SpeedResult, Status } from "@/lib/audit/types";

type Sealed = { payload: string; signature: string };
type PartState = "idle" | "pending" | "done" | "unavailable";
type Delivery = "email" | "both" | "download";

const STEPS = [
  "Fetching your homepage",
  "Reading robots.txt, sitemap and llms.txt",
  "Crawling your pages",
  "Checking technical and on-page SEO",
  "Testing AEO and GEO signals",
  "Scoring and prioritizing fixes",
];

const tone = (n: number) => (n >= 75 ? "text-mint" : n >= 50 ? "text-amber-500" : "text-red-500");
const bar = (n: number) => (n >= 75 ? "bg-mint" : n >= 50 ? "bg-amber-500" : "bg-red-500");
const stroke = (n: number) => (n >= 75 ? "#12b886" : n >= 50 ? "#f59e0b" : "#ef4444");

async function postJson<T>(url: string, body: unknown): Promise<{ result: T; sealed: Sealed }> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw Object.assign(new Error(json.error || "Request failed"), { status: res.status });
  return { result: json.result, sealed: json.sealed };
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "pass") return <CheckCircle2 size={18} className="shrink-0 text-mint" aria-label="Passed" />;
  if (status === "warn") return <AlertTriangle size={18} className="shrink-0 text-amber-500" aria-label="Needs improvement" />;
  return <XCircle size={18} className="shrink-0 text-red-500" aria-label="Needs fixing" />;
}

function ScoreRing({ score, grade, busy }: { score: number; grade: string; busy: boolean }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-40 w-40 shrink-0" role="img" aria-label={`Overall score ${score} out of 100, grade ${grade}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#ece8ff" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={stroke(score)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={`text-5xl font-extrabold leading-none ${tone(score)}`}>{score}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wider text-ink-mute">{busy ? "Updating" : `Grade ${grade}`}</div>
        </div>
      </div>
    </div>
  );
}

export function AuditTool({ delivery = "download" }: { delivery?: Delivery }) {
  const params = useSearchParams();
  const [url, setUrl] = useState(params.get("url") || "");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [crawl, setCrawl] = useState<CrawlResult | null>(null);
  const [speed, setSpeed] = useState<SpeedResult | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [speedState, setSpeedState] = useState<PartState>("idle");
  const [aiState, setAiState] = useState<PartState>("idle");

  const sealed = useRef<{ crawl?: Sealed; speed?: Sealed; ai?: Sealed }>({});
  const pending = useRef<{ speed?: Promise<unknown>; ai?: Promise<unknown> }>({});
  const runId = useRef(0);

  const [sending, setSending] = useState<"" | "waiting" | "sending">("");
  const [sent, setSent] = useState<null | { mode: "email" | "download"; email?: string; emailed?: boolean }>(null);
  const [formError, setFormError] = useState("");
  const autoRan = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (target: string) => {
    if (!target.trim()) return;
    const id = ++runId.current;
    const live = () => id === runId.current;
    setError(""); setCrawl(null); setSpeed(null); setAi(null); setSent(null); setFormError("");
    sealed.current = {};
    setRunning(true); setStep(0);
    setSpeedState("pending"); setAiState("idle");
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2500);

    // Part 2 starts immediately, in parallel with the crawl.
    pending.current.speed = postJson<SpeedResult>("/api/audit/speed", { url: target })
      .then(({ result, sealed: s }) => { if (!live()) return; sealed.current.speed = s; setSpeed(result); setSpeedState("done"); })
      .catch(() => live() && setSpeedState("unavailable"));

    try {
      const { result, sealed: s } = await postJson<CrawlResult>("/api/audit", { url: target });
      if (!live()) return;
      sealed.current.crawl = s;
      setCrawl(result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      // Part 3 needs the signed crawl (brand name, category context).
      setAiState("pending");
      pending.current.ai = postJson<AiResult>("/api/audit/ai", { crawl: s })
        .then(({ result: r, sealed: sa }) => { if (!live()) return; sealed.current.ai = sa; setAi(r); setAiState("done"); })
        .catch(() => live() && setAiState("unavailable"));
    } catch (e) {
      if (live()) { setError((e as Error).message); setSpeedState("idle"); }
    } finally {
      clearInterval(ticker);
      if (live()) setRunning(false);
    }
  }, []);

  useEffect(() => {
    const initial = params.get("url");
    if (initial && !autoRan.current) {
      autoRan.current = true;
      run(initial);
    }
  }, [params, run]);

  const report = useMemo(() => (crawl ? combine(crawl, speed, ai) : null), [crawl, speed, ai]);
  const issues: Check[] = report ? prioritise(report.checks) : [];
  const preview = issues.slice(0, 5);
  const busy = speedState === "pending" || aiState === "pending";

  async function getReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sealed.current.crawl) return;
    setFormError("");
    const lead = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (busy) {
      setSending("waiting");
      await Promise.allSettled([pending.current.speed, pending.current.ai]);
    }
    setSending("sending");
    try {
      const res = await fetch("/api/audit/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...lead, crawl: sealed.current.crawl, speed: sealed.current.speed ?? null, ai: sealed.current.ai ?? null }),
      });
      const type = res.headers.get("content-type") || "";
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "We could not generate the report. Please try again.");
      }
      if (type.includes("application/json")) {
        const json = await res.json();
        setSent({ mode: "email", email: json.email });
      } else {
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = `seo-aeo-geo-audit-${crawl?.host}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(href);
        setSent({ mode: "download", emailed: res.headers.get("x-report-emailed") === "1", email: String(lead.email) });
      }
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending("");
    }
  }

  const ctaLabel = delivery === "email" ? "Email me the full report" : delivery === "both" ? "Download and email the report" : "Download PDF report";

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); run(url); }}
        className="mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-brand-100 sm:flex-row sm:rounded-full">
        <label htmlFor="audit-url" className="sr-only">Website address to audit</label>
        <div className="flex flex-1 items-center gap-2 px-4">
          <Globe size={18} className="shrink-0 text-brand-500" aria-hidden />
          <input id="audit-url" type="text" inputMode="url" autoComplete="url" required
            placeholder="Enter your website, e.g. yourbrand.com" value={url} onChange={(e) => setUrl(e.target.value)}
            className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute/70 focus:outline-none" />
        </div>
        <button className="btn-primary h-12 whitespace-nowrap" disabled={running}>
          {running ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Auditing</> : <>Run free audit <ArrowRight size={16} aria-hidden /></>}
        </button>
      </form>

      {error && <p className="mx-auto mt-4 max-w-2xl rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700" role="alert">{error}</p>}

      {running && !crawl && (
        <div className="card mx-auto mt-8 max-w-2xl text-left" role="status" aria-live="polite">
          <p className="text-sm font-bold">Crawling your website. This usually takes 15 to 40 seconds.</p>
          <ol className="mt-4 space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm ${i <= step ? "text-ink" : "text-ink-mute/60"}`}>
                {i < step ? <CheckCircle2 size={16} className="text-mint" aria-hidden />
                  : i === step ? <Loader2 size={16} className="animate-spin text-brand-500" aria-hidden />
                  : <span className="h-4 w-4 rounded-full border border-brand-200" aria-hidden />}
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-ink-mute">The Google speed test and AI visibility check run alongside and appear when ready.</p>
        </div>
      )}

      {report && crawl && (
        <div ref={resultRef} className="mt-10 scroll-mt-24 text-left">
          <div className="card grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={report.score} grade={report.grade} busy={busy} />
              <p className="max-w-[12rem] break-all text-center text-xs font-semibold text-ink-mute">
                {crawl.host} · {crawl.pagesCrawled} page{crawl.pagesCrawled === 1 ? "" : "s"} crawled
              </p>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Your SEO, AEO and GEO scores</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {report.checks.length} checks run. {report.checks.length - issues.length} passed, {issues.length} need attention.
              </p>
              <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {report.categories.map((c) => {
                  const state = c.id === "performance" ? speedState : c.id === "ai" ? aiState : "done";
                  return (
                    <li key={c.id}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-bold">{c.label}</span>
                        {c.score !== null ? (
                          <span className={`font-extrabold ${tone(c.score)}`}>{c.score}<span className="text-xs font-semibold text-ink-mute">/100</span></span>
                        ) : state === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"><Loader2 size={12} className="animate-spin" aria-hidden /> Measuring</span>
                        ) : (
                          <span className="text-xs font-semibold text-ink-mute">Not available</span>
                        )}
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-brand-50">
                        {c.score !== null
                          ? <div className={`h-full rounded-full ${bar(c.score)}`} style={{ width: `${Math.max(c.score, 2)}%`, transition: "width .9s ease" }} />
                          : state === "pending" ? <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-200" /> : null}
                      </div>
                      {c.score !== null && <p className="mt-1 text-xs text-ink-mute">{c.passed} passed · {c.warnings} to improve · {c.failed} to fix</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="card flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Gauge size={20} aria-hidden /></span>
              <div className="text-sm">
                <h3 className="font-extrabold">Google mobile speed</h3>
                {speed ? (
                  <p className="mt-1 text-ink-soft">
                    Score <b className={tone(speed.score)}>{speed.score}/100</b> · LCP {(speed.lab.lcp / 1000).toFixed(1)} s · CLS {speed.lab.cls.toFixed(2)}
                    {speed.field ? ` · Real users: ${String(speed.field.overall).toLowerCase()}` : ""}
                  </p>
                ) : speedState === "pending" ? (
                  <p className="mt-1 text-ink-soft">Running Google PageSpeed Insights. This takes 20 to 60 seconds.</p>
                ) : (
                  <p className="mt-1 text-ink-soft">Google's speed test could not measure this site right now. The rest of the report is unaffected.</p>
                )}
              </div>
            </div>
            <div className="card flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Bot size={20} aria-hidden /></span>
              <div className="text-sm">
                <h3 className="font-extrabold">AI visibility</h3>
                {ai ? (
                  <p className="mt-1 text-ink-soft">
                    {ai.brand} was mentioned in <b className={tone(ai.shareOfVoice >= 50 ? 80 : ai.shareOfVoice > 0 ? 60 : 0)}>{ai.shareOfVoice}%</b> of {ai.engines.join(" and ")} answers about {ai.category}.
                    {ai.topSources[0] ? ` Most-cited source instead: ${ai.topSources[0].domain}.` : ""}
                  </p>
                ) : aiState === "pending" ? (
                  <p className="mt-1 text-ink-soft">Asking ChatGPT and Perplexity buyer questions about your category. This takes 20 to 60 seconds.</p>
                ) : (
                  <p className="mt-1 text-ink-soft">The AI visibility check is not available right now. Ask our team for a full AI visibility audit.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="card">
              <h2 className="text-lg font-extrabold">Top issues found</h2>
              {preview.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">No issues found by the automated checks. Get the report for the full breakdown.</p>
              ) : (
                <ul className="mt-4 divide-y divide-brand-100">
                  {preview.map((c) => (
                    <li key={c.id} className="flex gap-3 py-3.5">
                      <StatusIcon status={c.status} />
                      <div>
                        <p className="text-sm font-bold">{c.title}</p>
                        <p className="mt-0.5 text-sm text-ink-soft">{c.finding}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {issues.length > preview.length && (
                <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
                  + {issues.length - preview.length} more issues, each with a step-by-step fix and affected pages, in your PDF report.
                </p>
              )}
              <button type="button" onClick={() => { runId.current++; setCrawl(null); setUrl(""); setSpeedState("idle"); setAiState("idle"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-600">
                <RotateCcw size={14} aria-hidden /> Audit another site
              </button>
            </div>

            <div className="card border-brand-200 bg-gradient-to-b from-brand-50 to-white">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><FileText size={20} aria-hidden /></span>
                <div>
                  <h2 className="text-lg font-extrabold leading-tight">Get the full audit report</h2>
                  <p className="text-xs text-ink-soft">Free PDF: every check, affected pages, speed and AI findings, and a prioritized fix list.</p>
                </div>
              </div>
              {sent ? (
                <div className="mt-6 rounded-xl bg-white p-5 text-center ring-1 ring-brand-100" role="status">
                  {sent.mode === "email" ? <Mail size={36} className="mx-auto text-mint" aria-hidden /> : <CheckCircle2 size={36} className="mx-auto text-mint" aria-hidden />}
                  <p className="mt-2 text-sm font-bold">
                    {sent.mode === "email" ? `Report sent to ${sent.email}` : "Your report has downloaded."}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {sent.mode === "email"
                      ? "Check your inbox (and spam folder) in the next couple of minutes."
                      : sent.emailed ? `A copy is also on its way to ${sent.email}.` : "Want help fixing these issues? Our team can walk you through it."}
                  </p>
                  <a href="/contact" className="btn-brand mt-4">Book a free strategy call</a>
                </div>
              ) : (
                <form onSubmit={getReport} className="mt-5 grid gap-3">
                  <div>
                    <label className="label" htmlFor="r-name">Full name *</label>
                    <input className="field" id="r-name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
                  </div>
                  <div>
                    <label className="label" htmlFor="r-email">Work email *</label>
                    <input className="field" id="r-email" name="email" type="email" required maxLength={120} autoComplete="email" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="r-phone">Phone</label>
                      <input className="field" id="r-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="+91" />
                    </div>
                    <div>
                      <label className="label" htmlFor="r-company">Company</label>
                      <input className="field" id="r-company" name="company" maxLength={100} autoComplete="organization" />
                    </div>
                  </div>
                  <div className="hidden" aria-hidden>
                    <label>Leave this empty<input name="website_url" tabIndex={-1} autoComplete="off" /></label>
                  </div>
                  {formError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{formError}</p>}
                  <button className="btn-primary mt-1 w-full" disabled={!!sending}>
                    {sending === "waiting" ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Finishing speed and AI checks</>
                      : sending === "sending" ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Preparing your report</>
                      : <>{delivery === "email" ? <Mail size={16} aria-hidden /> : <Download size={16} aria-hidden />} {ctaLabel}</>}
                  </button>
                  <p className="text-center text-xs text-ink-mute">
                    {delivery === "download" ? "We may contact you once about your report. No spam." : "The report is sent to this address. We may contact you once about it. No spam."}{" "}<a href="/privacy-policy" className="underline underline-offset-2 hover:text-brand-700">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
