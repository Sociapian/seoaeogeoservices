import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { site } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/JsonLd";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { WhatsAppButton } from "@/components/WhatsAppButton";

/* Marks the page as JS-enabled before first paint so scroll-reveal styles apply without a flash.
   Safety net: if the reveal script has not started within 2.5 s, show everything. */
const revealBoot = `document.documentElement.classList.add("js");setTimeout(function(){if(!window.__revealReady)document.documentElement.classList.remove("js")},2500);`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "SEO, AEO & GEO Services in India | Free SEO Audit | Sociapa",
    template: "%s | Sociapa",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.parent.name, url: site.parent.url }],
  creator: site.parent.name,
  publisher: site.parent.name,
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "Sociapa SEO, AEO & GEO blog" }] } },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    url: site.url,
    title: "SEO, AEO & GEO Services in India | Sociapa",
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: "SEO, AEO & GEO Services | Sociapa", description: site.description },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22145c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim().replace(/^["']|["']$/g, "");

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBoot }} />
      </head>
      <body>
        {recaptchaKey && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaKey)}`}
            strategy="lazyOnload"
          />
        )}
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppButton />
        <RevealObserver />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </body>
    </html>
  );
}
