import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { fullAddress, site } from "@/config/site";

const UPDATED = "2026-11-11";
const updatedLabel = "11 November 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.parent.name} collects, uses and protects personal data on ${site.url.replace(/^https?:\/\//, "")}, including enquiry forms and the free SEO audit tool.`,
  alternates: { canonical: "/privacy-policy" },
  openGraph: { url: "/privacy-policy", title: `Privacy Policy | ${site.name}`, images: ["/opengraph-image"] },
};

const domain = site.url.replace(/^https?:\/\//, "");
const { email } = site.contact;
const Mail = () => <a href={`mailto:${email}`}>{email}</a>;

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    body: (
      <>
        <p>
          {domain} (the “website”) is operated by {site.parent.legalName} (“{site.parent.name}”, “we”, “us”), a digital marketing agency with its head office at {fullAddress()}.
          For this website, {site.parent.name} is the <strong>data fiduciary</strong> under India&apos;s Digital Personal Data Protection Act, 2023 (“DPDP Act”): we decide why and how your personal data is processed.
        </p>
        <p>This policy explains what personal data we collect through this website, why, who we share it with, how long we keep it, and the rights you have.</p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "2. Personal data we collect",
    body: (
      <>
        <p>We only collect what you give us through our forms, plus limited technical data needed to run the website securely.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Where</th><th>What we collect</th></tr>
            </thead>
            <tbody>
              <tr><td>Free audit &amp; growth review form (homepage)</td><td>Business name, business type, your name, phone number, business email, website URL (optional)</td></tr>
              <tr><td>Contact form</td><td>Name, email, phone (optional), company (optional), website (optional), service of interest, your message</td></tr>
              <tr><td>Free SEO audit report form</td><td>Name, email, phone (optional), company (optional), plus the website address you audited and its overall score</td></tr>
              <tr><td>All forms</td><td>IP address and browser type (user agent), recorded with your submission to prevent spam and abuse</td></tr>
              <tr><td>Server logs</td><td>IP address, pages requested, date and time, browser type, kept by our hosting provider for security and troubleshooting</td></tr>
            </tbody>
          </table>
        </div>
        <p>We do not ask for, and ask you not to send us, sensitive information such as financial account details, passwords, health information or government ID numbers.</p>
      </>
    ),
  },
  {
    id: "audit-tool",
    title: "3. How the free SEO audit tool works",
    body: (
      <>
        <p>When you enter a website address in the free audit tool:</p>
        <ul>
          <li>Our server reads the publicly available pages of that website, its robots.txt, sitemap and llms.txt files. We only read what any visitor or search engine can see.</li>
          <li>The website address is sent to <strong>Google PageSpeed Insights</strong> to measure page speed.</li>
          <li>To check AI visibility, the brand name, page title and description, and a few generated questions about the brand&apos;s category are sent to <strong>OpenAI (ChatGPT)</strong> and <strong>Perplexity</strong>. No personal data about you is included in these requests.</li>
        </ul>
        <p>
          Audit results are not stored in a database on our servers. They are returned to your browser, and if you request the full report, a PDF is generated and emailed to you. We keep a record of the audited website address and its overall score with your request, so our team can follow up.
        </p>
        <p>Please only audit websites you own or are authorised to review on behalf of their owner.</p>
      </>
    ),
  },
  {
    id: "why",
    title: "4. Why we use your data",
    body: (
      <>
        <p>We process your personal data on the basis of the <strong>consent</strong> you give when you submit a form, for these specific purposes:</p>
        <ul>
          <li>to respond to your enquiry and prepare the free audit and growth review you asked for;</li>
          <li>to email you the audit report you requested and an acknowledgement of your request;</li>
          <li>to contact you about your enquiry by email, phone or WhatsApp;</li>
          <li>to prepare a proposal if you ask us to.</li>
        </ul>
        <p>
          We also process limited technical data (such as IP addresses) to keep the website secure, prevent spam and abuse, and comply with the law, as permitted under the DPDP Act. We do not use your data for automated decisions that affect you, and we do not sell personal data.
        </p>
        <p>
          We will not add you to a newsletter or marketing list unless you separately agree. If we contact you about our services, every email will tell you how to opt out.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "5. Who we share it with",
    body: (
      <>
        <p>We share personal data only with service providers that help us run this website and respond to you, under contracts that require them to protect it and use it only on our instructions:</p>
        <ul>
          <li><strong>Website hosting</strong>: to serve the website and process form submissions;</li>
          <li><strong>Email delivery</strong>: to send your report, acknowledgements and our replies;</li>
          <li><strong>Lead management tools</strong> (for example a CRM or spreadsheet integration): to record and follow up on your enquiry;</li>
          <li><strong>Audit tool providers</strong> (Google PageSpeed Insights, OpenAI, Perplexity): website information only, as described in section 3.</li>
        </ul>
        <p>
          We may also disclose personal data if required by law, a court order or a government authority, or to protect the rights, property or safety of {site.parent.name}, our clients or others. Some service providers may process data outside India; where they do, we take reasonable steps to make sure it stays protected, in line with any restrictions notified by the Government of India.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "6. Cookies and tracking",
    body: (
      <>
        <p>
          This website does <strong>not</strong> set cookies and does not use advertising or analytics trackers. Our fonts and videos are hosted on our own servers, so loading a page does not send your data to third-party font or video services.
        </p>
        <p>If we add analytics or advertising tools in future, we will update this policy and ask for your consent where required before they run.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "7. How long we keep it",
    body: (
      <ul>
        <li><strong>Enquiries and audit report requests</strong>: up to 24 months after our last contact with you, unless you become a client or ask us to delete them sooner.</li>
        <li><strong>Client records</strong>: for the duration of our engagement and afterwards as long as required for legal, tax and accounting purposes.</li>
        <li><strong>Server logs</strong>: only as long as needed for security and troubleshooting.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "8. Your rights",
    body: (
      <>
        <p>Under the DPDP Act you have the right to:</p>
        <ul>
          <li><strong>access</strong> a summary of the personal data we hold about you and how we use it;</li>
          <li><strong>correct, complete or update</strong> inaccurate or incomplete data;</li>
          <li><strong>erase</strong> your data when it is no longer needed for the purpose you gave it for, unless the law requires us to keep it;</li>
          <li><strong>withdraw your consent</strong> at any time, as easily as you gave it (this does not affect processing already carried out);</li>
          <li><strong>grievance redressal</strong>: raise a complaint with us about how we handle your data;</li>
          <li><strong>nominate</strong> another person to exercise these rights on your behalf in the event of death or incapacity.</li>
        </ul>
        <p>
          To use any of these rights, email <Mail /> with the subject “Privacy request” from the email address you used with us. We may need to verify your identity before acting. We aim to respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "grievance",
    title: "9. Grievance officer and complaints",
    body: (
      <>
        <p>If you have a concern about how we handle your personal data, please contact our Grievance Officer:</p>
        <p>
          <strong>Grievance Officer, {site.parent.name}</strong><br />
          {fullAddress()}<br />
          Email: <Mail />
          {site.contact.phone && <><br />Phone: <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`}>{site.contact.phone}</a></>}
        </p>
        <p>If you are not satisfied with our response, you may complain to the Data Protection Board of India.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "10. How we protect your data",
    body: (
      <p>
        The website is served only over HTTPS. Form submissions are validated on our server, protected against spam and automated abuse, and delivered only to authorised members of our team and the service providers listed above. No method of transmission or storage is completely secure, but we take reasonable security safeguards to prevent personal data breaches and will notify affected users and authorities of a breach as required by law.
      </p>
    ),
  },
  {
    id: "children",
    title: "11. Children",
    body: (
      <p>
        This website and our services are intended for businesses and adults. We do not knowingly collect personal data from anyone under 18. If you believe a child has submitted personal data, email <Mail /> and we will delete it.
      </p>
    ),
  },
  {
    id: "other-sites",
    title: "12. Links to other websites",
    body: (
      <p>
        This website links to other sites, including sociapa.com and our social media profiles. Their privacy practices are governed by their own policies, which we encourage you to read.
      </p>
    ),
  },
  {
    id: "changes",
    title: "13. Changes to this policy",
    body: (
      <p>
        We may update this policy when our website or the law changes. The date at the top shows when it was last updated. If we make significant changes, we will highlight them on this page.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container max-w-4xl py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-semibold text-ink-mute">
            <Link href="/" className="hover:text-brand-600">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Privacy policy</span>
          </nav>
          <p className="eyebrow animate-fade-up">Legal</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl animate-fade-up" style={{ animationDelay: "80ms" }}>Privacy policy</h1>
          <p className="lead animate-fade-up" style={{ animationDelay: "160ms" }}>
            How {site.parent.name} collects, uses and protects your personal data on {domain}.
          </p>
          <p className="mt-4 text-sm text-ink-mute animate-fade-up" style={{ animationDelay: "220ms" }}>
            Last updated: <time dateTime={UPDATED}>{updatedLabel}</time>
          </p>
        </div>
      </section>

      <div className="container grid max-w-6xl gap-12 pb-20 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="Sections" className="sticky top-28">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Contents</p>
            <ol className="mt-3 space-y-1.5 border-l border-brand-100">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-sm text-ink-soft transition hover:border-accent hover:text-brand-700">
                    {s.title.replace(/^\d+\.\s*/, "")}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="prose prose-brand max-w-none prose-headings:scroll-mt-28 prose-h2:text-2xl prose-h2:font-extrabold prose-table:text-sm [&_.table-wrap]:overflow-x-auto">
          <div className="not-prose mb-8 rounded-2xl border border-brand-100 bg-paper p-6 text-[15px] leading-relaxed text-ink">
            <strong>In short:</strong> we collect the details you type into our forms so we can reply, send your audit report and follow up on your request. This site sets no cookies or trackers, we do not sell your data, and you can ask us to see, correct or delete it at any time by emailing <a className="font-semibold text-brand-700" href={`mailto:${email}`}>{email}</a>.
          </div>
          {sections.map((s) => (
            <section key={s.id} aria-labelledby={s.id}>
              <h2 id={s.id}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>

      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy policy", path: "/privacy-policy" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy policy",
          url: `${site.url}/privacy-policy`,
          dateModified: UPDATED,
          publisher: { "@id": `${site.url}/#organization` },
        }}
      />
    </>
  );
}
