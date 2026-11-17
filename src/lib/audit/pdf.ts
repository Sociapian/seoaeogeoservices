import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { site, fullAddress } from "@/config/site";
import { prioritise } from "./score";
import { CATEGORY_META, type Check, type CombinedReport, type Status } from "./types";

const W = 595.28;
const H = 841.89;
const M = 48;

const C = {
  ink: rgb(0.07, 0.063, 0.165),
  soft: rgb(0.29, 0.28, 0.4),
  mute: rgb(0.52, 0.51, 0.62),
  line: rgb(0.9, 0.89, 0.95),
  brand: rgb(0.337, 0.188, 0.878),
  brandDark: rgb(0.133, 0.078, 0.36),
  tint: rgb(0.953, 0.941, 1),
  white: rgb(1, 1, 1),
  pass: rgb(0.07, 0.72, 0.525),
  warn: rgb(0.93, 0.6, 0.05),
  fail: rgb(0.9, 0.24, 0.24),
};

const statusColor = (s: Status) => C[s];
const scoreColor = (n: number) => (n >= 75 ? C.pass : n >= 50 ? C.warn : C.fail);
const STATUS_LABEL: Record<Status, string> = { pass: "PASSED", warn: "IMPROVE", fail: "FIX" };
const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const pathOf = (u: string) => {
  try {
    const x = new URL(u);
    return x.pathname + x.search || "/";
  } catch {
    return u;
  }
};

/** Standard PDF fonts only cover WinAnsi; scraped and AI text can contain anything. */
function clean(s: string): string {
  return (s || "")
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/₹/g, "Rs ")
    .replace(/[ \s]+/g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, "")
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  for (let word of clean(text).split(" ")) {
    while (font.widthOfTextAtSize(word, size) > maxW) {
      let cut = word.length;
      while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > maxW) cut--;
      if (line) out.push(line);
      out.push(word.slice(0, cut));
      line = "";
      word = word.slice(cut);
    }
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxW) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export interface ReportLead {
  name: string;
  company?: string;
}

