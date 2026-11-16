"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Globe } from "lucide-react";

/** URL box used in the hero and CTA bands. Hands off to the full audit tool. */
export function HeroAuditForm({ dark = true, id = "hero-url" }: { dark?: boolean; id?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <form
      className={`flex w-full max-w-xl flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:rounded-full ${
        dark ? "bg-white/10 ring-1 ring-white/20 backdrop-blur" : "bg-white ring-1 ring-brand-100 shadow-card"
      }`}
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) router.push(`/free-seo-audit?url=${encodeURIComponent(url.trim())}`);
      }}
    >
      <label htmlFor={id} className="sr-only">Your website address</label>
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4">
        <Globe size={18} className="shrink-0 text-brand-500" aria-hidden />
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="url"
          required
          placeholder="yourwebsite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute/70 focus:outline-none"
        />
      </div>
      <button type="submit" className="btn-primary h-12 whitespace-nowrap">
        Get free audit <ArrowRight size={16} aria-hidden />
      </button>
    </form>
  );
}
