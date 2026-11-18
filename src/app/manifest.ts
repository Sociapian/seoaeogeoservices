import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "SEO AEO GEO",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22145c",
    icons: [{ src: "/favicon.png", sizes: "any", type: "image/png" }],
  };
}
