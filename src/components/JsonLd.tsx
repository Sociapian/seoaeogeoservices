import { site, fullAddress } from "@/config/site";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped is safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const orgId = `${site.url}/#organization`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": orgId,
  name: site.name,
  alternateName: `${site.parent.name} SEO, AEO & GEO Services`,
  url: site.url,
  logo: `${site.url}/icon.svg`,
  image: `${site.url}/opengraph-image`,
  description: site.description,
  email: site.contact.email,
  ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
  address: {
    "@type": "PostalAddress",
    ...(site.address.street ? { streetAddress: site.address.street } : {}),
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    ...(site.address.postalCode ? { postalCode: site.address.postalCode } : {}),
    addressCountry: site.address.countryCode,
  },
  geo: { "@type": "GeoCoordinates", latitude: site.address.geo.lat, longitude: site.address.geo.lng },
  hasMap: site.address.mapUrl,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: site.contact.email,
    ...(site.contact.phone ? { telephone: site.contact.phone.replace(/\s/g, "") } : {}),
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
  areaServed: [{ "@type": "Country", name: "India" }, "Worldwide"],
  parentOrganization: {
    "@type": "Organization",
    name: site.parent.name,
    url: site.parent.url,
    foundingDate: site.parent.founded,
    founder: { "@type": "Person", name: site.parent.founder },
  },
  sameAs: [site.parent.url, ...site.social.map((s) => s.url)],
  knowsAbout: [
    "Search Engine Optimization",
    "Answer Engine Optimization",
    "Generative Engine Optimization",
    "Technical SEO",
    "Schema markup",
    "AI search visibility",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.name,
  publisher: { "@id": orgId },
  inLanguage: "en-IN",
};

export function serviceSchema(name: string, description: string, anchor: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: name,
    description,
    url: `${site.url}/#${anchor}`,
    provider: { "@id": orgId },
    areaServed: "IN",
  };
}

export function faqSchema(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${site.url}${t.path}`,
    })),
  };
}

export function videoSchema(v: { title: string; description: string; poster: string; mp4: string; uploadDate: string; durationSec: number; transcript: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: [`${site.url}${v.poster}`],
    uploadDate: v.uploadDate,
    duration: `PT${v.durationSec}S`,
    contentUrl: `${site.url}${v.mp4}`,
    transcript: v.transcript,
    inLanguage: "en",
    publisher: { "@id": orgId },
  };
}

export function blogPostingSchema(p: { slug: string; title: string; description: string; date: string; updated: string; category: string; tags: string[]; author: string; readingMinutes: number }) {
  const url = `${site.url}/blog/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: p.title,
    description: p.description,
    url,
    mainEntityOfPage: url,
    image: `${url}/opengraph-image`,
    datePublished: `${p.date}T09:00:00+05:30`,
    dateModified: `${p.updated}T09:00:00+05:30`,
    articleSection: p.category,
    keywords: p.tags.join(", "),
    timeRequired: `PT${p.readingMinutes}M`,
    inLanguage: "en-IN",
    author: { "@type": "Organization", name: p.author, url: site.parent.url },
    publisher: { "@id": orgId },
    isPartOf: { "@id": `${site.url}/blog#blog` },
  };
}

export function blogSchema(posts: { slug: string; title: string; date: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${site.url}/blog#blog`,
    name: `${site.name} blog`,
    url: `${site.url}/blog`,
    publisher: { "@id": orgId },
    inLanguage: "en-IN",
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${site.url}/blog/${p.slug}`, datePublished: p.date })),
  };
}

export { fullAddress };
