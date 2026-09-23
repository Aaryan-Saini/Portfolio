"use client";

/* ============================================================================
   WorksMarquee — "Sneak peek of my craft".
   A centred script headline flanked by register-mark crosshairs, a cyan
   ornament, then an endless drift of tilted specimen cards — the eleven
   technical skills as QA plates on white polaroid mounts, with two
   typographic tally cards shuffled in — and a mono ticker underneath
   carrying the techniques. The paper's tail is torn downward into the dark
   Method ledger that follows.
   ========================================================================== */

import type { CSSProperties } from "react";
import { Ticker, Ornament, Crosshair, LaurelBranch } from "@/components/ui/editorial";
import { asset } from "@/lib/asset";

/* ------------------------------------------------------------------- data */
type SampleCard =
  | { kind: "img"; src: string; caption: string }
  | { kind: "stat"; big: string; label: string };

/* The eleven technical-skill plates, with the two typographic tally cards
   shuffled in. Card captions carry the discipline and its primary tool; the
   granular techniques under each (functional, regression, smoke …) run in the
   mono ticker below the marquee so the plates stay legible at a glance. */
const CARDS: SampleCard[] = [
  { kind: "img", src: "/qa/manual_icon_1782324133358.webp", caption: "MANUAL TESTING" },
  { kind: "img", src: "/qa/playwright_icon_1782324082658.webp", caption: "AUTOMATION · PLAYWRIGHT" },
  { kind: "stat", big: "500+", label: "TEST CASES WRITTEN" },
  { kind: "img", src: "/qa/api_icon_1782324036794.webp", caption: "API TESTING · POSTMAN" },
  { kind: "img", src: "/qa/skill_testdocs.webp", caption: "TEST DOCUMENTATION" },
  { kind: "img", src: "/qa/skill_jira.webp", caption: "BUG TRACKING · JIRA" },
  { kind: "img", src: "/qa/k6_icon_1782324113070.webp", caption: "PERFORMANCE · k6" },
  { kind: "img", src: "/qa/skill_webmobile.webp", caption: "WEB & MOBILE TESTING" },
  { kind: "img", src: "/qa/skill_database.webp", caption: "DATABASE TESTING · SQL" },
  { kind: "img", src: "/qa/skill_programming.webp", caption: "PROGRAMMING · JS / SQL" },
  { kind: "img", src: "/qa/skill_versioncontrol.webp", caption: "VERSION CONTROL · GIT" },
  { kind: "img", src: "/qa/cicd_icon_1782324059923.webp", caption: "CI/CD · ACTIONS / JENKINS" },
];

const TICKER_ITEMS = [
  "FUNCTIONAL",
  "REGRESSION",
  "SMOKE",
  "SANITY",
  "INTEGRATION",
  "SYSTEM",
  "END-TO-END",
  "EXPLORATORY",
  "TEST PLANS & SCENARIOS",
  "RESPONSIVE & CROSS-BROWSER",
  "LOAD & STRESS",
  "DATA VALIDATION & CRUD",
];

