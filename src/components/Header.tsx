"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/config/site";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={`${site.name} - home`}>
      <div className={`relative flex items-center justify-center transition-transform hover:scale-105 ${light ? "rounded-xl bg-white/95 p-1.5 shadow-sm" : ""}`}>
        <Image
          src="/images/sociapa-register-logo.png"
          alt="Sociapa Logo"
          width={150}
          height={100}
          priority
          className="h-9 w-auto object-contain"
        />
      </div>
      <span className="leading-none">
        <span className={`block text-[15px] font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
          SEO<span className="text-accent">·</span>AEO<span className="text-accent">·</span>GEO
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur transition-shadow ${
        scrolled ? "border-brand-100 shadow-[0_6px_24px_-16px_rgba(18,16,42,.4)]" : "border-transparent"
      }`}
    >
      <div className="container flex h-[68px] items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {nav.slice(0, 5).map((n) => (
            <Link key={n.href} href={n.href} className="link-underline pb-0.5 text-sm font-semibold text-ink-soft transition hover:text-brand-600">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/contact" className="text-sm font-bold text-brand-700 hover:text-brand-600">
            Contact
          </Link>
          <Link href="/free-seo-audit" className="btn-primary !py-2.5">
            Get free audit
          </Link>
        </div>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border border-brand-100 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-brand-100 bg-white lg:hidden">
          <div className="container flex flex-col py-3">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-semibold text-ink hover:bg-brand-50"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/free-seo-audit" onClick={() => setOpen(false)} className="btn-primary mt-3">
              Get free audit
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