export async function buildReportPdf(report: CombinedReport, lead: ReportLead): Promise<Uint8Array> {
  const { crawl, speed, ai } = report;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logoImg: any = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "sociapa-register-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImg = await pdf.embedPng(logoBytes);
    }
  } catch (e) {
    console.warn("[pdf] could not embed logo image:", (e as Error).message);
  }
  pdf.setTitle(`SEO, AEO & GEO Audit Report - ${clean(report.host)}`);
  pdf.setAuthor(`${site.parent.name} (${site.name})`);
  pdf.setCreator(site.url);

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const CW = W - 2 * M;

  const text = (s: string, x: number, yy: number, size: number, font = regular, color: RGB = C.ink) =>
    page.drawText(clean(s), { x, y: yy, size, font, color });
  const centered = (s: string, cx: number, yy: number, size: number, font = regular, color: RGB = C.ink) =>
    text(s, cx - font.widthOfTextAtSize(clean(s), size) / 2, yy, size, font, color);
  const newPage = () => {
    page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: C.brand });
    y = H - M - 6;
  };
  const need = (h: number) => {
    if (y - h < M + 24) newPage();
  };
  const para = (s: string, x: number, size: number, maxW: number, font = regular, color: RGB = C.soft, lh = 1.45) => {
    for (const ln of wrap(s, font, size, maxW)) {
      need(size * lh);
      text(ln, x, y - size, size, font, color);
      y -= size * lh;
    }
  };
  const heading = (s: string) => {
    need(60);
    y -= 14;
    text(s, M, y - 15, 15, bold, C.ink);
    y -= 24;
    page.drawRectangle({ x: M, y, width: 36, height: 3, color: C.brand });
    y -= 14;
  };
  /** Simple table: wraps each cell, repeats nothing, breaks across pages by row. */
  const table = (cols: { label: string; w: number }[], rows: string[][], size = 8.5) => {
    const pad = 6;
    const drawHeader = () => {
      page.drawRectangle({ x: M, y: y - 18, width: CW, height: 18, color: C.brandDark });
      let x = M;
      cols.forEach((c) => {
        text(c.label, x + pad, y - 12.5, 8, bold, C.white);
        x += c.w;
      });
      y -= 18;
    };
    need(40);
    drawHeader();
    rows.forEach((r, i) => {
      const cells = r.map((v, j) => wrap(v, regular, size, cols[j].w - 2 * pad));
      const h = Math.max(...cells.map((c) => c.length)) * size * 1.35 + 2 * pad - 2;
      if (y - h < M + 24) {
        newPage();
        drawHeader();
      }
      if (i % 2) page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: C.tint });
      let x = M;
      cells.forEach((lines, j) => {
        lines.forEach((ln, k) => text(ln, x + pad, y - pad - size - k * size * 1.35 + 1, size, j === 0 ? bold : regular, C.ink));
        x += cols[j].w;
      });
      y -= h;
    });
    y -= 12;
  };

  // ================= Cover =================
  page.drawRectangle({ x: 0, y: H - 300, width: W, height: 300, color: C.brandDark });
  page.drawRectangle({ x: 0, y: H - 300, width: W, height: 5, color: C.brand });
  if (logoImg) {
    const dims = logoImg.scale(0.3);
    page.drawRectangle({ x: M - 4, y: H - 72, width: dims.width + 8, height: dims.height + 8, color: C.white });
    page.drawImage(logoImg, { x: M, y: H - 68, width: dims.width, height: dims.height });
    text(site.name.toUpperCase(), M + dims.width + 16, H - 54, 11, bold, C.white);
    text(site.url.replace(/^https?:\/\//, ""), M + dims.width + 16, H - 68, 9, regular, rgb(0.78, 0.74, 1));
  } else {
    text(site.name.toUpperCase(), M, H - 62, 11, bold, C.white);
    text(site.url.replace(/^https?:\/\//, ""), M, H - 78, 9, regular, rgb(0.78, 0.74, 1));
  }
  text("SEO, AEO & GEO", M, H - 138, 30, bold, C.white);
  text("Audit Report", M, H - 174, 30, bold, C.white);
  text(report.host, M, H - 208, 14, regular, rgb(0.85, 0.82, 1));
  const date = new Date(report.fetchedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const prepared = [lead.name, lead.company].filter(Boolean).join(", ");
  text(`Prepared for ${prepared || "you"}  |  ${date}`, M, H - 232, 10, regular, rgb(0.78, 0.74, 1));

  const bx = W - M - 120;
  const by = H - 240;
  page.drawRectangle({ x: bx, y: by, width: 120, height: 130, color: C.white });
  page.drawRectangle({ x: bx, y: by + 124, width: 120, height: 6, color: scoreColor(report.score) });
  centered(String(report.score), bx + 60, by + 62, 46, bold, scoreColor(report.score));
  centered("out of 100", bx + 60, by + 44, 9, regular, C.mute);
  centered(`Grade ${report.grade}`, bx + 60, by + 18, 12, bold, C.ink);

  y = H - 300 - 32;
  text("Score by category", M, y, 13, bold);
  y -= 20;
  for (const cat of report.categories) {
    const barX = M + 150;
    const barW = W - M - barX - 70;
    text(cat.label, M, y - 9, 10, bold, C.ink);
    page.drawRectangle({ x: barX, y: y - 9, width: barW, height: 9, color: C.line });
    if (cat.score === null) {
      text("Not measured", W - M - regular.widthOfTextAtSize("Not measured", 8.5), y - 8.5, 8.5, regular, C.mute);
    } else {
      page.drawRectangle({ x: barX, y: y - 9, width: Math.max(2, (barW * cat.score) / 100), height: 9, color: scoreColor(cat.score) });
      const v = `${cat.score}`;
      text(v, W - M - bold.widthOfTextAtSize(v, 11), y - 9, 11, bold, scoreColor(cat.score));
    }
    y -= 14;
    const sub = cat.score === null ? CATEGORY_META[cat.id].blurb : `${CATEGORY_META[cat.id].blurb}  ${cat.passed} passed, ${cat.warnings} to improve, ${cat.failed} to fix.`;
    text(sub, barX, y - 8, 7.5, regular, C.mute);
    y -= 17;
  }

  const issues = report.checks.filter((c) => c.status !== "pass").length;
  const stats: [string, string][] = [
    ["Pages crawled", String(crawl.pagesCrawled)],
    ["Checks run", String(report.checks.length)],
    ["Issues found", String(issues)],
    ["Mobile speed", speed ? `${speed.score}/100` : "-"],
    ["AI mentions", ai ? `${ai.shareOfVoice}%` : "-"],
  ];
  const cw = CW / stats.length;
  y -= 2;
  page.drawRectangle({ x: M, y: y - 52, width: CW, height: 52, color: C.tint });
  stats.forEach(([label, value], i) => {
    text(value, M + i * cw + 12, y - 25, 15, bold, C.brandDark);
    text(label, M + i * cw + 12, y - 41, 8, regular, C.soft);
  });
  y -= 66;
  const scope = [
    `This report covers ${crawl.pagesCrawled} pages of ${report.host} crawled on ${date}`,
    speed ? ", Google PageSpeed Insights results for the homepage on mobile" : "",
    ai ? `, and how ${ai.engines.join(" and ")} answered ${ai.prompts.length} questions about ${ai.category}` : "",
    ". It does not include backlinks, keyword rankings or competitor traffic; those are part of a full manual audit by the Sociapa team.",
  ].join("");
  para(scope, M, 8.5, CW, regular, C.soft);

  // ================= Priority plan =================
  const todo = prioritise(report.checks);
  newPage();
  heading("Priority action plan");
  if (!todo.length) para("No issues were found by the automated checks. Excellent work.", M, 10, CW);
  todo.slice(0, 10).forEach((c, i) => {
    const lines = wrap(c.recommendation, regular, 9.5, CW - 34);
    need(34 + lines.length * 13.5);
    page.drawRectangle({ x: M, y: y - 20, width: 22, height: 22, color: statusColor(c.status) });
    centered(String(i + 1), M + 11, y - 14, 11, bold, C.white);
    text(c.title, M + 34, y - 11, 11, bold);
    const tag = `${CATEGORY_META[c.category].label}  |  ${c.impact.toUpperCase()} IMPACT`;
    text(tag, W - M - regular.widthOfTextAtSize(tag, 7.5), y - 10, 7.5, regular, C.mute);
    y -= 26;
    para(c.recommendation, M + 34, 9.5, CW - 34);
    y -= 10;
  });

  // ================= Detailed results =================
  const drawCheck = (c: Check) => {
    const bodyW = CW - 74;
    const ex = c.examples?.length ? `Affected: ${c.examples.join(", ")}` : "";
    const est = [c.finding, c.recommendation ? `Fix: ${c.recommendation}` : "", ex].filter(Boolean)
      .reduce((n, s) => n + wrap(s, regular, 9, bodyW).length, 0);
    need(26 + est * 13);
    const label = STATUS_LABEL[c.status];
    page.drawRectangle({ x: M, y: y - 15, width: 60, height: 16, color: statusColor(c.status) });
    centered(label, M + 30, y - 10, 7.5, bold, C.white);
    text(c.title, M + 74, y - 11, 10.5, bold);
    y -= 22;
    para(c.finding, M + 74, 9, bodyW, regular, C.soft);
    if (c.recommendation) para(`Fix: ${c.recommendation}`, M + 74, 9, bodyW, regular, C.ink);
    if (ex) para(ex, M + 74, 8.5, bodyW, regular, C.brand);
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: C.line });
    y -= 10;
  };

  for (const cat of report.categories) {
    if (cat.score === null) continue;
    newPage();
    heading(`${cat.label}  -  ${cat.score}/100`);
    para(CATEGORY_META[cat.id].blurb, M, 10, CW);
    y -= 8;

    if (cat.id === "performance" && speed) {
      const rows: string[][] = [
        ["Performance score", `${speed.score}/100`, "90+"],
        ["Largest Contentful Paint", secs(speed.lab.lcp), "2.5 s or less"],
        ["First Contentful Paint", secs(speed.lab.fcp), "1.8 s or less"],
        ["Total Blocking Time", `${Math.round(speed.lab.tbt)} ms`, "200 ms or less"],
        ["Cumulative Layout Shift", speed.lab.cls.toFixed(2), "0.1 or less"],
        ["Speed Index", secs(speed.lab.si), "3.4 s or less"],
      ];
      text("Lab test (Lighthouse, mobile)", M, y - 10, 10.5, bold);
      y -= 18;
      table([{ label: "Metric", w: 200 }, { label: "Result", w: 120 }, { label: "Good", w: CW - 320 }], rows);
      if (speed.field) {
        const f = speed.field;
        const frows: string[][] = [["Overall assessment", String(f.overall), ""]];
        if (f.lcp) frows.push(["Largest Contentful Paint (p75)", secs(f.lcp.p75), f.lcp.category]);
        if (f.inp) frows.push(["Interaction to Next Paint (p75)", `${Math.round(f.inp.p75)} ms`, f.inp.category]);
        if (f.cls) frows.push(["Cumulative Layout Shift (p75)", f.cls.p75.toFixed(2), f.cls.category]);
        text("Real users (Chrome UX Report, last 28 days)", M, y - 10, 10.5, bold);
        y -= 18;
        table([{ label: "Metric", w: 200 }, { label: "Result", w: 120 }, { label: "Rating", w: CW - 320 }], frows);
      } else {
        para("Real-user (Chrome UX Report) data is not available for this URL, usually because it does not yet get enough Chrome traffic. Lab results are used instead.", M, 8.5, CW, regular, C.mute);
        y -= 8;
      }
      if (speed.opportunities.length) {
        text("Biggest speed opportunities", M, y - 10, 10.5, bold);
        y -= 18;
        table([{ label: "Opportunity", w: CW - 120 }, { label: "Estimated saving", w: 120 }], speed.opportunities.map((o) => [o.title, secs(o.savingsMs)]));
      }
    }

    if (cat.id === "ai" && ai) {
      para(`We asked ${ai.engines.join(" and ")} (with live web search) ${ai.prompts.length - 1} questions a buyer of ${ai.category} might ask, without naming ${ai.brand}, plus one direct question about the brand. AI answers vary between runs, so treat this as a snapshot.`, M, 9, CW);
      y -= 6;
      for (const p of ai.prompts) {
        need(60);
        text(`${p.branded ? "Brand question" : "Buyer question"}`, M, y - 9, 7.5, bold, C.brand);
        y -= 13;
        para(`"${p.prompt}"`, M, 10, CW, bold, C.ink);
        y -= 2;
        table(
          [{ label: "Engine", w: 80 }, { label: "Result", w: 110 }, { label: "Answer excerpt", w: CW - 190 }],
          p.answers.map((a) => [
            a.engine,
            a.error ? "No answer" : a.cited ? "Mentioned + cited" : a.mentioned ? "Mentioned" : "Not mentioned",
            a.error || a.excerpt || "-",
          ]),
          8,
        );
      }
      if (ai.topSources.length) {
        text("Sources the AI engines cited instead", M, y - 10, 10.5, bold);
        y -= 18;
        table([{ label: "Domain", w: CW - 120 }, { label: "Times cited", w: 120 }], ai.topSources.map((s) => [s.domain, String(s.count)]));
        para("These are the sites shaping AI answers in your category. Getting featured, reviewed or listed on them is one of the fastest ways to improve AI visibility.", M, 8.5, CW, regular, C.soft);
        y -= 8;
      }
    }

    report.checks.filter((c) => c.category === cat.id).forEach(drawCheck);
  }

  // ================= Pages crawled =================
  newPage();
  heading(`Pages crawled (${crawl.pagesCrawled})`);
  para(`We found ${crawl.pagesDiscovered} URLs through your sitemap and internal links and analysed ${crawl.pagesCrawled} of them.`, M, 9, CW);
  y -= 6;
  table(
    [{ label: "Page", w: 230 }, { label: "Status", w: 50 }, { label: "Words", w: 50 }, { label: "To fix", w: 50 }, { label: "To improve", w: CW - 380 }],
    crawl.pages.map((p) => [pathOf(p.url), String(p.status), String(p.words), String(p.fails), String(p.warns)]),
    8,
  );

  // ================= Next steps =================
  need(250);
  heading("What to do next");
  para("Start with the priority action plan: the items marked FIX with high impact usually take the least effort and unlock the most visibility. Then work through the IMPROVE items category by category.", M, 10.5, CW);
  y -= 8;
  para(`Want this done for you? ${site.parent.name}'s SEO, AEO and GEO team can run a full manual audit covering your backlink profile, keyword gaps, competitor benchmarks and AI visibility across more questions and engines, then implement the roadmap with you.`, M, 10.5, CW);
  y -= 16;
  need(120);
  page.drawRectangle({ x: M, y: y - 104, width: CW, height: 104, color: C.brandDark });
  text("Book a free strategy call", M + 20, y - 30, 15, bold, C.white);
  [
    `Web: ${site.url.replace(/^https?:\/\//, "")}/contact`,
    `Email: ${site.contact.email}`,
    site.contact.phone ? `Phone: ${site.contact.phone}` : "",
    `Office: ${site.parent.name}, ${fullAddress()}`,
  ]
    .filter(Boolean)
    .forEach((l, i) => text(l, M + 20, y - 50 - i * 14, 9.5, regular, rgb(0.85, 0.82, 1)));

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    if (i === 0) return;
    p.drawText(clean(`${site.name}  |  Audit of ${report.host}`), { x: M, y: 26, size: 7.5, font: regular, color: C.mute });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, { x: W - M - regular.widthOfTextAtSize(pn, 7.5), y: 26, size: 7.5, font: regular, color: C.mute });
  });

  return pdf.save();
}
