import { Bot, MessageCircleQuestion, Search } from "lucide-react";
import { CATEGORY_STYLE, type Category } from "@/lib/blog-shared";

const ICON = { SEO: Search, AEO: MessageCircleQuestion, GEO: Bot } as const;

/** Illustrated cover generated from the post's category: no image files needed. */
export function PostCover({ category, className = "", large = false }: { category: Category; className?: string; large?: boolean }) {
  const { accent } = CATEGORY_STYLE[category];
  const Icon = ICON[category];
  return (
    <div
      className={`relative overflow-hidden bg-[#1a1147] ${className}`}
      style={{ background: `radial-gradient(120% 90% at 85% 10%, ${accent}55, transparent 55%), linear-gradient(160deg,#22145c,#140d38)` }}
      aria-hidden
    >
      <div className="grid-fade absolute inset-0 opacity-70" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125" style={{ background: `${accent}55` }} />
      <div className="relative flex h-full items-end justify-between p-5">
        <span className={`font-extrabold leading-none tracking-tight ${large ? "text-7xl md:text-8xl" : "text-5xl"}`} style={{ color: accent }}>
          {category}
        </span>
        <span
          className={`grid place-items-center rounded-2xl border bg-white/5 backdrop-blur transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6 ${large ? "h-20 w-20" : "h-12 w-12"}`}
          style={{ borderColor: `${accent}88`, color: accent }}
        >
          <Icon size={large ? 36 : 22} />
        </span>
      </div>
    </div>
  );
}
