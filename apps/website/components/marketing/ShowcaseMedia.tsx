"use client";

import { useEffect, useRef, useState } from "react";

type TabId = "debug" | "prevent" | "share";

const TABS: {
  id: TabId;
  label: string;
  src: string;
  poster: string;
  caption: string;
}[] = [
  {
    id: "debug",
    label: "Debug",
    src: "/showcase/video/debug-tree.webm",
    poster: "/showcase/posters/debug-tree.png",
    caption: "List a local run, then inspect the execution tree.",
  },
  {
    id: "prevent",
    label: "Prevent",
    src: "/showcase/video/check-pass-fail.webm",
    poster: "/showcase/posters/check-pass-fail.png",
    caption: "The same check exits 0 for demo-good and 1 for demo-regression.",
  },
  {
    id: "share",
    label: "Share",
    src: "/showcase/video/evidence-bundle.webm",
    poster: "/showcase/posters/evidence-bundle.png",
    caption: "Write share-checked Evidence v2 to ./evidence and verify hashes offline.",
  },
];

export function ShowcaseMedia() {
  const [tab, setTab] = useState<TabId>("debug");
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const active = TABS.find((item) => item.id === tab) ?? TABS[0]!;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;
    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => {});
    }
  }, [paused, tab, reduceMotion]);

  return (
    <div className="rounded-2xl border border-border bg-[#0b1220] p-1 shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              item.id === tab
                ? "rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white"
                : "rounded-lg px-3 py-1 text-xs font-medium text-slate-400 hover:text-white"
            }
          >
            {item.label}
          </button>
        ))}
        {!reduceMotion ? (
          <button
            type="button"
            className="ml-auto rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-white"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Play" : "Pause"}
          </button>
        ) : null}
      </div>
      {reduceMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={active.poster} alt={active.caption} className="w-full rounded-b-xl" />
      ) : (
        <video
          key={active.id}
          ref={videoRef}
          className="w-full rounded-b-xl"
          poster={active.poster}
          muted
          loop
          playsInline
          autoPlay={!paused}
        >
          <source src={active.src} type="video/webm" />
          <source src={active.src.replace(".webm", ".mp4")} type="video/mp4" />
        </video>
      )}
      <p className="px-4 py-3 text-xs text-slate-400">{active.caption}</p>
    </div>
  );
}
