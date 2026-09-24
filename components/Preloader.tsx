"use client";

/* ============================================================================
   Preloader — the boot veil, as the first beat of the hero.

   A dusk-plum screen. A single thread of rose light draws the hero's curved
   horizon from the centre outward (its length is the loading progress: it
   runs to 70% at once and finishes when the fonts and the hero prints are
   ready), a dawn glow blooms at its apex, and then the veil splits open along
   that exact curve — the top half lifts away, the bottom half drops — onto
   the hero, whose own intro (the prints coming up, "Introducing" rising from
   behind the horizon) starts the moment the split does. The curve is the one
   the hero engine publishes on #hero (--hz-apex / --hz-r, lib/horizonHero.ts),
   so the seam lands on the hero's horizon.

   Contract with the rest of the page (unchanged from the previous loader):
   · app/layout.tsx's inline script puts html.plx-lock (scroll locked, veil
     shown) or html.plx-seen (veil hidden) on the root before first paint;
   · runs on every page load; skipped only under prefers-reduced-motion and
     without JavaScript;
   · "plx:done" is dispatched when the page is released — here, as the split
     starts (the veil is position:fixed and never affects layout).
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/* never on screen for less than this (from navigation start) */
const MIN_VISIBLE_MS = 1100;
/* stop waiting for fonts / the hero prints after this */
const READY_CAP_MS = 2500;
const NIGHT = "#1a1020";

type Geom = { W: number; H: number; cx: number; cy: number; r: number; apex: number; yL: number; yR: number; L: number };

/** the hero's horizon circle (published by the hero engine), or a close
    estimate from the same formula until the engine has measured */
