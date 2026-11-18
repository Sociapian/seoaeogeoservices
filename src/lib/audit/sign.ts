import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The audit is stateless: /api/audit returns the result plus an HMAC signature,
 * and /api/audit/report only renders a PDF for a result whose signature verifies.
 * That stops the PDF endpoint being used to generate Sociapa-branded reports
 * with arbitrary content. Set AUDIT_SECRET in production so every server
 * instance shares the same key.
 */
const clean = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

let devSecret: string | null = null;
function secret(): string {
  const envSecret = clean(process.env.AUDIT_SECRET);
  if (envSecret) return envSecret;
  if (process.env.NODE_ENV === "production")
    console.warn("[audit] AUDIT_SECRET is not set. Using a per-process key; set it for multi-instance deployments.");
  return (devSecret ??= randomBytes(32).toString("hex"));
}

export function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export interface Sealed {
  payload: string;
  signature: string;
}

/** Serialise and sign a result for the browser to hold. */
export function seal(obj: object): Sealed {
  const payload = JSON.stringify(obj);
  return { payload, signature: sign(payload) };
}

/** Verify and parse a sealed result; returns null if tampered or of the wrong kind. */
export function unseal<T extends { kind: string }>(s: Sealed | undefined | null, kind: T["kind"]): T | null {
  if (!s || typeof s.payload !== "string" || typeof s.signature !== "string") return null;
  if (!verify(s.payload, s.signature)) return null;
  try {
    const obj = JSON.parse(s.payload);
    return obj?.kind === kind ? (obj as T) : null;
  } catch {
    return null;
  }
}

export function verify(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload), "hex");
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
