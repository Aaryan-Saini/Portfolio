"use client";

/* ============================================================================
   PreloaderEditorial — reference-faithful boot overlay (prefix plx-).
   Fixed veil: the wine base is carried by six full-height stair columns
   (accent bottom lip), under a blurred vertical gradient + tiled paper
   noise (multiply). Center column = italic serif tagline (per-char blur
   reveal) + 3px progress track with 2px gold fill stepping 10 → 72 → 100
   + mono counter synced to the same timeline. On completion the veil
   content fades, then the STAIRS EXIT plays: columns sweep upward with a
   left→right stagger — a staircase climbing from bottom-left to top-right —
   while the hero settles up into place beneath. Unmounts + "plx:done".

   Timing: the same choreography at roughly half its former length, and
   readiness-driven instead of a fixed clock — the bar eases to 72 and holds
   there only while the web fonts and the hero portrait are still arriving
   (capped at 2.5 s), then finishes. "plx:done" is dispatched after React
   has removed the veil, so listeners measure a clean layout.

   Runs once per tab session (sessionStorage "plx_seen"); skipped entirely
   under prefers-reduced-motion. The inline script in app/layout.tsx puts
   html.plx-lock (scroll lock) or html.plx-seen (veil hidden) on the root
   before first paint, so a repeat visit never flashes the frozen veil and a
   first visit is locked from the very first frame.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useCharReveal } from "@/components/ui/editorial";

const SEEN_KEY = "plx_seen";
const STAIRS = 6;
/* never on screen for less than this (from navigation start) */
const MIN_VISIBLE_MS = 900;
/* stop waiting for fonts / the hero image after this */
const READY_CAP_MS = 2500;

export default function PreloaderEditorial() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  /* tagline — per-character blur reveal; start "top 120%" fires immediately.
     Eager: this one is visible from the first frame, so it must not wait for
     the deferred trigger the section headings use. */
  useCharReveal(rootRef, ".plx-line", {
    delay: 0.1,
    stagger: 0.012,
    duration: 0.4,
    start: "top 120%",
    eager: true,
  });

  /* "plx:done" fires from here — after the commit that removed the veil from
     the DOM — so siteEffects' ScrollTrigger.refresh and the hero band read a
     layout with no fixed overlay in it. */
  useEffect(() => {
    if (gone) window.dispatchEvent(new Event("plx:done"));
  }, [gone]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /* skip entirely: reduced motion, or already seen this tab session */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* storage unavailable → treat as unseen */
    }
    if (reduce || seen) {
      setGone(true);
      return;
    }

    /* idempotent — the inline script normally set it before first paint */
    document.documentElement.classList.add("plx-lock");

    const fill = fillRef.current;
    const count = countRef.current;
    const proxy = { v: 10 };
    let lastCount = -1;
    const paint = () => {
      /* fill is transform-only (no layout); the counter snaps to integers and
         is written only when the integer changes */
      if (fill) fill.style.transform = `scaleX(${proxy.v / 100})`;
      const r = Math.round(proxy.v);
      if (count && r !== lastCount) {
        lastCount = r;
        count.textContent = String(r);
      }
    };

    /* ---- readiness: fonts + the hero portrait, capped; plus a floor on the
       total time the veil is on screen (measured from navigation) ---- */
    let ready = false;
    let started = false;
    let tl: ReturnType<typeof gsap.timeline> | null = null;
    const fontsReady: Promise<unknown> =
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const heroImg = document.querySelector<HTMLImageElement>("#hero .hero-person-img");
    const imgReady: Promise<unknown> =
      heroImg && typeof heroImg.decode === "function"
        ? heroImg.decode().catch(() => {})
        : Promise.resolve();
    const assets = Promise.race([
      Promise.all([fontsReady, imgReady]),
      new Promise((r) => setTimeout(r, READY_CAP_MS)),
    ]);
    const floor = new Promise((r) =>
      setTimeout(r, Math.max(0, MIN_VISIBLE_MS - performance.now()))
    );
    let disposed = false;
    Promise.all([assets, floor]).then(() => {
      if (disposed) return;
      ready = true;
      if (started && tl && tl.paused()) tl.play();
    });

    const finish = () => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      document.documentElement.classList.remove("plx-lock");
      setGone(true);
    };

    const ctx = gsap.context(() => {
      tl = gsap.timeline({ paused: true, onUpdate: paint });
      paint();

      /* reference variant steps: 10% instantly → 72% → (hold until ready) → 100% */
      tl.to(proxy, { v: 72, duration: 0.55, ease: "power2.out" });
      tl.add("hold");
      tl.call(
        () => {
          if (!ready && tl) tl.pause("hold");
        },
        undefined,
        "hold"
      );
      tl.to(proxy, { v: 100, duration: 0.35, ease: "power1.inOut" });

      /* ---- STAIRS EXIT ----------------------------------------------
         1. veil content (tagline, counter, gradient, noise) fades away,
            leaving only the flat stair columns;
         2. the columns sweep up staggered left→right — the reveal climbs
            from bottom-left to top-right like a staircase;
         3. the hero settles up into place under the rising columns.
         The finish (session flag, unlock, unmount) fires the instant the
         last column clears — the same instant the hero lands. */
      tl.to(
        [".plx-center", ".plx-grad", ".plx-noise"],
        { autoAlpha: 0, duration: 0.2, ease: "power1.out" },
        "+=0.2"
      );
      tl.to(
        ".plx-stair",
        {
          yPercent: -100,
          duration: 0.55,
          ease: "power3.inOut",
          stagger: 0.06,
          onComplete: finish,
        },
        "-=0.05"
      );
      const hero = document.getElementById("hero");
      if (hero) {
        tl.fromTo(
          hero,
          { y: 72 },
          {
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            clearProps: "transform",
          },
          "<0.15"
        );
      }
    }, root);

    /* start on a frame boundary, so a long effects flush behind the veil can
       never swallow the intro */
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        started = true;
        tl?.play();
      });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ctx.revert();
      document.documentElement.classList.remove("plx-lock");
    };
  }, []);

  if (gone) return null;

  return (
    <div className="plx-root" ref={rootRef} role="status" aria-label="Loading">
      {/* the stair columns ARE the opaque base — they sweep up on exit.
          ±1px overlaps kill sub-pixel seams between columns */}
      <div className="plx-stairs" aria-hidden="true">
        {Array.from({ length: STAIRS }, (_, i) => (
          <span
            key={i}
            className="plx-stair"
            style={{
              left: `calc(${(i * 100) / STAIRS}% - 1px)`,
              width: `calc(${100 / STAIRS}% + 2px)`,
            }}
          />
        ))}
      </div>
      {/* soft-blurred vertical gradient over the stair base */}
      <div className="plx-grad" aria-hidden="true" />
      {/* tiled paper noise, multiplied */}
      <div className="plx-noise" aria-hidden="true" />

      <div className="plx-center">
        <p className="plx-line">Written in logic, built with care.</p>
        <span className="plx-track" aria-hidden="true">
          <span className="plx-fill" ref={fillRef} />
        </span>
        <span className="plx-count" ref={countRef} aria-hidden="true">
          10
        </span>
      </div>

      <style>{css}</style>
    </div>
  );
}

