/**
 * Part 3 of the audit: AI visibility.
 *
 * 1. Work out the brand's category and write 3 buyer questions that do NOT name the brand.
 * 2. Ask each question, plus one branded question, to every configured engine
 *    with live web search switched on (ChatGPT via the OpenAI Responses API,
 *    Perplexity via the Perplexity Agent API).
 * 3. Record whether the brand is mentioned, whether its domain is cited as a
 *    source, and which other domains the engines cited instead.
 *
 * Results vary from run to run (AI answers are not deterministic), so the
 * report presents them as a snapshot, not a ranking.
 */
import type { AiAnswer, AiResult, Check, CrawlResult } from "./types";

interface EngineReply {
  text: string;
  urls: string[];
}
interface Engine {
  id: string;
  label: string;
  ask: (prompt: string, opts?: { search?: boolean }) => Promise<EngineReply>;
}

const COUNTRY_NAMES: Record<string, string> = { IN: "India", US: "the United States", GB: "the United Kingdom", AE: "the UAE", SG: "Singapore", AU: "Australia", CA: "Canada" };
const country = () => (process.env.AI_COUNTRY || "IN").toUpperCase();
const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "");
const domainOf = (u: string) => {
  try {
    return bareHost(new URL(u).hostname);
  } catch {
    return "";
  }
};

/** Both APIs return a Responses-style `output` array; collect text and every cited URL. */
function parseOutput(data: any): EngineReply {
  let text = "";
  const urls = new Set<string>();
  for (const item of data?.output ?? []) {
    if (item?.type === "message") {
      for (const part of item.content ?? []) {
        if (typeof part?.text === "string") text += part.text + "\n";
        for (const a of part?.annotations ?? []) if (a?.url) urls.add(a.url);
      }
    } else if (item?.type === "search_results") {
      for (const r of item.results ?? []) if (r?.url) urls.add(r.url);
    } else if (item?.type === "web_search_call") {
      for (const s of item.action?.sources ?? []) if (s?.url) urls.add(s.url);
    }
  }
  if (!text && typeof data?.output_text === "string") text = data.output_text;
  return { text: text.trim(), urls: [...urls] };
}

async function postJson(url: string, key: string, body: object, timeoutMs: number) {
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data;
}

export function configuredEngines(): Engine[] {
  const engines: Engine[] = [];
  const timeout = Number(process.env.AI_TIMEOUT_MS) || 45_000;

  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    const effort = process.env.OPENAI_REASONING_EFFORT ?? "low";
    engines.push({
      id: "chatgpt",
      label: "ChatGPT",
      ask: async (input, opts = { search: true }) =>
        parseOutput(
          await postJson(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/responses`, key, {
            model: process.env.OPENAI_MODEL || "gpt-5.5",
            input,
            ...(effort !== "none" ? { reasoning: { effort } } : {}),
            ...(opts.search
              ? {
                  tools: [{ type: "web_search", search_context_size: "low", user_location: { type: "approximate", country: country() } }],
                  tool_choice: "auto",
                  include: ["web_search_call.action.sources"],
                }
              : {}),
          }, timeout),
        ),
    });
  }

  if (process.env.PERPLEXITY_API_KEY) {
    const key = process.env.PERPLEXITY_API_KEY;
    engines.push({
      id: "perplexity",
      label: "Perplexity",
      ask: async (input) =>
        parseOutput(
          await postJson(`${process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai/v1"}/agent`, key, {
            preset: process.env.PERPLEXITY_PRESET || "fast",
            input,
          }, timeout),
        ),
    });
  }
  return engines;
}

function topicFromTitle(crawl: CrawlResult): string {
  const brand = crawl.brand.name.toLowerCase();
  const segs = crawl.brand.title.split(/\s+[|\-–—:·]\s+/).map((s) => s.trim()).filter((s) => s && !s.toLowerCase().includes(brand));
  return (segs[0] || crawl.brand.description.split(/[.!?]/)[0] || "this kind of service").slice(0, 80);
}

async function buildPrompts(engine: Engine, crawl: CrawlResult): Promise<{ category: string; prompts: string[] }> {
  const where = COUNTRY_NAMES[country()] || country();
  const ask = `You are helping measure how visible a brand is in AI search.
Website: ${crawl.host}
Brand: ${crawl.brand.name}
Page title: ${crawl.brand.title.slice(0, 200)}
Meta description: ${crawl.brand.description.slice(0, 300)}

Return ONLY a JSON object, no other text:
{"category": "<the product or service category in 2 to 5 words>", "prompts": ["<q1>", "<q2>", "<q3>"]}

Write 3 questions a potential customer in ${where} would type into an AI assistant while looking for this kind of product or service.
Rules: do NOT mention ${crawl.brand.name} or ${crawl.host}. One "best ..." recommendation question, one "how do I choose / compare" question, one question about a specific need.`;
  try {
    const { text } = await engine.ask(ask, { search: false });
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    const prompts = (Array.isArray(json.prompts) ? json.prompts : [])
      .map((p: unknown) => String(p).trim())
      .filter((p: string) => p.length > 10 && p.length < 240)
      .slice(0, 3);
    if (prompts.length === 3) return { category: String(json.category || "").slice(0, 60) || topicFromTitle(crawl), prompts };
  } catch (e) {
    console.error("[ai] prompt generation failed:", (e as Error).message);
  }
  const topic = topicFromTitle(crawl);
  return {
    category: topic,
    prompts: [
      `What are the best companies for ${topic} in ${where}?`,
      `How do I choose a good provider for ${topic}?`,
      `Which ${topic} providers would you recommend for a growing business?`,
    ],
  };
}

