/**
 * Explainer videos (20 s each, silent, 1280x720). Files live in /public/videos.
 * The transcript mirrors the on-screen text so search engines, AI crawlers and
 * screen-reader users get the same message as viewers.
 */
export interface ExplainerVideo {
  id: "seo" | "aeo" | "geo";
  tag: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  mp4: string;
  webm: string;
  poster: string;
  workOn: string[];
  result: string;
  trackedBy: string;
  transcript: string;
  uploadDate: string;
  durationSec: number;
}

const base = "/videos/sociapa";
const uploadDate = "2026-10-08T00:00:00+05:30";

export const videos: ExplainerVideo[] = [
  {
    id: "seo",
    tag: "SEO",
    title: "SEO explained in 20 seconds",
    tagline: "Rank where your buyers search.",
    description: "A 20-second explainer from Sociapa on Search Engine Optimization: what we work on and how results are tracked.",
    accent: "#f5b21b",
    mp4: `${base}-seo-explainer.mp4`,
    webm: `${base}-seo-explainer.webm`,
    poster: `${base}-seo-explainer-poster.jpg`,
    workOn: ["Technical health", "Content that matches intent", "Links and authority"],
    result: "More qualified visits from search.",
    trackedBy: "Tracked by rankings, clicks and leads.",
    transcript:
      "Search Engine Optimization. Rank where your buyers search. What we work on: technical health, content that matches intent, links and authority. We fix what holds your pages back, so your site moves above competitors for what your buyers search for. The result: more qualified visits from search, tracked by rankings, clicks and leads.",
    uploadDate,
    durationSec: 20,
  },
  {
    id: "aeo",
    tag: "AEO",
    title: "AEO explained in 20 seconds",
    tagline: "Be the answer, not just a link.",
    description: "A 20-second explainer from Sociapa on Answer Engine Optimization: winning featured snippets, People Also Ask and voice answers.",
    accent: "#2bd1d1",
    mp4: `${base}-aeo-explainer.mp4`,
    webm: `${base}-aeo-explainer.webm`,
    poster: `${base}-aeo-explainer-poster.jpg`,
    workOn: ["Question research", "Answer-first writing", "FAQ and How-To schema"],
    result: "Your answer shows first.",
    trackedBy: "Tracked by snippets won and question coverage.",
    transcript:
      "Answer Engine Optimization. Be the answer, not just a link. What we work on: question research, answer-first writing, FAQ and How-To schema. Snippets, People Also Ask and voice: a short, direct answer taken from your page appears above every other result. The result: your answer shows first, tracked by snippets won and question coverage.",
    uploadDate,
    durationSec: 20,
  },
  {
    id: "geo",
    tag: "GEO",
    title: "GEO explained in 20 seconds",
    tagline: "Get cited by AI assistants.",
    description: "A 20-second explainer from Sociapa on Generative Engine Optimization: getting your brand named and cited in AI chat and AI search summaries.",
    accent: "#ff5fae",
    mp4: `${base}-geo-explainer.mp4`,
    webm: `${base}-geo-explainer.webm`,
    poster: `${base}-geo-explainer-poster.jpg`,
    workOn: ["Entity and brand clarity", "Citable facts and data", "Mentions on trusted sources"],
    result: "AI names your brand.",
    trackedBy: "Tracked by citations and share of AI answers.",
    transcript:
      "Generative Engine Optimization. Get cited by AI assistants. What we work on: entity and brand clarity, citable facts and data, mentions on trusted sources. In AI chat and AI summaries in search, when someone asks who they should hire, the answer names your brand and cites your website as the source. The result: AI names your brand, tracked by citations and share of AI answers.",
    uploadDate,
    durationSec: 20,
  },
];
