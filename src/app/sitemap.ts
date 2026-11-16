import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { videos } from "@/content/videos";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const posts = getAllPosts();
  return [
    {
      url: `${site.url}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      videos: videos.map((v) => ({
        title: v.title,
        description: v.description,
        thumbnail_loc: `${site.url}${v.poster}`,
        content_loc: `${site.url}${v.mp4}`,
        duration: v.durationSec,
        publication_date: v.uploadDate,
        family_friendly: "yes" as const,
      })),
    },
    { url: `${site.url}/free-seo-audit`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/blog`, lastModified: posts[0] ? new Date(posts[0].updated) : lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${site.url}/blog/${p.slug}`,
      lastModified: new Date(`${p.updated}T09:00:00+05:30`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${site.url}/contact`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/privacy-policy`, lastModified: new Date("2026-11-11"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
