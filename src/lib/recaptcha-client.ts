/**
 * Client-side Google reCAPTCHA v3 helper.
 *
 * Calls grecaptcha.ready() and grecaptcha.execute() to retrieve a verification token.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const clean = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

function ensureScriptLoaded(siteKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();

  const scriptId = "google-recaptcha-v3-script";
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (existing) return Promise.resolve();

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn("[recaptcha] script failed to load (blocked by ad-blocker or offline)");
      resolve();
    };
    document.head.appendChild(script);
  });
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  const rawKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!rawKey) return null;
  const siteKey = clean(rawKey);
  if (!siteKey || typeof window === "undefined") return null;

  try {
    await ensureScriptLoaded(siteKey);

    return await new Promise<string | null>((resolve) => {
      // Set a 5-second timeout in case Google is unreachable or blocked
      const timer = setTimeout(() => {
        console.warn("[recaptcha] verification timed out");
        resolve(null);
      }, 5000);

      const checkAndRun = () => {
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha?.ready) return false;

        grecaptcha.ready(async () => {
          try {
            if (typeof grecaptcha.execute === "function") {
              const token = await grecaptcha.execute(siteKey, { action });
              clearTimeout(timer);
              resolve(token || null);
            } else {
              console.warn("[recaptcha] grecaptcha.execute is not ready yet");
              // Wait slightly and retry once
              setTimeout(async () => {
                if (typeof window.grecaptcha?.execute === "function") {
                  try {
                    const token = await window.grecaptcha.execute(siteKey, { action });
                    clearTimeout(timer);
                    resolve(token || null);
                  } catch (e) {
                    clearTimeout(timer);
                    resolve(null);
                  }
                } else {
                  clearTimeout(timer);
                  resolve(null);
                }
              }, 300);
            }
          } catch (err) {
            console.warn("[recaptcha] execute error:", err);
            clearTimeout(timer);
            resolve(null);
          }
        });
        return true;
      };

      if (!checkAndRun()) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (checkAndRun() || attempts > 30) {
            clearInterval(interval);
            if (attempts > 30) {
              clearTimeout(timer);
              resolve(null);
            }
          }
        }, 100);
      }
    });
  } catch (err) {
    console.warn("[recaptcha] token retrieval error:", err);
    return null;
  }
}
