"use client";

/* CrystalCursor — gold-on-ink crystalline cursor trail + click-to-shatter.
   Re-themed to the site palette (wine / gold / parchment / ink) and rebuilt
   to be SSR-safe and efficient:
   · 'use client' + no `window` at render (original crashed during SSR)
   · particle classes hoisted to module scope (not re-created every render)
   · colour props are actually used (fade via globalAlpha, not baked hsla)
   · in-place array compaction + particle caps (no per-frame realloc/leak)
   · ResizeObserver + container-relative coords (works embedded, not just full-screen)
   · pauses on tab-hidden / off-screen and honours prefers-reduced-motion

   Two modes:
   · default — full-screen experience with title/subtitle/caption on ink
   · overlay — transparent, screen-blended, no text, pointer-events:none and
     window-tracked; drop it INTO a section (e.g. the hero) so the gold trail
     composites over whatever is behind it without blocking the UI. */

import React, { useEffect, useRef } from "react";

type CrystalCursorProps = {
  title?: string;
  subtitle?: string;
  caption?: string;
  /** solid colour of the growing crystal lines (alpha is animated separately) */
  crystalColor?: string;
  /** solid colour of the click shards */
  shatterColor?: string;
  /** base fill behind the canvas (full mode only) */
  background?: string;
  /** per-frame fade — lower alpha = longer trails (full mode only) */
  trailColor?: string;
  /** render with no text overlay, absolute-filling its parent (e.g. a hero) */
  overlay?: boolean;
  /** in overlay mode: true = transparent/screen-blended layer; false = opaque
      themed background (gold trails on `background`). Defaults to true. */
  transparent?: boolean;
  /** continuously spawn faint crystal clusters across the whole area, so the
      background stays a living crystalline field even when the cursor is idle */
  ambient?: boolean;
  /** soft glow on the crystals/shards (canvas shadowBlur, px) */
  glow?: number;
  className?: string;
  style?: React.CSSProperties;
};

const MAX_CRYSTALS = 100;
const MAX_SHARDS = 400;
const CRYSTAL_LIFE = 150;
const SHARD_LIFE = 100;

class Crystal {
  x: number;
  y: number;
  angle: number;
  radius = 0;
  targetRadius: number;
  life = CRYSTAL_LIFE;
  lineWidth: number;
  turnAngle: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.targetRadius = Math.random() * 80 + 20;
    this.lineWidth = Math.random() * 1.5 + 0.5;
    this.turnAngle = (Math.random() - 0.5) * 0.1;
  }
  update() {
    if (this.radius < this.targetRadius) this.radius += 0.5;
    this.life -= 1;
    this.angle += this.turnAngle;
  }
  draw(ctx: CanvasRenderingContext2D, color: string) {
    ctx.globalAlpha = this.life / CRYSTAL_LIFE;
    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x + Math.cos(this.angle) * this.radius,
      this.y + Math.sin(this.angle) * this.radius
    );
    ctx.stroke();
  }
}

class Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life = SHARD_LIFE;
  size: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 3 + 1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
  }
  draw(ctx: CanvasRenderingContext2D, color: string) {
    ctx.globalAlpha = this.life / SHARD_LIFE;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function CrystalCursor({
  title = "Aetherium",
  subtitle = "Memories in glass",
  caption = "Click to release them",
  crystalColor = "rgba(200, 164, 92, 0.9)", // --gold
  shatterColor = "rgba(220, 196, 138, 1)", // --gold-soft
  background = "#16100f", // --ink
  trailColor = "rgba(22, 16, 15, 0.12)",
  overlay = false,
  transparent,
  ambient = false,
  glow = 0,
  className = "",
  style,
}: CrystalCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // screen-blend (see-through) only when explicitly transparent in overlay mode
  const useScreen = overlay && transparent !== false;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: 0, y: 0 };
    const crystals: Crystal[] = [];
    const shards: Shard[] = [];
    let raf = 0;
    let running = true;
    let frame = 0;

    const size = () => {
      const r = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width));
      canvas.height = Math.max(1, Math.round(r.height));
      mouse.x = canvas.width / 2;
      mouse.y = canvas.height / 2;
      if (useScreen) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    size();

    // seed an immediate ambient field so the background is populated at once
    // (staggered life + partial growth → no "filling up" delay on reveal)
    if (ambient) {
      for (let i = 0; i < 48; i++) {
        const c = new Crystal(Math.random() * canvas.width, Math.random() * canvas.height);
        c.life = 30 + Math.random() * 120;
        c.radius = Math.random() * c.targetRadius;
        crystals.push(c);
      }
    }

    const ro = new ResizeObserver(size);
    ro.observe(container);

    const point = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const shatter = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (overlay && (x < 0 || y < 0 || x > r.width || y > r.height)) return; // only within the layer
      const n = Math.min(50, MAX_SHARDS - shards.length);
      for (let i = 0; i < n; i++) shards.push(new Shard(x, y));
    };

    // overlay can't receive events (pointer-events:none) → track the window;
    // full mode scopes to its own container.
    const target: Window | HTMLDivElement = overlay ? window : container;
    target.addEventListener("pointermove", point as EventListener, { passive: true });
    target.addEventListener("pointerdown", shatter as EventListener, { passive: true });

    const animate = () => {
      if (useScreen) {
        // fade existing trail toward transparent so the layer below shows through
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = trailColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      frame++;

      // crystals at the cursor
      if (crystals.length < MAX_CRYSTALS && Math.random() > 0.7) {
        crystals.push(
          new Crystal(
            mouse.x + (Math.random() - 0.5) * 50,
            mouse.y + (Math.random() - 0.5) * 50
          )
        );
      }
      // ambient crystalline clusters scattered across the whole field
      if (ambient && crystals.length < MAX_CRYSTALS && frame % 7 === 0) {
        const ax = Math.random() * canvas.width;
        const ay = Math.random() * canvas.height;
        const k = 4 + Math.floor(Math.random() * 4);
        for (let j = 0; j < k && crystals.length < MAX_CRYSTALS; j++) {
          crystals.push(
            new Crystal(ax + (Math.random() - 0.5) * 42, ay + (Math.random() - 0.5) * 42)
          );
        }
      }

      if (glow) {
        ctx.shadowBlur = glow;
        ctx.shadowColor = crystalColor;
      }
      for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i];
        c.update();
        if (c.life <= 0) {
          crystals.splice(i, 1);
          continue;
        }
        c.draw(ctx, crystalColor);
      }
      if (glow) ctx.shadowColor = shatterColor;
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.update();
        if (s.life <= 0) {
          shards.splice(i, 1);
          continue;
        }
        s.draw(ctx, shatterColor);
      }
      if (glow) ctx.shadowBlur = 0;

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animate);
    };

    const start = () => {
      if (!raf && running) raf = requestAnimationFrame(animate);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    if (!reduce) start();

    const onVis = () => {
      running = !document.hidden;
      running ? start() : stop();
    };
    document.addEventListener("visibilitychange", onVis);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([e]) => {
          running = e.isIntersecting && !document.hidden && !reduce;
          running ? start() : stop();
        },
        { threshold: 0 }
      );
      io.observe(container);
    }

    return () => {
      stop();
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      target.removeEventListener("pointermove", point as EventListener);
      target.removeEventListener("pointerdown", shatter as EventListener);
    };
  }, [crystalColor, shatterColor, background, trailColor, overlay, transparent, ambient, glow]);

  if (overlay) {
    return (
      <div
        ref={containerRef}
        className={className}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
          background: useScreen ? "transparent" : background,
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            width: "100%",
            height: "100%",
            mixBlendMode: useScreen ? "screen" : "normal",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        height: "100svh",
        width: "100%",
        overflow: "hidden",
        background,
        fontFamily: "var(--sans, system-ui, sans-serif)",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          textAlign: "center",
          padding: "1rem",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--serif, Georgia, serif)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            lineHeight: 1,
            fontSize: "clamp(2.8rem, 1rem + 9vw, 8rem)",
            color: "var(--parch, #f3ead8)",
            textShadow: "0 0 18px rgba(200,164,92,.55), 0 0 42px rgba(200,164,92,.3)",
          }}
        >
          {title}
        </h1>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--serif, Georgia, serif)",
            fontStyle: "italic",
            fontWeight: 300,
            lineHeight: 1.2,
            fontSize: "clamp(1.1rem, .8rem + 1.4vw, 1.9rem)",
            color: "var(--gold-soft, #dcc48a)",
            textShadow: "0 0 12px rgba(200,164,92,.4)",
          }}
        >
          {subtitle}
        </h2>
        <p
          style={{
            margin: "1.4rem 0 0",
            fontFamily: "var(--mono, ui-monospace, monospace)",
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            lineHeight: 1,
            fontSize: "clamp(.7rem, .6rem + .3vw, .9rem)",
            color: "rgba(243,234,216,.55)",
          }}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}