const css = /* css */ `
/* scroll lock while the preloader is active — set on <html> by the inline
   script in app/layout.tsx before first paint, removed when the stairs clear.
   overflow:hidden on html alone does not stop iOS touch scrolling, hence the
   touch-action / overscroll guards. */
html.plx-lock,
html.plx-lock body {
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

/* repeat visit in this tab (or reduced motion): the same inline script marks
   the run as seen, so the server-rendered veil never paints at all */
html.plx-seen .plx-root {
  display: none;
}

.plx-root {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  display: grid;
  place-items: center;
  transform-origin: 50% 50%;
}

/* ------------------------------------------------ stair curtain columns */
.plx-stairs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}
.plx-stair {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--wine-900);
  border-bottom: 2px solid var(--gold);
  will-change: transform;
}

/* gradient layer only carries the blur(12px) — content stays crisp */
.plx-grad {
  position: absolute;
  inset: -40px;
  background: linear-gradient(var(--wine-800) 0%, rgba(16, 17, 44, 0) 100%);
  filter: blur(12px);
  z-index: 1;
}

.plx-noise {
  position: absolute;
  inset: 0;
  background-image: var(--paper-noise);
  background-size: 800px 800px;
  mix-blend-mode: multiply;
  filter: blur(0);
  z-index: 2;
}

/* ------------------------------------------------------- center column */
.plx-center {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
  padding: 0 1.5rem;
  text-align: center;
}

.plx-line {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(1.4rem, 3.2vw, 2.2rem);
  line-height: 1.25;
  color: var(--parch);
  margin: 0;
}

.plx-track {
  position: relative;
  display: block;
  width: min(320px, 60vw);
  height: 3px;
  background: rgba(135, 206, 235, 0.14);
}

/* the 2px fill is centred in the 3px track by auto margins, which frees the
   transform for a layout-free scaleX progress (no width animation) */
.plx-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  margin: auto 0;
  height: 2px;
  width: 100%;
  background: var(--gold);
  transform-origin: 0 50%;
  transform: scaleX(0.1);
  will-change: transform;
}

.plx-count {
  font-family: var(--mono);
  font-size: 16px;
  letter-spacing: -0.02em;
  color: var(--gold);
  line-height: 1;
}
`;