const NOT_KNOWN = /(could(?:n't| not) find|no (?:reliable |specific |public )?information|not (?:familiar|aware)|unable to (?:find|locate)|don't have (?:any )?(?:specific )?information|no results)/i;

export async function runAiVisibility(crawl: CrawlResult): Promise<AiResult> {
  const engines = configuredEngines();
  if (!engines.length) throw new Error("not_configured");

  const { category, prompts } = await buildPrompts(engines[0], crawl);
  const host = bareHost(crawl.host);
  const label = host.split(".")[0];
  const names = [...new Set([crawl.brand.name.toLowerCase(), label].filter((n) => n.length >= 3))];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRes = names.map((n) => new RegExp(`(^|[^a-z0-9])${esc(n)}([^a-z0-9]|$)`, "i"));

  const all = [
    ...prompts.map((p) => ({ prompt: p, branded: false })),
    { prompt: `What is ${crawl.brand.name} (${host}) and what do they offer? Is it a good choice?`, branded: true },
  ];

  const rows = await Promise.all(
    all.map(async ({ prompt, branded }) => ({
      prompt,
      branded,
      answers: await Promise.all(
        engines.map(async (e): Promise<AiAnswer> => {
          try {
            const { text, urls } = await e.ask(prompt);
            const domains = [...new Set(urls.map(domainOf).filter(Boolean))];
            const cited = domains.some((d) => d === host || d.endsWith(`.${host}`));
            let mentioned = cited || text.toLowerCase().includes(host) || nameRes.some((r) => r.test(text));
            if (branded && mentioned && NOT_KNOWN.test(text.slice(0, 400))) mentioned = false;
            const excerpt = text.replace(/\[\d+\]/g, "").replace(/[*#_`>]/g, "").replace(/\s+/g, " ").trim().slice(0, 320);
            return { engine: e.label, mentioned, cited, excerpt, sources: domains.slice(0, 10) };
          } catch (err) {
            console.error(`[ai] ${e.id} failed:`, (err as Error).message);
            return { engine: e.label, mentioned: false, cited: false, excerpt: "", sources: [], error: "No answer (engine error or timeout)" };
          }
        }),
      ),
    })),
  );

  const answered = rows.flatMap((r) => r.answers.map((a) => ({ ...a, branded: r.branded }))).filter((a) => !a.error);
  if (!answered.length) throw new Error("all_failed");

  const unbranded = answered.filter((a) => !a.branded);
  const branded = answered.filter((a) => a.branded);
  const mentions = unbranded.filter((a) => a.mentioned).length;
  const shareOfVoice = unbranded.length ? Math.round((mentions / unbranded.length) * 100) : 0;
  const citedCount = unbranded.filter((a) => a.cited).length;
  const recognised = branded.filter((a) => a.mentioned).length;

  const counts = new Map<string, number>();
  for (const a of unbranded) for (const d of a.sources) if (d !== host && !d.endsWith(`.${host}`)) counts.set(d, (counts.get(d) || 0) + 1);
  const topSources = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([domain, count]) => ({ domain, count }));

  const perEngine = engines
    .map((e) => {
      const list = unbranded.filter((a) => a.engine === e.label);
      return list.length ? `${e.label} ${list.filter((a) => a.mentioned).length}/${list.length}` : "";
    })
    .filter(Boolean)
    .join(", ");
  const rivals = topSources.slice(0, 4).map((s) => s.domain).join(", ");

  const raw: Check[] = [
    {
      id: "ai-mentions", category: "ai", title: "Mentioned in AI answers for category questions", impact: "high",
      status: shareOfVoice >= 50 ? "pass" : mentions > 0 ? "warn" : "fail",
      finding: `${crawl.brand.name} was mentioned in ${mentions} of ${unbranded.length} AI answers to buyer questions about ${category} (${perEngine}).`,
      recommendation: `${rivals ? `The engines leaned on ${rivals} instead. ` : ""}Earn mentions on the sites AI engines cite (reviews, comparison articles, directories, PR), publish "best" and comparison content on your own site, and strengthen your Organization schema and llms.txt.`,
    },
    {
      id: "ai-citations", category: "ai", title: "Website cited as a source by AI", impact: "medium",
      status: citedCount >= 2 ? "pass" : citedCount === 1 ? "warn" : "fail",
      finding: `${crawl.host} was cited as a source in ${citedCount} of ${unbranded.length} AI answers to buyer questions.`,
      recommendation: "Publish clear, factual pages that answer buyer questions directly (pricing factors, comparisons, FAQs, original data). Make sure AI crawlers are allowed in robots.txt and the content is in the HTML.",
    },
    {
      id: "ai-brand-recognition", category: "ai", title: "AI engines recognise the brand", impact: "medium",
      status: branded.length && recognised === branded.length ? "pass" : recognised > 0 ? "warn" : "fail",
      finding: `${recognised} of ${branded.length} engines gave a substantive answer when asked directly about ${crawl.brand.name}.`,
      recommendation: "Keep your brand facts consistent across your website, Google Business Profile, LinkedIn, Crunchbase and industry directories, and link them with sameAs in your Organization schema so AI models can confidently describe you.",
    },
  ];
  const checks = raw.map((c) => ({ ...c, recommendation: c.status === "pass" ? "" : c.recommendation }));

  return {
    kind: "ai",
    host: crawl.host,
    brand: crawl.brand.name,
    category,
    engines: engines.map((e) => e.label),
    prompts: rows,
    shareOfVoice,
    topSources,
    checks,
  };
}
