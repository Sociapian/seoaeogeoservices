import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { fullAddress, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Us for SEO, AEO & GEO Services",
  description:
    "Talk to the Sociapa team about SEO, AEO and GEO services. Send an enquiry, email us or visit our Noida office. We reply within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    url: "/contact",
    images: ["/opengraph-image"],
    title: "Contact Sociapa | SEO, AEO & GEO Services",
    description: "Talk to the Sociapa team about SEO, AEO and GEO. We reply within one business day.",
  },
};

export default function ContactPage() {
  const { contact, address, parent } = site;
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-ink-mute">
            <Link href="/" className="hover:text-brand-600">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Contact</span>
          </nav>
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="eyebrow animate-fade-up">Contact us</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl animate-fade-up" style={{ animationDelay: "80ms" }}>Let&apos;s make your brand the answer</h1>
              <p className="lead">
                Tell us about your website and goals. A strategist from {parent.name} will review your current search and AI visibility and reply within one business day.
              </p>

              <address className="mt-9 space-y-5 not-italic animate-fade-up" style={{ animationDelay: "200ms" }}>
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><MapPin size={19} aria-hidden /></span>
                  <div>
                    <h2 className="text-sm font-extrabold">{parent.name} head office</h2>
                    <p className="mt-0.5 text-sm text-ink-soft">{fullAddress()}</p>
                    {site.otherOffices.length > 0 && <p className="mt-0.5 text-xs text-ink-mute">Also in {site.otherOffices.join(" and ")}</p>}
                    <a href={address.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-accent">
                      Open in Google Maps <ExternalLink size={13} aria-hidden />
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><Mail size={19} aria-hidden /></span>
                  <div>
                    <h2 className="text-sm font-extrabold">Email</h2>
                    <a href={`mailto:${contact.email}`} className="mt-0.5 block text-sm text-ink-soft hover:text-brand-700">{contact.email}</a>
                  </div>
                </div>
                {contact.phone && (
                  <div className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><Phone size={19} aria-hidden /></span>
                    <div>
                      <h2 className="text-sm font-extrabold">Phone</h2>
                      <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="mt-0.5 block text-sm text-ink-soft hover:text-brand-700">{contact.phone}</a>
                    </div>
                  </div>
                )}
                {contact.whatsapp && (
                  <div className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-white"><MessageCircle size={19} aria-hidden /></span>
                    <div>
                      <h2 className="text-sm font-extrabold">WhatsApp</h2>
                      <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-sm text-ink-soft hover:text-brand-700">Chat with us</a>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><Clock size={19} aria-hidden /></span>
                  <div>
                    <h2 className="text-sm font-extrabold">Working hours</h2>
                    <p className="mt-0.5 text-sm text-ink-soft">{contact.hours}</p>
                  </div>
                </div>
              </address>

              {site.social.length > 0 && (
                <div className="mt-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
                  <h2 className="text-sm font-extrabold">Follow {parent.name}</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {site.social.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer me" className="inline-flex rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 transition hover:-translate-y-0.5 hover:border-brand-400">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-8 text-sm text-ink-soft">
                Looking for social media, influencer or performance marketing? Visit{" "}
                <a href={parent.url} className="font-bold text-brand-700 underline underline-offset-4">{parent.url.replace("https://", "")}</a>.
              </p>
            </div>

            <div>
              <div className="animate-slide-in-right" style={{ animationDelay: "150ms" }}><ContactForm /></div>
              <div className="mt-6 rounded-xl2 bg-brand-900 p-6 text-white">
                <h2 className="text-lg font-extrabold">Not ready to talk yet?</h2>
                <p className="mt-1 text-sm text-brand-200">Run a free audit and see your SEO, AEO and GEO scores in under a minute.</p>
                <Link href="/free-seo-audit" className="btn-primary mt-4">Get free audit report</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-paper">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <h2 className="h2">What happens after you contact us?</h2>
            <p className="lead">
              Every enquiry is read by a strategist, not a bot. Within one business day you get a reply, and if there is a fit we set up a short call. There is no cost and no obligation at any step.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3" data-stagger="130">
            {[
              { n: "01", t: "We review your site", d: "Before we speak, we run a full audit of your website and check how ChatGPT, Gemini, Perplexity and Google AI Overviews currently answer questions about your category." },
              { n: "02", t: "A 30-minute strategy call", d: "We walk you through what is holding your visibility back, which fixes will have the biggest impact, and what results are realistic for your market and budget." },
              { n: "03", t: "A clear proposal", d: "You receive a written roadmap covering SEO, AEO and GEO with scope, timelines, deliverables and a custom quote. You decide if and when to start." },
            ].map((s) => (
              <li key={s.n} data-reveal className="card card-hover">
                <span className="text-sm font-extrabold text-accent">{s.n}</span>
                <h3 className="mt-2 text-lg font-extrabold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", url: `${site.url}/contact`, name: "Contact Sociapa", mainEntity: { "@id": `${site.url}/#organization` } }} />
    </>
  );
}
