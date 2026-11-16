"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import type { ExplainerVideo } from "@/content/videos";

/**
 * Tabbed explainer player.
 * - Plays muted when at least 40% of the player is on screen, pauses when it leaves.
 * - Moves to the next video when one ends.
 * - No autoplay for visitors with reduced-motion or data-saver on; they get a play button.
 * - Links like /#video-geo open the matching tab.
 */
export function VideoShowcase({ videos }: { videos: ExplainerVideo[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoOk, setAutoOk] = useState(true);
  const inView = useRef(false);
  const userPaused = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const v = videos[active];

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setAutoOk(!reduced && !saveData);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (entry.isIntersecting && autoOk && !userPaused.current) tryPlay();
        if (!entry.isIntersecting) videoRef.current?.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoOk, tryPlay]);

  // New tab: restart and play if the player is on screen.
  useEffect(() => {
    setProgress(0);
    const el = videoRef.current;
    if (!el) return;
    el.load();
    if (inView.current && (autoOk || playing) && !userPaused.current) tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Deep links: /#video-seo, /#video-aeo, /#video-geo
  useEffect(() => {
    const fromHash = () => {
      const i = videos.findIndex((x) => `#video-${x.id}` === window.location.hash);
      if (i >= 0) {
        userPaused.current = false;
        setActive(i);
        document.getElementById("watch")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [videos]);

  const select = (i: number) => {
    userPaused.current = false;
    setActive(i);
  };

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      tryPlay();
    } else {
      userPaused.current = true;
      el.pause();
      setPlaying(false);
    }
  };

  const onKeyTabs = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (active + (e.key === "ArrowRight" ? 1 : videos.length - 1)) % videos.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div ref={wrapRef} className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
      <div data-reveal="left">
        <div role="tablist" aria-label="Explainer videos" className="mb-4 flex gap-2" onKeyDown={onKeyTabs}>
          {videos.map((x, i) => (
            <button
              key={x.id}
              id={`video-tab-${x.id}`}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={i === active}
              aria-controls="video-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              className={`relative flex-1 overflow-hidden rounded-xl border px-4 py-3 text-left transition ${
                i === active ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[.03] hover:bg-white/[.07]"
              }`}
            >
              <span className="block text-lg font-extrabold" style={{ color: x.accent }}>{x.tag}</span>
              <span className="hidden truncate text-xs text-brand-200 sm:block">{x.tagline}</span>
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10" aria-hidden>
                <span className="block h-full" style={{ width: i === active ? `${progress}%` : "0%", background: x.accent, transition: "width .25s linear" }} />
              </span>
            </button>
          ))}
        </div>

        <figure id="video-panel" role="tabpanel" aria-labelledby={`video-tab-${v.id}`} className="m-0">
          <div className="relative overflow-hidden rounded-2xl bg-[#140d38] shadow-lift ring-1 ring-white/10" style={{ aspectRatio: "16 / 9" }}>
            <video
              key={v.id}
              ref={videoRef}
              className="h-full w-full object-cover"
              poster={v.poster}
              muted
              playsInline
              preload="none"
              width={1280}
              height={720}
              aria-label={`${v.title}. ${v.transcript}`}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => {
                const t = e.currentTarget;
                if (t.duration) setProgress((t.currentTime / t.duration) * 100);
              }}
              onEnded={() => {
                setProgress(100);
                if (autoOk && !userPaused.current) select((active + 1) % videos.length);
              }}
            >
              <source src={v.webm} type="video/webm" />
              <source src={v.mp4} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? `Pause ${v.tag} video` : `Play ${v.tag} video`}
              className={`absolute inset-0 grid place-items-center transition ${playing ? "opacity-0 hover:opacity-100 focus-visible:opacity-100" : "bg-black/20"}`}
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:scale-110">
                {playing ? <Pause size={26} aria-hidden /> : progress >= 100 ? <RotateCcw size={24} aria-hidden /> : <Play size={26} className="ml-1" aria-hidden />}
              </span>
            </button>
          </div>
          <figcaption className="mt-3 text-xs text-brand-200">
            {v.title} · 20 seconds · no sound
          </figcaption>
        </figure>
      </div>

      <div key={v.id} className="animate-fade-up" data-reveal="right">
        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: v.accent }}>{v.tag} in short</p>
        <h3 className="mt-2 text-3xl font-extrabold leading-tight text-white">{v.tagline}</h3>
        <h4 className="mt-6 text-sm font-bold text-white">What we work on</h4>
        <ul className="mt-3 flex flex-wrap gap-2">
          {v.workOn.map((w) => (
            <li key={w} className="rounded-full border px-3.5 py-1.5 text-sm font-semibold text-white" style={{ borderColor: v.accent }}>{w}</li>
          ))}
        </ul>
        <h4 className="mt-6 text-sm font-bold text-white">The result</h4>
        <p className="mt-1 text-lg font-extrabold" style={{ color: v.accent }}>{v.result}</p>
        <p className="mt-1 text-sm text-brand-200">{v.trackedBy}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`#${v.id}`} className="btn-primary">See full {v.tag} service <ArrowRight size={15} aria-hidden /></Link>
        </div>
        <details className="mt-6 text-sm text-brand-200">
          <summary className="cursor-pointer font-semibold text-brand-100">Read the video transcript</summary>
          <p className="mt-2 leading-relaxed">{v.transcript}</p>
        </details>
      </div>
    </div>
  );
}
