export interface RecaptchaVerification {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  error?: string;
}

/**
 * Server-side verification for Google reCAPTCHA v3 (and v2).
 * Verifies the token against Google's siteverify endpoint.
 *
 * If RECAPTCHA_SECRET_KEY is not configured (e.g. in local development before keys are set),
 * it logs a notice and allows the request through with success: true.
 */
const clean = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

export async function verifyRecaptcha(
  token: string | undefined | null,
  expectedAction?: string
): Promise<RecaptchaVerification> {
  const secret = clean(process.env.RECAPTCHA_SECRET_KEY);

  // Graceful fallback: If secret key is not configured, don't block forms
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.log("[recaptcha] RECAPTCHA_SECRET_KEY is not set; allowing submission in dev/unconfigured mode.");
    }
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return {
      success: false,
      error: "Bot protection check was missing. Please refresh the page and try again.",
    };
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.warn(`[recaptcha] siteverify HTTP status: ${res.status}`);
      return { success: false, error: "Security check service temporarily unavailable. Please try again." };
    }

    const data = await res.json();
    if (!data.success) {
      const errorCodes = Array.isArray(data["error-codes"]) ? data["error-codes"].join(", ") : "unknown error";
      console.warn(`[recaptcha] verification failed: ${errorCodes}`);
      return { success: false, error: "Bot verification failed. Please try again." };
    }

    // Check v3 risk score (Google returns score between 0.0 and 1.0)
    if (typeof data.score === "number") {
      const minScore = Number(clean(process.env.RECAPTCHA_MIN_SCORE) || "0.5");
      if (data.score < minScore) {
        console.warn(`[recaptcha] score too low: ${data.score} < ${minScore}`);
        return {
          success: false,
          score: data.score,
          error: "Submission could not be verified. Please try again later.",
        };
      }
    }

    // Verify action name if provided
    if (expectedAction && data.action && data.action !== expectedAction) {
      console.warn(`[recaptcha] action mismatch: expected '${expectedAction}', got '${data.action}'`);
      return {
        success: false,
        action: data.action,
        error: "Security verification context mismatch. Please try again.",
      };
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
    };
  } catch (err) {
    console.error("[recaptcha] verification request error:", (err as Error).message);
    // On network timeout to Google's server, fail open to avoid rejecting genuine user requests
    return { success: true, score: 1.0 };
  }
}
