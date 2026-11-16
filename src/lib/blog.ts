/**
 * Blog posts are Markdown files in src/content/blog/<slug>.md with front matter:
 *
 *   title, description, date (YYYY-MM-DD), updated, category (SEO | AEO | GEO),
 *   tags [..], takeaways [..] (key points box), faq [{ q, a }] (optional)
 *
 * Read at build time; every post page is statically generated.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { site } from "@/config/site";

import { CATEGORY_STYLE, formatDate, type Category, type PostMeta } from "./blog-shared";

export { CATEGORY_STYLE, formatDate };
export type { Category, PostMeta };

export interface Post extends PostMeta {
  html: string;
  toc: { id: string; text: string }[];
}

const DIR = path.join(process.cwd(), "src/content/blog");
export const BLOG_AUTHOR = `${site.parent.name} Editorial Team`;

const isoDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v || "").slice(0, 10));
const slugify = (s: string) =>
  s.toLowerCase().replace(/&[a-z]+;/g, "").replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function render(markdown: string) {
  const toc: Post["toc"] = [];
  const used = new Set<string>();
  const md = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const plain = inner.replace(/<[^>]+>/g, "");
        let id = slugify(plain) || "section";
        while (used.has(id)) id += "-x";
        used.add(id);
        if (depth === 2) toc.push({ id, text: plain });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.startsWith(site.url);
        return `<a href="${href}"${title ? ` title="${title}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>`;
      },
    },
  });
  const html = (md.parse(markdown) as string)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return { html, toc };
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];
  const posts = files.map((file): Post => {
    const slug = file.replace(/\.md$/, "");
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
    const words = content.split(/\s+/).filter(Boolean).length;
    const { html, toc } = render(content);
    const date = isoDate(data.date);
    return {
      slug,
      title: String(data.title),
      seoTitle: String(data.seoTitle || data.title),
      description: String(data.description),
      date,
      updated: isoDate(data.updated) || date,
      category: (["SEO", "AEO", "GEO"].includes(data.category) ? data.category : "SEO") as Category,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      author: String(data.author || BLOG_AUTHOR),
      readingMinutes: Math.max(1, Math.round(words / 220)),
      takeaways: Array.isArray(data.takeaways) ? data.takeaways.map(String) : [],
      faq: Array.isArray(data.faq) ? data.faq.map((f: { q: string; a: string }) => ({ q: String(f.q), a: String(f.a) })) : [],
      html,
      toc,
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  cache = posts;
  return posts;
}

export const getPost = (slug: string) => getAllPosts().find((p) => p.slug === slug);

/** Card data without the rendered HTML (safe to pass to client components). */
export const toMeta = ({ html: _h, toc: _t, ...meta }: Post): PostMeta => meta;