function geometry(): Geom {
  const W = window.innerWidth;
  const H = window.innerHeight;
  let apex = 0.56 * H;
  let r = 8091.52 * Math.max(W / 2560, H / 1440);
  if (W < 1000) r = Math.min(r, W * (4.4 + 0.8 * Math.min(1, Math.max(0, (W - 390) / 610))));
  const hero = document.getElementById("hero");
  if (hero) {
    const cs = getComputedStyle(hero);
    const a = parseFloat(cs.getPropertyValue("--hz-apex"));
    const rr = parseFloat(cs.getPropertyValue("--hz-r"));
    if (a > 0 && rr > 0) {
      apex = a;
      r = rr;
    }
  }
  const cx = W / 2;
  const cy = apex + r;
  const edgeY = (x: number) => cy - Math.sqrt(Math.max(r * r - (x - cx) * (x - cx), 0));
  const L = 2 * r * Math.asin(Math.min(1, W / 2 / r));
  return { W, H, cx, cy, r, apex, yL: edgeY(0), yR: edgeY(W), L };
}

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  /* set on the skip path (reduced motion) — the release then fires
     from the commit after this, once every other mount effect has run */
  const skipped = useRef(false);

  useEffect(() => {
    if (gone && skipped.current) window.dispatchEvent(new Event("plx:done"));
  }, [gone]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.documentElement.classList.remove("plx-lock");
      skipped.current = true;
      setGone(true);
      return;
    }
    document.documentElement.classList.add("plx-lock");

    const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const svgs = Array.from(root.querySelectorAll<SVGSVGElement>("svg"));
    const top = $<SVGPathElement>(".pl-top path");
    const bot = $<SVGPathElement>(".pl-bot path");
    const line = $<SVGPathElement>(".pl-line");
    const glow = $<SVGPathElement>(".pl-glow");
    const bloom = $<SVGEllipseElement>(".pl-bloom");

    const state = { k: 0, flare: 0 };
    let g = geometry();
    /* the hero publishes its horizon on its first frame (~the first second);
       the thread follows it from then on, so the curve never jumps */
    const heroEl = document.getElementById("hero");
    let seenApex = "";

    /* lay the halves, the thread and the bloom on the current curve */
    const layout = () => {
      g = geometry();
      const { W, H, cx, r, apex, yL, yR } = g;
      for (const s of svgs) s.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const arcRL = (dy: number) => `V${(yR + dy).toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 0 ${(yL + dy).toFixed(1)}`;
      // the top half reaches 1px past the curve so the halves never show a seam
      top.setAttribute("d", `M0 0H${W}${arcRL(1)}Z`);
      bot.setAttribute("d", `M0 ${H}H${W}${arcRL(0)}Z`);
      const thread = `M0 ${yL.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${W} ${yR.toFixed(1)}`;
      line.setAttribute("d", thread);
      glow.setAttribute("d", thread);
      bloom.setAttribute("cx", cx.toFixed(1));
      bloom.setAttribute("cy", apex.toFixed(1));
      bloom.setAttribute("rx", (W * 0.42).toFixed(1));
      bloom.setAttribute("ry", (H * 0.2).toFixed(1));
      seenApex = heroEl?.style.getPropertyValue("--hz-apex") ?? "";
      paint();
    };
    /* the thread grows symmetrically out of the apex: dash [0, gap, len, rest] */
    const paint = () => {
      const apexNow = heroEl?.style.getPropertyValue("--hz-apex") ?? "";
      if (apexNow !== seenApex) {
        seenApex = apexNow;
        layout();
        return;
      }
      const len = g.L * state.k;
      const gap = (g.L - len) / 2;
      const dash = `0 ${gap.toFixed(1)} ${len.toFixed(1)} ${g.L.toFixed(1)}`;
      line.setAttribute("stroke-dasharray", dash);
      glow.setAttribute("stroke-dasharray", dash);
      glow.setAttribute("opacity", (0.35 + 0.65 * state.flare).toFixed(3));
      bloom.setAttribute("opacity", (0.25 * state.k + 0.75 * state.flare).toFixed(3));
    };

    layout();
    root.classList.add("is-drawn"); // the SVG halves now carry the black veil
    window.addEventListener("resize", layout);

    /* ---- readiness: fonts + the hero prints, capped; plus a floor ---- */
    let ready = false;
    let started = false;
    let tl: gsap.core.Timeline | null = null;
    const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    const prints = Array.from(document.querySelectorAll<HTMLImageElement>("#hero img[data-hz-print]"));
    const imgsReady = Promise.all(
      prints.map((img) => (typeof img.decode === "function" ? img.decode().catch(() => {}) : Promise.resolve()))
    );
    const assets = Promise.race([Promise.all([fontsReady, imgsReady]), new Promise((r) => setTimeout(r, READY_CAP_MS))]);
    const floor = new Promise((r) => setTimeout(r, Math.max(0, MIN_VISIBLE_MS - performance.now())));
    let disposed = false;
    Promise.all([assets, floor]).then(() => {
      if (disposed) return;
      ready = true;
      if (started && tl && tl.paused()) tl.play();
    });

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      document.documentElement.classList.remove("plx-lock");
      window.dispatchEvent(new Event("plx:done"));
    };

    const ctx = gsap.context(() => {
      tl = gsap.timeline({ paused: true });
      // the thread: 70% at once, then hold for the assets
      tl.to(state, { k: 0.7, duration: 0.8, ease: "power2.out", onUpdate: paint });
      tl.add("hold");
      tl.call(() => {
        if (!ready && tl) tl.pause("hold");
      }, undefined, "hold");
      // finish the thread and let the dawn flare
      tl.to(state, { k: 1, duration: 0.5, ease: "power2.inOut", onUpdate: paint });
      tl.to(state, { flare: 1, duration: 0.45, ease: "power2.out", onUpdate: paint }, "<0.2");
      // re-read the curve: by now the hero engine has measured and published it
      tl.call(layout);
      // split along the horizon onto the hero; its intro starts with the split
      tl.add("split", "+=0.08");
      tl.call(release, undefined, "split");
      tl.to(".pl-top", { yPercent: -100, duration: 1.05, ease: "power3.inOut" }, "split");
      tl.to(".pl-bot", { yPercent: 100, duration: 1.05, ease: "power3.inOut" }, "split");
      tl.to(".pl-light", { opacity: 0, duration: 0.5, ease: "power1.out" }, "split");
      tl.call(() => setGone(true));
    }, root);

    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        started = true;
        tl?.play();
      });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      ctx.revert();
      document.documentElement.classList.remove("plx-lock");
    };
  }, []);

  if (gone) return null;

  return (
    <div className="pl-root" ref={rootRef} role="status" aria-label="Loading">
      <div className="pl-half pl-top" aria-hidden="true">
        <svg preserveAspectRatio="none">
          <path fill={NIGHT} />
        </svg>
      </div>
      <div className="pl-half pl-bot" aria-hidden="true">
        <svg preserveAspectRatio="none">
          <path fill={NIGHT} />
        </svg>
      </div>
      <div className="pl-light" aria-hidden="true">
        <svg preserveAspectRatio="none">
          <defs>
            <radialGradient id="pl-bloom-g">
              <stop offset="0" stopColor="#ffd6e0" stopOpacity="0.55" />
              <stop offset="0.35" stopColor="#efa2b6" stopOpacity="0.22" />
              <stop offset="1" stopColor="#a63e5c" stopOpacity="0" />
            </radialGradient>
            <filter id="pl-soft" x="-10%" y="-400%" width="120%" height="900%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <ellipse className="pl-bloom" fill="url(#pl-bloom-g)" opacity="0" />
          <path className="pl-glow" fill="none" stroke="#efa2b6" strokeWidth="9" strokeLinecap="round" filter="url(#pl-soft)" />
          <path className="pl-line" fill="none" stroke="#ffe6ee" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <style>{css}</style>
    </div>
  );
}

const css = /* css */ `
/* scroll lock while the veil holds the page — set on <html> by the inline
   script in app/layout.tsx before first paint, removed as the veil splits.
   overflow:hidden on html alone does not stop iOS touch scrolling, hence the
   touch-action / overscroll guards. */
html.plx-lock,
html.plx-lock body {
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

/* repeat visit in this tab, reduced motion, or no JavaScript: the veil never
   paints at all */
html.plx-seen .pl-root,
html.no-js .pl-root {
  display: none;
}

.pl-root {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  /* solid until the halves are laid out (first client frame) */
  background: ${NIGHT};
}
.pl-root.is-drawn {
  background: none;
}
.pl-half,
.pl-light {
  position: absolute;
  inset: 0;
}
.pl-half {
  will-change: transform;
}
.pl-half svg,
.pl-light svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.pl-light {
  will-change: opacity;
}
`;
