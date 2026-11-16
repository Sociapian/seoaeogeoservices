import { site } from "@/config/site";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export function GET() {
  const posts = getAllPosts();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${site.url}/blog/${p.slug}</link>
      <guid isPermaLink="true">${site.url}/blog/${p.slug}</guid>
      <description>${esc(p.description)}</description>
      <category>${p.category}</category>
      <pubDate>${new Date(`${p.date}T09:00:00+05:30`).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${site.name} blog by ${site.parent.name}`)}</title>
    <link>${site.url}/blog</link>
    <atom:link href="${site.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Guides on SEO, Answer Engine Optimization and Generative Engine Optimization.</description>
    <language>en-in</language>
    ${posts[0] ? `<lastBuildDate>${new Date(`${posts[0].updated}T09:00:00+05:30`).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
