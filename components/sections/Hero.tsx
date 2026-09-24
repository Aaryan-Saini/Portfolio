"use client";

/* ============================================================================
   Hero — the "horizon" opener.

   A pinned stage over 385lvh of runway: a code-drawn dawn horizon between two
   torn-paper photo prints; at rest it fills the whole screen. On load the
   prints come up and "Hello, I'm" rises from behind the limb;
   scrolling retracts the prints to thin torn strips, lifts the intro away and
   raises the name along the curved horizon (centred on screen), then the role fades
   in. Next the name gives way to a short introduction ("Nice to meet you."),
   and then torn plum paper rises in from below the screen, over the hero; as the pin lets go the scroll carries it on up and
   FeaturedProjects' paper follows — the same paper, one surface.
   Every step is scrubbed by scroll, so scrolling back up plays it in reverse.

   The markup here is the static skeleton (and the no-JS / no-WebGL fallback);
   lib/horizonHero.ts owns the canvas, the geometry and the timeline.
   ========================================================================== */

import { Fragment, useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { mountHorizonHero, type HorizonConfig } from "@/lib/horizonHero";
import { LaurelBranch, TornEdge } from "@/components/ui/editorial";
import TornPaperEdge from "@/components/ui/TornPaperEdge";
import "./hero.css";

/* The two prints — the compass and the mountain range, graded into the site's
   dusk palette (originals: /nav/05-experience.webp, /honours-bg.webp).
   `horizon` is the image row laid on the horizon line,
   `focusX` the column kept centred in the print's band. */
const PRINTS = {
  left: { src: "/hero-left-dusk.webp", w: 640, h: 880, horizon: 0.5, focusX: 0.5, zoom: 1.12, saturation: 0.92 },
  right: { src: "/hero-right-dusk.webp", w: 1920, h: 1280, horizon: 0.56, focusX: 0.62, zoom: 1.12, saturation: 1 },
} satisfies Record<"left" | "right", HorizonConfig["prints"]["left"] & { src: string }>;

/* the rising paper is the same --night ground (#1a1020, dusk plum) every
   section after the hero sits on, so the hand-off is seamless */
const PAPER_RGB: [number, number, number] = [0.102, 0.063, 0.125];

/* the short introduction (formerly the About section below the hero) */
/* one line about me, filled word by word as you scroll (lib/horizonHero.ts);
   `a` marks the words set in rose italic. Every fact is already published
   elsewhere on the site (the dossier, the résumé, public/llms.txt). */
const ABOUT: { w: string; a?: true }[] = [
  { w: "QA" }, { w: "engineer" }, { w: "at" }, { w: "Kayease,", a: true },
  { w: "testing" }, { w: "real" }, { w: "products" }, { w: "on" }, { w: "web" }, { w: "and" }, { w: "Android." },
  { w: "I" }, { w: "also" }, { w: "build" }, { w: "my" }, { w: "own" }, { w: "Chrome" }, { w: "extensions." },
  /* the way on: the projects are the very next section */
  { w: "Scroll", a: true }, { w: "on", a: true }, { w: "to", a: true }, { w: "see", a: true }, { w: "them.", a: true },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  /* the WebGL tear hands us a "redraw" once it is drawing; the engine calls it
     whenever it moves the paper, so the tear tracks every frame of the rise */
  const tearRedraw = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let destroy: (() => void) | undefined;
    try {
      destroy = mountHorizonHero(el, { prints: PRINTS, onPaperMove: () => tearRedraw.current?.() });
    } catch {
      el.setAttribute("data-hz-failed", "");
    }
    return () => {
      destroy?.();
      el.removeAttribute("data-hz-failed");
    };
  }, []);

  return (
    <section id="hero" ref={ref} className="hz-hero" aria-labelledby="hz-title">
      <div className="hz-stage">
        <h1 id="hz-title" className="hz-heading" tabIndex={-1}>
          Aaryan Kumar Saini
          <span className="hz-heading-role"> — QA Engineer &amp; Developer</span>
        </h1>

        {/* no-WebGL / no-JS stand-in; in WebGL mode it stays hidden and its
            images double as the texture sources */}
        <div className="hz-fallback" aria-hidden="true">
          <div className="hz-fb-sky" />
          <div className="hz-fb-band hz-fb-left">
            <img
              data-hz-print="left"
              src={asset(PRINTS.left.src)}
              alt=""
              width={PRINTS.left.w}
              height={PRINTS.left.h}
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <div className="hz-fb-band hz-fb-right">
            <img
              data-hz-print="right"
              src={asset(PRINTS.right.src)}
              alt=""
              width={PRINTS.right.w}
              height={PRINTS.right.h}
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>

        {/* the canvas is inserted here by the engine */}
        <svg className="hz-ov" aria-hidden="true" focusable="false">
          <defs>
            {/* ink-press texture: roughened edge, soft bleed, speckled holes */}
            <filter id="hz-ink" x="-4%" y="-15%" width="108%" height="130%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={0.7} xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feGaussianBlur in="rough" stdDeviation={0.6} result="soft" />
              <feComponentTransfer in="soft" result="ink">
                <feFuncA type="linear" slope="1.15" intercept="0" />
              </feComponentTransfer>
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={12} result="s" />
              <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -8 0 0 0 6.6" result="holes" />
              <feComposite in="ink" in2="holes" operator="in" />
            </filter>
            <filter id="hz-ink-soft" x="-4%" y="-15%" width="108%" height="130%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={0.4} xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feGaussianBlur in="rough" stdDeviation={0.35} result="soft" />
              <feComponentTransfer in="soft" result="ink">
                <feFuncA type="linear" slope="1.15" intercept="0" />
              </feComponentTransfer>
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={12} result="s" />
              <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -8 0 0 0 7.2" result="holes" />
              <feComposite in="ink" in2="holes" operator="in" />
            </filter>

            {/* hides whatever sits below the limb ("Hello, I'm" rising) */}
            <radialGradient id="hz-sky-grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.98" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.99" stopColor="#fff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </radialGradient>
            <mask id="hz-sky" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="12000" height="12000">
              <rect x="-4000" y="-4000" width="12000" height="12000" fill="url(#hz-sky-grad)" />
            </mask>

            {/* the name's rise mask — lifts with it out of the horizon */}
            <radialGradient id="hz-rise-grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.35" stopColor="#fff" stopOpacity="0.18" />
              <stop offset="0.7" stopColor="#fff" stopOpacity="0.62" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </radialGradient>
            <mask id="hz-rise-mask" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="12000" height="12000">
              <rect x="-4000" y="-4000" width="12000" height="12000" fill="url(#hz-rise-grad)" />
            </mask>

            {/* left→right ink sweep, one per title line */}
            {[0, 1].map((i) => (
              <g key={i}>
                <linearGradient id={`hz-sweep${i}g`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="0" stopColor="#000" />
                  <stop offset="1" stopColor="#000" />
                </linearGradient>
                <mask id={`hz-sweep${i}`} maskUnits="userSpaceOnUse" x="-10000" y="-10000" width="20000" height="20000">
                  <rect x="-10000" y="-10000" width="20000" height="20000" fill={`url(#hz-sweep${i}g)`} />
                </mask>
              </g>
            ))}

            {/* the name only ever sits on the middle print */}
            <clipPath id="hz-mid-clip" clipPathUnits="userSpaceOnUse">
              <path id="hz-mid-clip-path" d="M0 -4000H100000V8000H0Z" />
            </clipPath>

            <path id="hz-intro-arc" fill="none" />
            <path id="hz-name-arc" fill="none" />
            <path id="hz-name-arc2" fill="none" />
          </defs>

          <g className="hz-words" mask="url(#hz-sky)">
            <text id="hz-intro" textAnchor="middle" fontSize="40" opacity="0">
              <textPath href="#hz-intro-arc" startOffset="50%">
                Hello, I&rsquo;m
              </textPath>
            </text>
          </g>

          <g className="hz-title" clipPath="url(#hz-mid-clip)" mask="url(#hz-rise-mask)">
            <g className="hz-rise">
              <text id="hz-t1" textAnchor="middle" fontSize="100" opacity="0">
                <textPath href="#hz-name-arc" startOffset="50%">
                  <tspan className="first stg">Aaryan</tspan>
                  <tspan className="rest">{" Kumar Saini"}</tspan>
                </textPath>
              </text>
            </g>
            <g className="hz-rise">
              <text id="hz-t2" textAnchor="middle" fontSize="100" opacity="0">
                <textPath href="#hz-name-arc2" startOffset="50%">
                  <tspan className="rest stg">Kumar Saini</tspan>
                </textPath>
              </text>
            </g>
          </g>
        </svg>

        <div className="hz-landing">
          <p className="hz-eyebrow">QA Engineer &amp; Developer</p>
        </div>

        {/* the short introduction — crossfades in where the name stood */}
        <div className="hz-credo">
          <div className="hz-credo-top">
            <h2 className="hz-credo-head">
              <LaurelBranch />
              <span>
                Nice to <em>Meet You.</em>
              </span>
              <LaurelBranch flip />
            </h2>
            <p className="hz-quote">
              I catch the bugs your users <em>never see.</em>
            </p>
          </div>
          <div className="hz-credo-body">
            <p className="hz-about">
              {ABOUT.map((t, i) => (
                <Fragment key={i}>
                  {i > 0 ? " " : null}
                  <span className={t.a ? "hz-w hz-w--a" : "hz-w"}>{t.w}</span>
                </Fragment>
              ))}
            </p>
          </div>
        </div>

        {/* the torn paper: plum paper under a ragged edge, with the hero itself
            showing above the edge. It waits below the stage; the engine raises
            it over the hero after the introduction, then the released scroll
            carries it into the next section. */}
        <div className="hz-paper" aria-hidden="true">
          <TornPaperEdge
            className="hz-paper-tear"
            paperSide="bottom"
            paper={PAPER_RGB}
            transition={PAPER_RGB}
            redrawRef={tearRedraw}
            onReady={() => ref.current?.classList.add("has-gl-tear")}
          />
          <div className="hz-paper-sheet">
            <TornEdge side="top" color="var(--night)" seed={7} className="hz-paper-fallback" />
          </div>
        </div>

        <button type="button" className="hz-cue" data-cursor="link">
          Scroll down
        </button>
      </div>

      {/* "About" (menu) lands here: the introduction, shown */}
      <span id="about" className="hz-anchor" aria-hidden="true" />
    </section>
  );
}
