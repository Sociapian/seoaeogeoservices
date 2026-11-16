"use client";

import { useState } from "react";
import type { PostMeta } from "@/lib/blog-shared";
import { PostCard } from "./PostCard";

const FILTERS = ["All", "SEO", "AEO", "GEO"] as const;

/** Category filter for the blog index. All posts are in the server HTML; filtering is client-side. */
export function BlogExplorer({ posts }: { posts: PostMeta[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = filter === "All" ? posts : posts.filter((p) => p.category === filter);
  const [featured, ...rest] = shown;

  return (
    <div>
      <div role="group" aria-label="Filter articles by topic" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "All" ? posts.length : posts.filter((p) => p.category === f).length;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                filter === f ? "border-brand-600 bg-brand-600 text-white shadow-lift" : "border-brand-100 bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {f} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-ink-soft">No articles in this topic yet.</p>
      ) : (
        <div key={filter} className="mt-8 space-y-6">
          {featured && <PostCard post={featured} featured />}
          {rest.length > 0 && (
            <div className={`grid gap-6 md:grid-cols-2 ${rest.length >= 3 ? "lg:grid-cols-3" : ""}`} data-stagger="110">
              {rest.map((p) => <PostCard key={p.slug} post={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
