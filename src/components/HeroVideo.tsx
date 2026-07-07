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

  const mask =
    "radial-gradient(ellipse 72% 62% at 50% 50%, black 48%, transparent 80%)";

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
      className={`select-none pointer-events-none ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}
