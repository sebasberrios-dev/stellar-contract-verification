"use client";

import { useEffect, useRef } from "react";

/**
 * Looping brand video for the hero. Muted + playsInline so mobile browsers
 * allow autoplay; paused under prefers-reduced-motion (poster frame remains).
 * A radial mask fades the edges into the starry page background so the
 * rectangle never shows.
 *
 * The src is picked on the client so phones stream the 640p rendition
 * (~3x smaller) and the download never blocks first paint — the poster
 * renders immediately from SSR either way.
 */
export default function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // poster stays; never download the video
    }

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const small =
      window.matchMedia("(max-width: 640px)").matches || connection?.saveData;

    video.src = small ? "/videos/csv-hero-640.mp4" : "/videos/csv-hero.mp4";
    void video.play().catch(() => {
      // Autoplay rejected (e.g. battery saver) — the poster remains.
    });
  }, []);

  // Long, gradual fade — starts well inside the frame so no edge or corner
  // of the rectangle ever reads as a boundary.
  const mask =
    "radial-gradient(ellipse 62% 54% at 50% 50%, black 30%, transparent 72%)";

  return (
    <video
      ref={ref}
      poster="/images/csv-hero-poster.webp"
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      // mix-blend-screen sinks the video's dark space background into the
      // page background, so only the bright glow reads — no floating rectangle
      className={`select-none pointer-events-none mix-blend-screen ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}
