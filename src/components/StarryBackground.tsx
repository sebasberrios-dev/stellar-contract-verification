'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

/**
 * Constellation canvas. Transparent — the page's ember background shows
 * through. Cheap per-frame work: plain arc fills only (no gradient or shadow
 * allocations inside the loop). Under prefers-reduced-motion it draws a
 * single static frame and never starts the animation loop.
 */
export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const STAR_COUNT = 80;
    const CONNECTION_DIST = 140;
    const MOUSE_DIST = 200;

    // Warm ember tints — match the active palette
    const GLOW = '255,186,120';
    const LINE = '255,166,98';

    const initStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.7 + 0.2,
          speed: Math.random() * 0.3 + 0.1,
        });
      }
      starsRef.current = stars;
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const stars = starsRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (animate) {
          star.y -= star.speed;
          if (star.y < -10) {
            star.y = canvas.height + 10;
            star.x = Math.random() * canvas.width;
          }
        }

        // Soft halo + core — two flat fills, no gradient allocation
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GLOW},${star.opacity * 0.18})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,244,230,${star.opacity})`;
        ctx.fill();

        // Constellation lines between nearby stars
        for (let j = i + 1; j < stars.length; j++) {
          const dx = star.x - stars[j].x;
          const dy = star.y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(${LINE},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Line to the cursor
        const dx = star.x - mouse.x;
        const dy = star.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          const alpha = (1 - dist / MOUSE_DIST) * 0.4;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${LINE},${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      if (reducedMotion) drawFrame(false);
    };

    const loop = () => {
      drawFrame(true);
      animationRef.current = requestAnimationFrame(loop);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener('resize', resize);

    if (!reducedMotion) {
      window.addEventListener('mousemove', onMouseMove);
      loop();
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
