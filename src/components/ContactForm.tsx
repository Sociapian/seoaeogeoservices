"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { site } from "@/config/site";

const SERVICES = ["SEO", "AEO", "GEO", "SEO + AEO + GEO", "Full audit", "Not sure yet"];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div className="card flex flex-col items-center py-14 text-center" role="status">
        <CheckCircle2 size={44} className="text-mint" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold">Thank you. We have your message.</h2>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          A member of the {site.parent.name} team will get back to you within one business day.
        </p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 sm:grid-cols-2" noValidate={false}>
      <div>
        <label className="label" htmlFor="c-name">Full name *</label>
        <input className="field" id="c-name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="c-email">Work email *</label>
        <input className="field" id="c-email" name="email" type="email" required maxLength={120} autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="c-phone">Phone</label>
        <input className="field" id="c-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="+91" />
      </div>
      <div>
        <label className="label" htmlFor="c-company">Company</label>
        <input className="field" id="c-company" name="company" maxLength={100} autoComplete="organization" />
      </div>
      <div>
        <label className="label" htmlFor="c-website">Website</label>
        <input className="field" id="c-website" name="website" maxLength={200} placeholder="yourwebsite.com" />
      </div>
      <div>
        <label className="label" htmlFor="c-service">I am interested in</label>
        <select className="field" id="c-service" name="service" defaultValue="SEO + AEO + GEO">
          {SERVICES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="c-message">How can we help? *</label>
        <textarea className="field min-h-[130px]" id="c-message" name="message" required minLength={10} maxLength={2000} />
      </div>
      {/* Honeypot */}
      <div className="hidden" aria-hidden>
        <label>Leave this empty<input name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-mute">We only use your details to respond to this enquiry. See our <a href="/privacy-policy" className="underline underline-offset-2 hover:text-brand-700">Privacy Policy</a>.</p>
        <button className="btn-primary" disabled={state === "sending"}>
          {state === "sending" ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Sending</> : "Send message"}
        </button>
      </div>
    </form>
  );
}
