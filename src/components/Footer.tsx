import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { fullAddress, nav, site } from "@/config/site";
import { Logo } from "./Header";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#140d38] text-brand-100">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-200">
            The search and AI visibility vertical of{" "}
            <a href={site.parent.url} className="font-semibold text-white underline decoration-brand-400 underline-offset-4">
              {site.parent.name}
            </a>
            . We help brands rank on Google, win answer boxes and get cited by AI assistants.
          </p>
        </div>

        <nav aria-label="Services">
          <h2 className="text-sm font-bold text-white">Services</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link className="hover:text-white" href="/#seo">Search Engine Optimization</Link></li>
            <li><Link className="hover:text-white" href="/#aeo">Answer Engine Optimization</Link></li>
            <li><Link className="hover:text-white" href="/#geo">Generative Engine Optimization</Link></li>
            <li><Link className="hover:text-white" href="/free-seo-audit">Free SEO audit report</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-sm font-bold text-white">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {nav.slice(1, 5).map((n) => (
              <li key={n.href}><Link className="hover:text-white" href={n.href}>{n.label}</Link></li>
            ))}
            <li><Link className="hover:text-white" href="/contact">Contact us</Link></li>
            <li><a className="hover:text-white" href={site.parent.url}>Sociapa.com</a></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold text-white">Contact {site.parent.name}</h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-300" aria-hidden /><span>{fullAddress()}</span></p>
            <p className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-brand-300" aria-hidden /><a className="hover:text-white" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></p>
            {site.contact.phone && (
              <p className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-brand-300" aria-hidden /><a className="hover:text-white" href={`tel:${site.contact.phone.replace(/\s/g, "")}`}>{site.contact.phone}</a></p>
            )}
            <p className="flex gap-3"><Clock size={16} className="mt-0.5 shrink-0 text-brand-300" aria-hidden /><span>{site.contact.hours}</span></p>
          </address>
          {site.social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-3 text-sm">
              {site.social.map((s) => (
                <li key={s.url}><a className="rounded-full border border-brand-700 px-3 py-1 hover:border-brand-300 hover:text-white" href={s.url} target="_blank" rel="noopener noreferrer me">{s.label}</a></li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-5 pb-20 md:pb-5 md:pr-48 text-xs text-brand-300 md:flex-row md:items-center md:justify-between">
          <p>© {year} {site.parent.name}. All rights reserved. <Link href="/privacy-policy" className="ml-2 underline underline-offset-2 hover:text-white">Privacy policy</Link></p>
          <p>{site.name} is a service vertical of {site.parent.name}.</p>
        </div>
      </div>
    </footer>
  );
}
