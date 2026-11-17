import React from "react";

/**
 * Required notice when Google reCAPTCHA is active.
 * Complies with Google reCAPTCHA Terms of Service.
 */
export function RecaptchaNotice() {
  return (
    <p className="text-[11px] leading-tight text-ink-mute/70 text-center">
      Protected by reCAPTCHA (Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-brand-600"
      >
        Privacy Policy
      </a>{" "}
      &amp;{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-brand-600"
      >
        Terms of Service
      </a>
      ).
    </p>
  );
}