/* one run of the eight cards — rendered twice for the -50% loop */
function CardRun({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="wmx-run" aria-hidden={hidden || undefined}>
      {CARDS.map((card, i) => (
        <li className="wmx-card" key={i}>
          {/* strip of tape — CSS shows it on a subset so the pile reads as
              hand-mounted rather than mechanically repeated */}
          <span className="wmx-card__tape" aria-hidden="true" />

          <div className="wmx-card__head" aria-hidden="true">
            <span className="wmx-card__idx">{String(i + 1).padStart(2, "0")}</span>
          </div>

          {card.kind === "img" ? (
            <>
              <figure className="wmx-card__art">
                <img src={asset(card.src)} alt="" loading="lazy" draggable={false} />
              </figure>
              {/* "DISCIPLINE · TOOL" is split so the tool can sit on its own
                  tier — one flat mono line read as filler */}
              <p className="wmx-card__cap">
                <span className="wmx-card__capmain">
                  {card.caption.split(" · ")[0]}
                </span>
                {card.caption.includes(" · ") && (
                  <span className="wmx-card__captool">
                    {card.caption.split(" · ")[1]}
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <div className="wmx-card__stat">
                <span className="wmx-card__ding" aria-hidden="true">
                  {"✳"}
                </span>
                <span className="wmx-card__big">{card.big}</span>
                <span className="wmx-card__statlabel">{card.label}</span>
              </div>
              <p className="wmx-card__cap" aria-hidden="true">
                {"✦"}
              </p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- component */
export default function WorksMarquee() {
  return (
    <section className="edt-paper edt-section wmx-root">
      {/* the torn boundary into the dark Method section below is drawn by
          MethodStack (TornPaperEdge, a scroll-driven WebGL tear) */}

      <div className="edt-rules wmx-rules" aria-hidden="true" />

      <div className="edt-inner wmx-inner">
        {/* ---------------------------------------------- centred heading */}
        <header className="wmx-head">
          <Crosshair className="wmx-xh wmx-xh--l" />
          <Crosshair className="wmx-xh wmx-xh--r" />

          {/* laurel-flanked like every other section title (Crest's row) */}
          <div className="crest__row wmx-title-row">
            <LaurelBranch />
            <h2 className="wmx-title">
              <span className="wmx-title__script" data-rvl="up">
                Sneak <em>Peek</em>
              </span>
              <span
                className="wmx-title__serif"
                data-rvl="up"
                style={{ "--rvl-delay": "0.12s" } as CSSProperties}
              >
                Of My Craft
              </span>
            </h2>
            <LaurelBranch flip />
          </div>

          <div
            className="wmx-ornwrap"
            data-rvl="fade"
            style={{ "--rvl-delay": "0.26s" } as CSSProperties}
          >
            <Ornament className="wmx-orn" />
          </div>
        </header>
      </div>

      {/* --------------------------------------------- the tilted marquee */}
      {/* data-lenis-prevent-horizontal: Lenis drives page scroll with
          syncTouch on, and would otherwise swallow a sideways swipe here. The
          attribute makes it bail on horizontal gestures only, so the browser
          scrolls this row natively while a vertical swipe on the same element
          still scrolls the page. */}
      <div
        className="wmx-viewport"
        data-lenis-prevent-horizontal=""
        data-rvl="fade"
        style={{ "--rvl-delay": "0.2s" } as CSSProperties}
      >
        <div className="wmx-track">
          <CardRun />
          <CardRun hidden />
        </div>
      </div>

      {/* phones only: the row is a swipe scroller there, and a peeking card
          is the only other cue that more exists to the right */}
      <p className="wmx-swipehint" aria-hidden="true">
        swipe to browse the samples {"→"}
      </p>

      {/* --------------------------------------------------- mono ticker */}
      <div className="wmx-tickerband" data-rvl="fade">
        <Ticker items={TICKER_ITEMS} separator={"✦"} speed={26} />
      </div>

      <style>{css}</style>
    </section>
  );
}

/* --------------------------------------------------------------------- css */
const css = /* css */ `
.wmx-root {
  /* no overflow hidden here — the torn edge must poke below the section */
  /* the torn strip that opens MethodStack already carries ~200px of paper
     above its tear line, so this only needs a short breath under the ticker —
     a tall pad here reads as a blank hole between the two sections */
  padding-bottom: clamp(1.6rem, 3.2vw, 3rem);
}
.wmx-inner {
  width: 100%;
}
/* the column hairlines would stop dead where the tear strip begins (it paints
   above them) — fade them out over the last stretch of paper instead */
.wmx-rules {
  -webkit-mask-image: linear-gradient(#000 calc(100% - 320px), transparent 100%);
  mask-image: linear-gradient(#000 calc(100% - 320px), transparent 100%);
}

/* ---------------------------------------------------------------- heading */
.wmx-head {
  position: relative;
  text-align: center;
  padding: 0 clamp(1.4rem, 4vw, 3rem);
}
.wmx-xh {
  top: 42%;
}
.wmx-xh--l {
  left: 0;
}
.wmx-xh--r {
  right: 0;
}
.wmx-title {
  color: var(--ink);
  line-height: 1;
}
/* the laurels in the paper-side cyan, as on the Featured Projects crest */
.wmx-title-row .crest__laurel {
  color: var(--gold-deep);
  opacity: 1;
}
/* same cut as the Featured Projects crest: serif headline, italic second
   word, oversized script drop-cap on the opening letter */
.wmx-title__script {
  display: block;
  font-family: var(--serif);
  font-weight: 500;
  font-size: var(--fs-h2);
  line-height: var(--lh-h2);
  letter-spacing: 0.01em;
  color: var(--ink);
}
.wmx-title__script em {
  display: inline-block; /* lets ::first-letter reach the P */
  font-style: italic;
  font-weight: 400;
}
.wmx-title__script em::first-letter {
  font-family: var(--script);
  font-size: 1.55em;
  font-style: normal;
  letter-spacing: 0.06em;
  line-height: 0.8;
}
.wmx-title__script::first-letter {
  font-family: var(--script);
  font-size: 1.55em;
  font-style: normal;
  letter-spacing: 0.06em;
  line-height: 0.8;
}
.wmx-title__serif {
  display: block;
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  font-size: calc(var(--fs-h2) * 0.88);
  line-height: 1.04;
  letter-spacing: var(--tr-display);
  margin-top: -0.12em;
  color: var(--ink);
}
.wmx-ornwrap {
  display: grid;
  justify-items: center;
  margin-top: clamp(1.1rem, 2.6vw, 1.8rem);
}
.wmx-orn {
  color: var(--gold-deep);
}

/* ---------------------------------------------------------------- marquee */
.wmx-viewport {
  --wmx-w: clamp(188px, 16.7vw, 240px);
  --wmx-gap: clamp(1.4rem, 2.8vw, 2.6rem);
  position: relative;
  z-index: 1;
  overflow: hidden;
  margin-top: clamp(2.6rem, 6vw, 4.5rem);
  padding: clamp(2.4rem, 4.5vw, 3.2rem) 0;
  /* full bleed past the section padding */
  margin-inline: calc(-1 * var(--pad));
}
.wmx-track {
  display: flex;
  width: max-content;
  will-change: transform;
  /* 40s paced 8 cards; the run is 13 now, so the duration scales with it to
     keep the same on-screen drift rate */
  animation: wmx-scroll var(--wmx-speed, 65s) linear infinite;
}
.wmx-viewport:hover .wmx-track {
  animation-play-state: paused;
}
@keyframes wmx-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.wmx-run {
  display: flex;
  align-items: center;
  gap: var(--wmx-gap);
  padding-right: var(--wmx-gap);
}

/* ------------------------------------------------------------ sample card */
.wmx-card {
  position: relative;
  flex: none;
  width: var(--wmx-w);
  /* real stock, not #fff: a hair of the cool paper tone. The grain rides on
     ::after at low opacity instead of as a background-image — at full
     strength it speckles the whole card, prints included, and reads dirty. */
  background-color: color-mix(in srgb, var(--parch) 93%, var(--parch-3));
  border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  /* Polaroid proportion: even margins around the print, then a deep sill
     underneath for the caption. Equal padding on all four sides was the main
     reason this read as a div with a picture in it rather than a mounted
     print — the bottom margin is what makes a mount look like a mount. */
  padding: 0.5rem 0.5rem 0;
  /* contact shadow + ambient, offset downward — a single soft blur on all
     sides is what makes stacked cards look pasted on */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -1px 0 rgba(16, 17, 44, 0.05),
    0 1px 2px rgba(16, 17, 44, 0.1),
    0 10px 18px -6px rgba(16, 17, 44, 0.16),
    0 26px 44px -12px rgba(16, 17, 44, 0.18);
  transition: transform 0.45s var(--ease), box-shadow 0.45s var(--ease);
}
/* grain sits under the content, so it textures the stock without speckling
   the prints */
.wmx-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: var(--paper-noise);
  opacity: 0.2;
}
.wmx-card > * {
  position: relative;
  z-index: 1;
}
/* Six angles, not two. The cycle length is coprime with the 13-card run, so
   the pile never falls into a visible zigzag. */
.wmx-card:nth-child(6n + 1) { transform: rotate(-5.2deg) translateY(10px); }
.wmx-card:nth-child(6n + 2) { transform: rotate(3.4deg) translateY(-7px); }
.wmx-card:nth-child(6n + 3) { transform: rotate(-2.1deg) translateY(4px); }
.wmx-card:nth-child(6n + 4) { transform: rotate(5.6deg) translateY(-3px); }
.wmx-card:nth-child(6n + 5) { transform: rotate(-3.8deg) translateY(-9px); }
.wmx-card:nth-child(6n + 6) { transform: rotate(1.6deg) translateY(7px); }
/* hover-capable pointers only: on touch this fires after a tap and would
   leave the card straightened and lifted with no way to undo it */
@media (hover: hover) {
  .wmx-card:hover {
    transform: rotate(0deg) translateY(-8px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 2px 4px rgba(16, 17, 44, 0.12),
      0 16px 26px -8px rgba(16, 17, 44, 0.2),
      0 38px 62px -16px rgba(16, 17, 44, 0.22);
  }
}

/* Tape strip on every card, always on the top edge. CSS has no randomness, so
   placement cycles through five variants that differ only in offset, width and
   lean — enough that no two neighbours match, without scattering tape around
   the corners. */
.wmx-card__tape {
  position: absolute;
  z-index: 3; /* above the header, which comes later in the DOM */
  top: -9px;
  left: 50%;
  width: 74px;
  height: 19px;
  transform: translateX(-50%) rotate(-2.4deg);
  background: linear-gradient(
    100deg,
    rgba(214, 236, 246, 0.5),
    rgba(232, 246, 252, 0.68) 45%,
    rgba(206, 231, 243, 0.5)
  );
  /* faint darker ends read as the torn edges of a cut strip */
  border-left: 1px solid rgba(150, 190, 212, 0.28);
  border-right: 1px solid rgba(150, 190, 212, 0.28);
  box-shadow: 0 1px 2px rgba(16, 17, 44, 0.12);
  pointer-events: none;
}
/* centred, leaning left */
.wmx-card:nth-child(5n + 1) .wmx-card__tape {
  left: 47%;
  width: 78px;
  top: -9px;
  transform: translateX(-50%) rotate(-3.4deg);
}
/* left of centre, flatter */
.wmx-card:nth-child(5n + 2) .wmx-card__tape {
  left: 30%;
  width: 70px;
  top: -8px;
  transform: rotate(-1.2deg);
}
/* right of centre, leaning right */
.wmx-card:nth-child(5n + 3) .wmx-card__tape {
  left: 56%;
  width: 66px;
  top: -11px;
  transform: rotate(4.6deg);
}
/* wide, almost square to the edge */
.wmx-card:nth-child(5n + 4) .wmx-card__tape {
  left: 38%;
  width: 86px;
  top: -8px;
  transform: rotate(1.6deg);
}
/* narrow, further left, steeper lean */
.wmx-card:nth-child(5n + 5) .wmx-card__tape {
  left: 22%;
  width: 62px;
  top: -10px;
  transform: rotate(-6.2deg);
}

/* ---------------------------------------------------------- specimen label */
.wmx-card__head {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.15rem 0.1rem 0.45rem;
  margin-bottom: 0.5rem;
}
/* the catalogue number carries the weight, the label recedes */
.wmx-card__idx {
  font-family: var(--serif);
  font-style: italic;
  font-size: 0.92rem;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--gold-deep);
}
.wmx-card__art {
  position: relative;
  background: var(--wine-900);
  /* the print sits ON the mount: hairline edge + its own drop shadow */
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ink) 20%, transparent),
    0 2px 5px rgba(16, 17, 44, 0.22);
}
/* duotone print-plate: greyscale art with a midnight-cyan wash so the old
   gold/red icon renders sit inside the site's palette */
.wmx-card__art::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(160deg, rgba(135, 206, 235, 0.16), rgba(21, 23, 61, 0.28));
  mix-blend-mode: color;
}
.wmx-card__art img {
  filter: grayscale(1) contrast(1.06) brightness(1.02);
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
/* Two tiers instead of one mono line boxed by rules: the discipline reads
   first, the tool sits under it as a quieter note. */
/* The caption sits in the mount's bottom sill. min-height keeps every card
   the same height whether its label runs to one line or two. */
.wmx-card__cap {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.2rem;
  text-align: center;
  padding: 0.85rem 0.3rem 1.15rem;
  min-height: 4.9rem;
}
.wmx-card__capmain {
  font-family: var(--mono);
  font-weight: 600;
  font-size: 0.66rem;
  line-height: 1.4;
  /* wraps instead of nowrap: the card is only 188-240px, and shrinking type
     to force one line is what made the longer skills unreadable */
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--ink);
  text-wrap: balance;
  /* highlighter swipe: the discipline is what the plate is FOR, so it gets
     marked up like a line in a notebook. Transparent top and bottom stops
     keep it a hand-drawn stroke rather than a UI chip; the ink stays full
     strength so contrast on the white mount is unaffected. */
  padding: 0.3em 0.5em;
  border-radius: 2px;
  background-image: linear-gradient(
    to bottom,
    transparent 8%,
    color-mix(in srgb, var(--gold) 62%, transparent) 8%,
    color-mix(in srgb, var(--gold) 62%, transparent) 92%,
    transparent 92%
  );
  box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--gold-deep) 34%, transparent);
}
/* The tool was the least legible thing on the card — small, italic and pale.
   Larger, heavier and considerably darker, without shouting. */
.wmx-card__captool {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 500;
  font-size: 1.02rem;
  line-height: 1.2;
  letter-spacing: 0.015em;
  text-transform: none;
  color: color-mix(in srgb, var(--gold-deep) 66%, var(--ink));
}

/* typographic tally card */
.wmx-card__stat {
  aspect-ratio: 1 / 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.55rem;
  text-align: center;
  /* matches the print: hairline edge + its own shadow, not a flat bordered box */
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ink) 20%, transparent),
    0 2px 5px rgba(16, 17, 44, 0.22);
  background-color: var(--parch-2);
  background-image: var(--paper-noise);
  padding: 0.8rem;
}
.wmx-card__ding {
  color: var(--gold-deep);
  font-size: 0.85rem;
  line-height: 1;
}
.wmx-card__big {
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(2.7rem, 2rem + 2.4vw, 4rem);
  line-height: 0.9;
  letter-spacing: var(--tr-display);
  color: var(--ink);
}
.wmx-card__statlabel {
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* ----------------------------------------------------------------- ticker */
.wmx-tickerband {
  position: relative;
  z-index: 1;
  color: var(--ink);
  opacity: 0.7;
  margin-top: clamp(2rem, 5vw, 3.4rem);
  margin-inline: calc(-1 * var(--pad));
  padding-block: 0.85rem;
  border-block: 1px solid var(--ink-line-soft);
}

/* ------------------------------------------------------------- responsive */
@media (max-width: 900px) {
  .wmx-rules {
    display: none;
  }
}
@media (max-width: 480px) {
  .wmx-xh {
    display: none;
  }
  .wmx-viewport {
    --wmx-w: 180px;
    --wmx-gap: 1.2rem;
  }
}

/* --------------------------------------------------------- reduced motion */
/* ------------------------------------------------ touch: swipe the specimens */
/* An auto-drifting row can't be steered with a finger, so on touch devices the
   marquee becomes a native horizontal scroller: a single run of cards, momentum
   scrolling, and gentle snapping. The duplicate run only exists to make the
   translateX(-50%) loop seamless, so it is dropped here. */
/* Two triggers for the same mode, because neither alone is enough:
   the media query catches phones and tablets even before JS runs, and
   html.is-touch (set in siteEffects.js from navigator.maxTouchPoints) catches
   touchscreen laptops, which report a fine pointer and never match the query. */
@media (hover: none), (pointer: coarse) {
  .wmx-track { animation: none; }
  .wmx-run[aria-hidden="true"] { display: none; }
  .wmx-viewport {
    overflow-x: auto;
    /* explicit, so the rotated cards never spawn a nested vertical scrollbar */
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch; /* iOS momentum */
    overscroll-behavior-x: contain; /* no page-back gesture at the ends */
    scroll-snap-type: x proximity; /* proximity, not mandatory — never fights the swipe */
    scrollbar-width: none;
    /* room for the tilt, tape and shadows now that the box actually clips */
    padding-block: clamp(3rem, 6vw, 3.8rem);
    padding-inline: var(--pad);
    scroll-padding-inline: var(--pad);
    /* the row runs off the right edge — fade it so there is a visible cue
       that more cards are there to swipe to */
    -webkit-mask-image: linear-gradient(90deg, #000 0 92%, transparent 100%);
    mask-image: linear-gradient(90deg, #000 0 92%, transparent 100%);
  }
  .wmx-viewport::-webkit-scrollbar { display: none; }
  .wmx-card { scroll-snap-align: center; }
}

html.is-touch .wmx-track { animation: none; }
html.is-touch .wmx-run[aria-hidden="true"] { display: none; }
html.is-touch .wmx-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  padding-block: clamp(3rem, 6vw, 3.8rem);
  padding-inline: var(--pad);
  scroll-padding-inline: var(--pad);
  -webkit-mask-image: linear-gradient(90deg, #000 0 92%, transparent 100%);
  mask-image: linear-gradient(90deg, #000 0 92%, transparent 100%);
}
html.is-touch .wmx-viewport::-webkit-scrollbar { display: none; }
html.is-touch .wmx-card { scroll-snap-align: center; }

.wmx-swipehint {
  display: none;
}

/* ----------------------------------------------------------------- MOBILE
   Bigger cards (~62vw, one and a half on screen), the vertical padding the
   desktop marquee needed for its tilt trimmed, and a swipe hint. */
@media (max-width: 767.98px) {
  .wmx-root {
    padding-bottom: 2.8rem;
  }
  .wmx-head {
    padding: 0;
  }
  .wmx-title__serif {
    font-size: clamp(1.5rem, 6.6vw, 1.9rem);
  }
  .wmx-ornwrap {
    margin-top: 0.9rem;
  }
  .wmx-viewport,
  html.is-touch .wmx-viewport {
    --wmx-w: min(62vw, 240px);
    --wmx-gap: 1.1rem;
    margin-top: 1.4rem;
    padding-block: 2rem 1.4rem;
  }
  .wmx-card__cap {
    min-height: 4.2rem;
    padding: 0.7rem 0.3rem 0.95rem;
  }
  .wmx-card__capmain {
    font-size: 0.68rem;
  }
  .wmx-card__captool {
    font-size: 1.05rem;
  }
  .wmx-swipehint {
    display: block;
    position: relative;
    z-index: 1;
    margin: 0.2rem 0 0;
    text-align: center;
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .wmx-tickerband {
    margin-top: 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wmx-track {
    animation: none;
  }
  .wmx-run[aria-hidden="true"] {
    display: none;
  }
  .wmx-viewport {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .wmx-card,
  .wmx-card:hover {
    transition: none;
  }
}
`;

