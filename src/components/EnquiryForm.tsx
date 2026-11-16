"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { BUSINESS_TYPES, REVIEW_INCLUDES } from "@/content/enquiry";

/** Homepage hero card: "Get your free audit & growth review". Posts to /api/enquiry. */
export function EnquiryForm({ responseTime }: { responseTime: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [site, setSite] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setSite(String(data.website || ""));
    try {
      const res = await fetch("/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <div id="enquiry" className="relative scroll-mt-24 animate-slide-in-right" style={{ animationDelay: ".25s" }}>
      {/* soft glow behind the card */}
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-accent/40 via-brand-400/30 to-transparent blur-2xl" aria-hidden />
      <div className="relative rounded-3xl bg-white p-6 text-ink shadow-lift ring-1 ring-white/50 sm:p-7">
        {state === "done" ? (
          <div className="py-10 text-center" role="status">
            <span className="relative mx-auto grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 rounded-full bg-mint/30 animate-ping-soft" aria-hidden />
              <CheckCircle2 size={52} className="relative text-mint" aria-hidden />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">Request received</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              A strategist will review your website and reply within {responseTime}. While you wait, see your scores instantly.
            </p>
            <Link href={site ? `/free-seo-audit?url=${encodeURIComponent(site)}` : "/free-seo-audit"} className="btn-primary mt-6">
              Run my instant audit <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold leading-tight">Get your free audit &amp; growth review</h2>
            <p className="mt-1.5 text-sm text-ink-soft">See what&apos;s working, what&apos;s holding your website back on Google and AI search, and what to fix first.</p>
            <ul className="mt-4 flex flex-wrap gap-2" data-stagger="80">
              {REVIEW_INCLUDES.map((c) => (
                <li key={c} data-reveal="zoom" className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-ink">
                  <Check size={14} className="text-accent" aria-hidden /> {c}
                </li>
              ))}
            </ul>

            <form onSubmit={onSubmit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="e-business">Business name <span className="text-accent">*</span></label>
                <input className="field" id="e-business" name="businessName" required minLength={2} maxLength={100} autoComplete="organization" placeholder="E.g. Company name" />
              </div>
              <div>
                <label className="label" htmlFor="e-type">Business type <span className="text-accent">*</span></label>
                <select className="field" id="e-type" name="businessType" required defaultValue="">
                  <option value="" disabled>Select type</option>
                  {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="e-name">Your name <span className="text-accent">*</span></label>
                <input className="field" id="e-name" name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Your full name" />
              </div>
              <div>
                <label className="label" htmlFor="e-phone">Phone number <span className="text-accent">*</span></label>
                <input className="field" id="e-phone" name="phone" type="tel" required maxLength={20} autoComplete="tel" placeholder="E.g. 98XXXXXXXX" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="e-email">Business email <span className="text-accent">*</span></label>
                <input className="field" id="e-email" name="email" type="email" required maxLength={120} autoComplete="email" placeholder="name@company.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="e-website">Website URL</label>
                <input className="field" id="e-website" name="website" inputMode="url" maxLength={200} autoComplete="url" placeholder="https://yourwebsite.com" />
              </div>
              <div className="hidden" aria-hidden>
                <label>Leave this empty<input name="website_url" tabIndex={-1} autoComplete="off" /></label>
              </div>
              {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
              <button className="btn-primary sm:col-span-2 h-[52px] text-base" disabled={state === "sending"}>
                {state === "sending" ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Sending</> : <>Request free audit <ArrowRight size={18} aria-hidden /></>}
              </button>
              <p className="sm:col-span-2 text-center text-xs text-ink-mute">No spam. We&apos;ll respond within {responseTime}. By submitting, you agree to our <a href="/privacy-policy" className="underline underline-offset-2 hover:text-brand-700">Privacy Policy</a>.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
