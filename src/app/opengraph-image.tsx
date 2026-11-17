import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = "SEO, AEO & GEO Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 72, color: "#fff", background: "linear-gradient(135deg, #1a1147 0%, #2b1a75 60%, #5630e0 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>
          SEO · AEO · GEO
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Get found on Google.</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: "#ff8a66" }}>Get cited by AI.</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#e7e0ff" }}>Free SEO, AEO & GEO audit report · {site.url.replace("https://", "")}</div>
      </div>
    ),
    size,
  );
}
