/**
 * Single source of truth for brand and contact details.
 * Everything on the site (header, footer, contact page, JSON-LD schema,
 * PDF audit report) reads from here.
 *
 * Contact details, address and social profiles are taken from sociapa.com
 * (homepage and /contact-us, checked 11 November 2026). Empty strings are not rendered.
 */
export const site = {
  name: "SEO AEO GEO Services",
  shortName: "SEO·AEO·GEO",
  byline: "",
  url: (
    (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://www.seoaeogeoservices.com")
  ).replace(/\/$/, ""),
  description:
    "SEO, AEO and GEO services. Rank on Google, win answer boxes and get cited by ChatGPT, Gemini and Perplexity. Get a free SEO audit report in 60 seconds.",
  parent: {
    name: "Sociapa",
    /** Legal entity name for the privacy policy. Change if Sociapa is registered as e.g. "Sociapa ... Pvt. Ltd." */
    legalName: "Sociapa",
    url: "https://sociapa.com",
    founded: "2019",
    founder: "Dheeraj Raj",
    teamSize: "40+",
  },
  contact: {
    email: process.env.LEAD_NOTIFY_TO || "mail@sociapa.com",
    phone: "+91 120 313 0443",
    whatsapp: "918375828920", // digits only, with country code
    hours: "Monday to Saturday, 10:00 AM to 7:00 PM IST", // not listed on sociapa.com: confirm
    responseTime: "one business day", // shown under enquiry forms
  },
  address: {
    street: "BL-02, Sector 116",
    locality: "Noida",
    region: "Uttar Pradesh",
    postalCode: "", // sociapa.com shows "201306/201310": confirm the correct PIN
    country: "India",
    countryCode: "IN",
    mapUrl: "https://maps.google.com/?q=BL-02+Sector+116+Noida+India",
    geo: { lat: 28.569269682442908, lng: 77.39359281539613 },
  },
  otherOffices: ["Dubai, UAE", "London, UK"],
  social: [
    { label: "LinkedIn", url: "https://www.linkedin.com/company/sociapa" },
    { label: "Instagram", url: "https://www.instagram.com/sociapa.official" },
    { label: "Facebook", url: "https://www.facebook.com/sociapa" },
    { label: "YouTube", url: "https://www.youtube.com/@sociapa" },
    { label: "X (Twitter)", url: "https://twitter.com/sociapa" },
    { label: "Snapchat", url: "https://www.snapchat.com/add/sociapa" },
  ],
};

export function fullAddress(): string {
  const a = site.address;
  return [a.street, a.locality, [a.region, a.postalCode].filter(Boolean).join(" "), a.country]
    .filter(Boolean)
    .join(", ");
}

export const nav = [
  { label: "Services", href: "/#services" },
  { label: "SEO vs AEO vs GEO", href: "/#compare" },
  { label: "Process", href: "/#process" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/#faq" },
  { label: "Free Audit", href: "/free-seo-audit" },
  { label: "Contact", href: "/contact" },
];
