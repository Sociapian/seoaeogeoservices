import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", lg: "2rem" }, screens: { "2xl": "1200px" } },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        ink: { DEFAULT: "#12102a", soft: "#4a4766", mute: "#74718f" },
        brand: {
          50: "#f3f0ff",
          100: "#e7e0ff",
          200: "#cfc2ff",
          300: "#ad98ff",
          400: "#8a6bff",
          500: "#6a45f7",
          600: "#5630e0",
          700: "#4424b8",
          800: "#331c8a",
          900: "#22145c",
        },
        accent: { DEFAULT: "#ff6a3d", dark: "#e9531f" },
        mint: "#12b886",
        paper: "#faf9ff",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,16,42,.05), 0 12px 32px -12px rgba(18,16,42,.14)",
        lift: "0 24px 60px -20px rgba(86,48,224,.35)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(18px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(40px)" }, to: { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        drift: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-30px) scale(1.08)" },
          "66%": { transform: "translate(-30px,20px) scale(.95)" },
        },
        shine: { from: { transform: "translateX(-120%) skewX(-20deg)" }, to: { transform: "translateX(220%) skewX(-20deg)" } },
        "word-in": { from: { opacity: "0", transform: "translateY(60%)" }, to: { opacity: "1", transform: "none" } },
        "ping-soft": { "0%": { transform: "scale(1)", opacity: ".55" }, "100%": { transform: "scale(1.9)", opacity: "0" } },
        "grow-x": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "border-spin": { to: { "--angle": "360deg" } },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .8s ease both",
        "slide-in-right": "slide-in-right .9s cubic-bezier(.2,.7,.2,1) both",
        float: "float 4s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        shine: "shine .9s ease",
        "word-in": "word-in .55s cubic-bezier(.2,.7,.2,1) both",
        "ping-soft": "ping-soft 1.8s cubic-bezier(0,0,.2,1) infinite",
        "grow-x": "grow-x 1.2s cubic-bezier(.2,.7,.2,1) both",
      },
      typography: () => ({
        brand: {
          css: {
            "--tw-prose-body": "#3d3a58",
            "--tw-prose-headings": "#12102a",
            "--tw-prose-links": "#5630e0",
            "--tw-prose-bold": "#12102a",
            "--tw-prose-bullets": "#ff6a3d",
            "--tw-prose-counters": "#5630e0",
            "--tw-prose-quotes": "#22145c",
            "--tw-prose-quote-borders": "#8a6bff",
            "--tw-prose-th-borders": "#cfc2ff",
            "--tw-prose-td-borders": "#e7e0ff",
            "--tw-prose-code": "#4424b8",
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
