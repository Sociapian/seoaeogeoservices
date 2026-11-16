/** Blog types and helpers that are safe to use in client components (no Node APIs). */
export type Category = "SEO" | "AEO" | "GEO";

export const CATEGORY_STYLE: Record<Category, { accent: string; label: string }> = {
  SEO: { accent: "#f5b21b", label: "Search Engine Optimization" },
  AEO: { accent: "#2bd1d1", label: "Answer Engine Optimization" },
  GEO: { accent: "#ff5fae", label: "Generative Engine Optimization" },
};

export interface PostMeta {
  slug: string;
  title: string;
  /** Shorter title for search results (aim for 55 characters or fewer). Falls back to title. */
  seoTitle: string;
  description: string;
  date: string;
  updated: string;
  category: Category;
  tags: string[];
  author: string;
  readingMinutes: number;
  takeaways: string[];
  faq: { q: string; a: string }[];
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
