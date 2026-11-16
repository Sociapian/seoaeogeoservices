"use client";

import { useEffect } from "react";

/**
 * One observer for the whole site. Any element with `data-reveal` fades/slides
 * in the first time it enters the viewport. Children of an element with
 * `data-stagger` get increasing delays so grids animate in sequence.
 * New elements (client-side navigation) are picked up automatically.
 */
export function RevealObserver() {
  useEffect(() => {
    const w = window as Window & { __revealReady?: boolean };
    w.__revealReady = true;
    const root = document.documentElement;

    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    const bind = () => {
      document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
        const step = Number(group.dataset.stagger) || 90;
        group.querySelectorAll<HTMLElement>(":scope > [data-reveal]").forEach((child, i) => {
          if (!child.style.getPropertyValue("--reveal-delay")) child.style.setProperty("--reveal-delay", `${Math.min(i * step, 720)}ms`);
        });
      });
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-bound])").forEach((el) => {
        el.dataset.revealBound = "1";
        io.observe(el);
      });
    };

    bind();
    let t: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(bind, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    root.classList.add("js-reveal-ready");

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(t);
    };
  }, []);

  return null;
}
