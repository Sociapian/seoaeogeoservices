"use client";

import { useEffect, useState } from "react";

/** Table of contents that highlights the section currently being read. */
export function Toc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;
  return (
    <nav aria-label="On this page">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">On this page</p>
      <ol className="mt-3 space-y-1 border-l border-brand-100">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition ${
                active === i.id ? "border-accent font-bold text-ink" : "border-transparent text-ink-soft hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
