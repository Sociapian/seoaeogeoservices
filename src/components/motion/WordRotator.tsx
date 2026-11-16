"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through words with a slide-up animation. The full list is given to
 * screen readers and crawlers via `srText`; the animated word is aria-hidden.
 */
export function WordRotator({ words, srText, interval = 2200, className = "" }: { words: string[]; srText: string; interval?: number; className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <>
      <span className="sr-only">{srText}</span>
      <span aria-hidden className="relative inline-block overflow-hidden pb-1 align-bottom">
        <span key={i} className={`inline-block animate-word-in ${className}`}>{words[i]}</span>
      </span>
    </>
  );
}
