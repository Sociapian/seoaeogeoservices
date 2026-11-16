import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { CATEGORY_STYLE, formatDate, type PostMeta } from "@/lib/blog-shared";
import { PostCover } from "./PostCover";

export function PostCard({ post, featured = false }: { post: PostMeta; featured?: boolean }) {
  const { accent } = CATEGORY_STYLE[post.category];
  return (
    <article
      data-reveal
      className={`card card-hover group relative flex overflow-hidden !p-0 ${featured ? "flex-col md:grid md:grid-cols-[1.1fr_1fr]" : "flex-col"}`}
    >
      <PostCover category={post.category} large={featured} className={featured ? "aspect-[16/10] md:aspect-auto md:min-h-[320px]" : "aspect-[16/9]"} />
      <div className={`flex flex-1 flex-col ${featured ? "p-7 md:p-9" : "p-6"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-mute">
          <span className="rounded-full px-2.5 py-0.5 font-bold text-ink" style={{ background: `${accent}33` }}>{post.category}</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden /> {post.readingMinutes} min read</span>
        </div>
        <h3 className={`mt-3 font-extrabold leading-snug ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        <p className={`mt-2 flex-1 text-sm leading-relaxed text-ink-soft ${featured ? "md:text-base" : "line-clamp-3"}`}>{post.description}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 group-hover:text-accent">
          Read article <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </article>
  );
}
