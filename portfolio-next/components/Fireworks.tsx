"use client";

import { useEffect, useRef } from "react";

/* =========================================================
   Fireworks — crimson "red-neon" particle bursts on click.
   A full-screen, pointer-events:none canvas overlay. Every
   click anywhere on the page spawns a radial burst in the
   same hot-crimson palette as the hero silk shader.
   · additive ("lighter") blending → glowing neon trails
   · gravity + drag + fade for a real firework arc
   · rAF loop runs ONLY while particles are alive (idle = 0 CPU)
   · honours prefers-reduced-motion (no bursts)
   It only draws to its own React-owned canvas — it never mutates
   the server-rendered DOM, so it's hydration-safe.
   ========================================================= */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  decay: number;
  size: number;
  hue: number; // 0..1, slight variation within the red-neon band
}

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // No bursts when the user prefers reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    let raf = 0;

    // Red-neon palette, matched to the hero silk glow (rgb ~255,30,46):
    // r pinned at 255, g/b drift just enough for crimson → hot-pink sparks.
    const rgbFor = (hue: number) => {
      const g = Math.round(18 + hue * 78); // 18..96
      const b = Math.round(38 + (1 - hue) * 46); // 38..84
      return `255, ${g}, ${b}`;
    };

    const spawn = (cx: number, cy: number) => {
      const count = 36 + Math.floor(Math.random() * 24); // 36..60
      const baseHue = Math.random();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = (2 + Math.random() * 5.5) * dpr;
        particles.push({
          x: cx * dpr,
          y: cy * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          size: (1.3 + Math.random() * 2.3) * dpr,
          hue: Math.min(1, Math.max(0, baseHue + (Math.random() - 0.5) * 0.4)),
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const gravity = 0.06 * dpr;
    const drag = 0.985;

    const tick = () => {
      // Fade the previous frame instead of clearing → glowing comet trails.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const rgb = rgbFor(p.hue);
        const a = p.life;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb}, ${a * 0.9})`;
        ctx.shadowBlur = 14 * dpr;
        ctx.shadowColor = `rgba(${rgb}, ${a})`;
        ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      if (particles.length) {
        raf = requestAnimationFrame(tick);
      } else {
        // Fully clear residual trail pixels before going idle.
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        raf = 0;
      }
    };

    const onClick = (e: MouseEvent) => spawn(e.clientX, e.clientY);
    window.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9400,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}
