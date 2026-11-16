import { resolveMx } from "node:dns/promises";

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com", "10minutemail.net",
  "tempmail.com", "temp-mail.org", "tempmail.net", "tempmailo.com", "yopmail.com", "yopmail.net", "trashmail.com",
  "getnada.com", "nada.email", "dispostable.com", "maildrop.cc", "mintemail.com", "throwawaymail.com", "fakeinbox.com",
  "mohmal.com", "emailondeck.com", "mailnesia.com", "spamgourmet.com", "moakt.com", "tmail.ws", "burnermail.io",
]);

const FREE = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "yahoo.co.in", "ymail.com", "rocketmail.com", "outlook.com",
  "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "rediffmail.com", "proton.me",
  "protonmail.com", "zoho.com", "gmx.com", "mail.com", "yandex.com",
]);

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);

/** Is the server's DNS working at all? Checked against a domain that always has MX records; cached for 5 minutes. */
let dnsHealthy: { ok: boolean; at: number } | null = null;
async function dnsWorks(): Promise<boolean> {
  if (dnsHealthy && Date.now() - dnsHealthy.at < 300_000) return dnsHealthy.ok;
  const ok = await withTimeout(resolveMx("gmail.com"), 3000).then((r) => r.length > 0, () => false);
  dnsHealthy = { ok, at: Date.now() };
  if (!ok) console.warn("[email-check] DNS lookups are failing on this server; skipping the MX check.");
  return ok;
}

/** "ok" = has MX, "none" = domain cannot receive mail, "unknown" = could not tell (never block on this). */
async function lookupMx(domain: string): Promise<"ok" | "none" | "unknown"> {
  try {
    const mx = await withTimeout(resolveMx(domain), 4000);
    return mx.length ? "ok" : "none";
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return (await dnsWorks()) ? "none" : "unknown";
    return "unknown"; // timeouts, SERVFAIL and other transient errors
  }
}

/**
 * Returns an error message for the visitor, or null if the address looks deliverable.
 * Checks: disposable domains, optional business-email rule, and that the domain has MX records.
 */
export async function checkEmail(email: string): Promise<string | null> {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (!domain) return "Please enter a valid email address.";
  if (DISPOSABLE.has(domain)) return "Please use a permanent email address so we can send your report.";
  if (process.env.REQUIRE_BUSINESS_EMAIL === "1" && FREE.has(domain))
    return "Please use your work email address (not Gmail, Yahoo or Outlook).";
  const mx = await lookupMx(domain);
  if (mx === "none") return "That email domain cannot receive mail. Please check the address.";
  return null;
}
