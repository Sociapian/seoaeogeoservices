import { site } from "@/config/site";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

/** llms.txt: a plain-text brief for AI systems. Blog articles are listed automatically. */
export function GET() {
  const u = site.url;
  const posts = getAllPosts();
  const body = `# ${site.name} by ${site.parent.name}

> ${site.name} (${u.replace(/^https?:\/\//, "")}) is the search and AI visibility vertical of ${site.parent.name}, a digital marketing agency founded in ${site.parent.founded} and based in ${site.address.locality}, ${site.address.region}, India. It provides Search Engine Optimization (SEO), Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) services, and a free website audit tool.

## Services

- [Search Engine Optimization (SEO)](${u}/#seo): Technical SEO, keyword research, on-page optimization, content, link building, local and e-commerce SEO.
- [Answer Engine Optimization (AEO)](${u}/#aeo): Question-led content, schema markup, featured snippets, People Also Ask and voice search.
- [Generative Engine Optimization (GEO)](${u}/#geo): Visibility and citations in ChatGPT, Gemini, Perplexity, Copilot and Google AI Overviews.

## Tools

- [Free SEO, AEO & GEO Audit Report](${u}/free-seo-audit): crawls up to 25 pages, runs 40+ checks including Google PageSpeed and a ChatGPT/Perplexity visibility test, and delivers a PDF with prioritized fixes.
- [Free audit & growth review](${u}/#enquiry): request a manual review from the ${site.parent.name} team.

## Blog

${posts.map((p) => `- [${p.title}](${u}/blog/${p.slug}): ${p.description}`).join("\n")}

## Company

- [Contact](${u}/contact): Enquiry form, email and office location.
- [${site.parent.name}](${site.parent.url}): Parent agency.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
