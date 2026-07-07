"use client";

import { useEffect, useRef } from "react";

/**
 * Looping brand video for the hero. Muted + playsInline so mobile browsers
 * allow autoplay; paused under prefers-reduced-motion (poster frame remains).
 * A radial mask fades the edges into the starry page background so the
 * rectangle never shows.
 */
export default function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.removeAttribute("autoplay");
      video.pause();
    }
  }, []);

  // Long, gradual fade — starts well inside the frame so no edge or corner
  // of the rectangle ever reads as a boundary.
  const mask =
    "radial-gradient(ellipse 62% 54% at 50% 50%, black 30%, transparent 72%)";

  return (
    <video
      ref={ref}
      src="/videos/csv-hero.mp4"
      poster="/images/csv-hero-poster.webp"
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      // mix-blend-screen sinks the video's dark space background into the
      // page background, so only the bright glow reads — no floating rectangle
      className={`select-none pointer-events-none mix-blend-screen ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}
