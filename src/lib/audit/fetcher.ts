import { lookup } from "node:dns/promises";
import net from "node:net";

export class AuditError extends Error {
  constructor(
    public code: "invalid_url" | "blocked" | "unreachable" | "timeout" | "not_html",
    message: string,
  ) {
    super(message);
  }
}

const UA =
  "Mozilla/5.0 (compatible; SociapaAuditBot/1.0; +https://seoaeogeoservices.com/free-seo-audit)";

const allowPrivate = () =>
  process.env.AUDIT_ALLOW_PRIVATE === "1" && process.env.NODE_ENV !== "production";

/** Accepts "example.com", "www.example.com/page", "https://example.com". */
export function normalizeUrl(input: string): URL {
  let raw = (input || "").trim();
  if (!raw || raw.length > 2000) throw new AuditError("invalid_url", "Please enter a website address.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new AuditError("invalid_url", "That does not look like a valid website address.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:")
    throw new AuditError("invalid_url", "Only http and https addresses can be audited.");
  if (u.username || u.password) throw new AuditError("invalid_url", "URLs with credentials are not supported.");
  if (!allowPrivate() && !u.hostname.includes("."))
    throw new AuditError("invalid_url", "Please enter a full domain, for example yourbrand.com.");
  u.hash = "";
  return u;
}

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateV4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb") ||
    v6.startsWith("ff") ||
    v6.startsWith("::ffff:")
  );
}

/** SSRF guard: refuse hosts that resolve to loopback, private or link-local ranges. */
async function assertPublicHost(hostname: string): Promise<void> {
  if (allowPrivate()) return;
  const host = hostname.replace(/^\[|\]$/g, "");
  let addrs: string[];
  if (net.isIP(host)) addrs = [host];
  else {
    try {
      addrs = (await lookup(host, { all: true })).map((a) => a.address);
    } catch {
      throw new AuditError("unreachable", "We could not find that domain. Please check the spelling.");
    }
  }
  if (!addrs.length || addrs.some(isPrivateIp))
    throw new AuditError("blocked", "That address cannot be audited.");
}

export interface FetchResult {
  finalUrl: string;
  status: number;
  headers: Headers;
  body: string;
  ms: number;
  redirects: number;
}

interface Opts {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

/**
 * Fetch a URL with: manual redirect following (each hop re-validated),
 * a hard timeout, and a response size cap.
 */
export async function safeFetch(start: URL | string, opts: Opts = {}): Promise<FetchResult> {
  const { timeoutMs = 12000, maxBytes = 2_000_000, maxRedirects = 5 } = opts;
  let url = typeof start === "string" ? new URL(start) : start;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new AuditError("blocked", "That address cannot be audited.");
      await assertPublicHost(url.hostname);
      const res = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
          "accept-language": "en",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        await res.body?.cancel();
        url = new URL(res.headers.get("location")!, url);
        continue;
      }
      const ms = Date.now() - t0;
      const body = await readCapped(res, maxBytes);
      return { finalUrl: url.toString(), status: res.status, headers: res.headers, body, ms, redirects: hop };
    }
    throw new AuditError("unreachable", "The site redirected too many times.");
  } catch (e) {
    if (e instanceof AuditError) throw e;
    if ((e as Error).name === "AbortError")
      throw new AuditError("timeout", "The site took too long to respond. Please try again.");
    throw new AuditError("unreachable", "We could not reach that website. Please check the address.");
  } finally {
    clearTimeout(timer);
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  if (total >= maxBytes) await reader.cancel().catch(() => {});
  return Buffer.concat(chunks).subarray(0, maxBytes).toString("utf8");
}
