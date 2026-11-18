/**
 * Client-side Google reCAPTCHA v3 helper.
 *
 * Dynamically loads the official Google reCAPTCHA script only when needed,
 * or reuses the script if already loaded. If NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 * is not configured, returns null without errors so local forms work smoothly.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window === "undefined") return Promise.resolve();

  if (window.grecaptcha?.execute) {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const scriptId = "google-recaptcha-v3-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      if (window.grecaptcha?.execute) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load reCAPTCHA")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google reCAPTCHA"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

const clean = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

export async function getRecaptchaToken(action: string): Promise<string | null> {
  const siteKey = clean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  if (!siteKey) return null;
  if (typeof window === "undefined") return null;

  try {
    await loadRecaptchaScript(siteKey);

    return await new Promise<string | null>((resolve) => {
      const grecaptcha = window.grecaptcha;
      if (!grecaptcha?.ready || !grecaptcha.execute) {
        resolve(null);
        return;
      }
      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(siteKey, { action });
          resolve(token);
        } catch (err) {
          console.warn("[recaptcha] execute failed:", err);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn("[recaptcha] token generation error:", err);
    return null;
  }
}
