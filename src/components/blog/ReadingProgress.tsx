"use client";

import { useEffect, useRef } from "react";

/** Thin bar under the header that fills as the reader scrolls through the article. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let raf = 0;
    const update = () => {
      const r = target.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
      bar.current?.style.setProperty("--progress", String(p));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [targetId]);

  return (
    <div className="fixed inset-x-0 top-[68px] z-40 h-1 bg-transparent" aria-hidden>
      <div ref={bar} className="reading-progress h-full bg-gradient-to-r from-brand-500 via-accent to-[#ffb199]" />
    </div>
  );
}
