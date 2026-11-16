import { site } from "@/config/site";
import type { CombinedReport } from "./audit/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const color = (n: number) => (n >= 75 ? "#12b886" : n >= 50 ? "#e59400" : "#e03131");

export function reportEmail(report: CombinedReport, name: string) {
  const first = esc(name.split(" ")[0] || "there");
  const host = esc(report.host);
  const rows = report.categories
    .map((c) =>
      c.score === null
        ? `<tr><td style="padding:8px 0;color:#4a4766">${esc(c.label)}</td><td style="padding:8px 0;text-align:right;color:#74718f">Not measured</td></tr>`
        : `<tr><td style="padding:8px 0;color:#4a4766">${esc(c.label)}</td><td style="padding:8px 0;text-align:right;font-weight:700;color:${color(c.score)}">${c.score}/100</td></tr>`,
    )
    .join("");
  const issues = report.checks.filter((c) => c.status !== "pass").length;

  const html = `<!doctype html><html><body style="margin:0;background:#f3f0ff;font-family:Arial,Helvetica,sans-serif;color:#12102a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#22145c;padding:28px 32px;color:#ffffff">
<div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#cfc2ff">SEO · AEO · GEO ${esc(site.byline.toUpperCase())}</div>
<div style="font-size:24px;font-weight:800;margin-top:10px">Your audit report for ${host}</div>
</td></tr>
<tr><td style="padding:28px 32px">
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hi ${first},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Your full SEO, AEO and GEO audit report is attached as a PDF. Here is the summary:</p>
<div style="text-align:center;margin:8px 0 18px"><span style="display:inline-block;font-size:44px;font-weight:800;color:${color(report.score)}">${report.score}</span><span style="font-size:15px;color:#74718f"> / 100 · Grade ${report.grade}</span></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #ece8ff;border-bottom:1px solid #ece8ff">${rows}</table>
<p style="margin:20px 0;font-size:15px;line-height:1.6">We found <b>${issues} issues</b> across ${report.crawl.pagesCrawled} pages. The PDF lists every one with a step-by-step fix, starting with the highest-impact items.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6">Want a walkthrough? Reply to this email or book a free strategy call with the ${esc(site.parent.name)} team.</p>
<a href="${site.url}/contact" style="display:inline-block;background:#ff6a3d;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px">Book a free strategy call</a>
</td></tr>
<tr><td style="padding:18px 32px;background:#faf9ff;font-size:12px;color:#74718f;line-height:1.6">${esc(site.name)} is the search and AI visibility vertical of ${esc(site.parent.name)}.<br>You received this because you requested an audit report at ${esc(site.url.replace(/^https?:\/\//, ""))}.</td></tr>
</table></td></tr></table></body></html>`;

  const text = `Hi ${name.split(" ")[0] || "there"},

Your SEO, AEO and GEO audit report for ${report.host} is attached.

Overall score: ${report.score}/100 (Grade ${report.grade})
${report.categories.map((c) => `- ${c.label}: ${c.score === null ? "not measured" : `${c.score}/100`}`).join("\n")}

We found ${issues} issues across ${report.crawl.pagesCrawled} pages. Every one is listed in the PDF with a fix.

Book a free strategy call: ${site.url}/contact

${site.name} ${site.byline}`;

  return { subject: `Your SEO, AEO & GEO audit report for ${report.host} (${report.score}/100)`, html, text };
}
