import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { CATEGORY_STYLE, getAllPosts, getPost } from "@/lib/blog";

export const alt = "Sociapa blog article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  const title = post?.title ?? site.name;
  const accent = post ? CATEGORY_STYLE[post.category].accent : "#ff6a3d";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72,
          color: "#fff", background: `radial-gradient(circle at 90% 0%, ${accent}66, transparent 50%), linear-gradient(160deg, #22145c 0%, #140d38 100%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 700 }}>
          <span style={{ background: accent, color: "#12102a", padding: "6px 18px", borderRadius: 999 }}>{post?.category ?? "Blog"}</span>
          <span style={{ color: "#cfc2ff" }}>{site.name}</span>
        </div>
        <div style={{ fontSize: title.length > 70 ? 58 : 68, fontWeight: 800, lineHeight: 1.08, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 26, color: "#e7e0ff" }}>{site.url.replace("https://", "")}/blog</div>
      </div>
    ),
    size,
  );
}
