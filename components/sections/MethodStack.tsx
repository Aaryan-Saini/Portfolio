"use client";

/* ============================================================================
   MethodStack — "The Way I Test". Dark ledger set piece: a 320vh runway pins
   a 100svh stage where six crumpled paper cards fly up from below and settle
   into a pile between two serif flank titles ("The Way" ← pile → "I Test").
   The title is cut like every other section crest: laurel branches on both
   sides and an oversized script drop-cap on the opening letter.
   A serif-italic ticker runs along the floor.
   Fallback (<860px / reduced motion / no-js): one heading, static card stack.
   Section id="method".
   ========================================================================== */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Ticker, Crosshair, TornEdge, LaurelBranch } from "@/components/ui/editorial";
import OilFlowBackground from "@/components/ui/OilFlowBackground";
import TornPaperEdge from "@/components/ui/TornPaperEdge";

/* ------------------------------------------------------------ verbatim data */
const CARDS = [
  {
    num: "01",
    title: "Ask What Breaks.",
    line: "Questions before clicks. Edge cases before happy paths.",
  },
  {
    num: "02",
    title: "Observe Like A User",
    line: "I test like a user, and think like an engineer.",
  },
  {
    num: "03",
    title: "Automate The Boring",
    line: "Playwright and Postman suites for the paths humans shouldn’t repeat.",
  },
  {
    num: "04",
    title: "Test With Reason",
    line: "Coverage needs logic. Priority beats volume.",
  },
  {
    num: "05",
    title: "Break Relentlessly",
    line: "Break it. Log it. Verify the fix. Repeat.",
  },
  {
    num: "06",
    title: "Partner, Not Vendor",
    line: "I don’t just file bugs. I deliver clarity, care, and work that’s ready to ship.",
  },
] as const;

const TICKER_ITEMS = [
  "Turning chaos into certainty",
  "Zero-defect mindset",
  "Evidence-driven decisions",
  "Crafted with intention",
];

/* ---------------------------------------------------------------- component */
export default function MethodStack() {
  const rootRef = useRef<HTMLElement>(null);
  /* the WebGL tear reports in once it draws; until then (and without WebGL)
     the static SVG tear keeps the paper edge */
  const [glTear, setGlTear] = useState(false);

  /* pinned card-pile choreography — desktop, motion-tolerant only */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 860px) and (prefers-reduced-motion: no-preference)",
      () => {
        const root = rootRef.current;
        if (!root) return;
        const cards = Array.from(
          root.querySelectorAll<HTMLElement>(".msx-card")
        );
        if (!cards.length) return;
        const flankL = root.querySelector(".msx-flank--l");
        const flankR = root.querySelector(".msx-flank--r");
        const grid = root.querySelector<HTMLElement>(".msx-grid");
        const lTitle = root.querySelector<HTMLElement>(
          ".msx-flank--l .msx-flank__h"
        );
        const rTitle = root.querySelector<HTMLElement>(
          ".msx-flank--r .msx-flank__h"
        );

        /* the runway's tail (.msx-hold, one --edt-overlap tall) is the stretch
           the Experience panel slides up over the frozen pile — the
           choreography must be finished by then, so it ends where the hold
           begins rather than at the root's bottom */
        const hold = root.querySelector<HTMLElement>(".msx-hold");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            endTrigger: hold ?? root,
            end: hold ? "top bottom" : "bottom bottom",
            scrub: 0.65,
            invalidateOnRefresh: true,
          },
        });

        /* flank titles start JOINED in the centre — reading "The Way  I Test"
           — then split outward to their columns as the pile begins.
           Function-based from-values so invalidateOnRefresh re-measures
           (fonts, resizes); current tween offsets are subtracted to recover
           the natural, untransformed positions. */
        if (flankL && flankR && grid && lTitle && rTitle) {
          const JOIN = 9; /* half-gap between the joined titles, px */
          /* vertical join is measured on the italic words ("Way" / "Test"):
             identical metrics on both sides, so the left title's taller
             script drop-cap cannot push its baseline off the right one's */
          const lWord = lTitle.querySelector<HTMLElement>("em") ?? lTitle;
          const rWord = rTitle.querySelector<HTMLElement>("em") ?? rTitle;
          const joined = () => {
            const cx =
              grid.getBoundingClientRect().left +
              grid.getBoundingClientRect().width / 2;
            const lx = Number(gsap.getProperty(flankL, "x")) || 0;
            const rx = Number(gsap.getProperty(flankR, "x")) || 0;
            const ry = Number(gsap.getProperty(flankR, "y")) || 0;
            const lr = lTitle.getBoundingClientRect();
            const rr = rTitle.getBoundingClientRect();
            const lw = lWord.getBoundingClientRect();
            const rw = rWord.getBoundingClientRect();
            return {
              xl: cx - JOIN - (lr.right - lx),
              xr: cx + JOIN - (rr.left - rx),
              yr: lw.top - (rw.top - ry),
            };
          };
          tl.fromTo(
            flankL,
            { x: () => joined().xl },
            { x: 0, duration: 1.6, ease: "power2.inOut" },
            0
          );
          tl.fromTo(
            flankR,
            { x: () => joined().xr, y: () => joined().yr },
            { x: 0, y: 0, duration: 1.6, ease: "power2.inOut" },
            0
          );
        }
        /* each card rises from below the stage and lands ON TOP of the pile;
           slots step 58px downward so earlier titles stay peeking out,
           rotation alternates -1.5 / +1.2 deg. First card waits for the
           flank split to clear the centre. */
        cards.forEach((card, i) => {
          tl.fromTo(
            card,
            { y: "110vh", x: 0, rotation: 4 },
            {
              y: 0,
              x: i % 2 === 0 ? -5 : 5,
              rotation: i % 2 === 0 ? -1.5 : 1.2,
              duration: 1.15,
              ease: "power2.out",
            },
            0.9 + i * 0.9
          );
        });

        /* settle beat — the finished pile rests before the pin releases */
        tl.to({}, { duration: 0.65 }, ">");
      }
    );
    return () => mm.revert();
  }, []);

  return (
    <section
      id="method"
      ref={rootRef}
      className={`edt-dark msx-root${glTear ? " has-gl-tear" : ""}`}
    >
      {/* ------------------------------------ the boundary above the ledger:
          the paper section above ends here, in a scroll-driven torn edge
          (see TornPaperEdge). The strip rides the top of the runway and scrolls
          with the page; its tear sweeps the strip as it crosses the viewport,
          so the edge moves ~1.3× the page — the reference's parallax rip. */}
      <TornPaperEdge className="msx-tear" onReady={() => setGlTear(true)} />
      <TornEdge side="top" color="var(--parch)" seed={13} className="msx-tear-fallback" />

      <div className="msx-stage">
        {/* ---------------------------------- flowing-oil ground, underneath.
            Lives inside the stage so on desktop it rides the sticky theatre
            (one viewport, not the 320vh runway) and on phones it simply
            fills the section. The heading and pile all paint above. */}
        <OilFlowBackground className="msx-oil" />

        {/* ------------- the real heading: visible in fallback, sr-only when
            the pinned flank titles take over visually ---------------------- */}
        <header className="msx-head">
          {/* laurel-flanked like every other section title (Crest's row) */}
          <h2 className="msx-h">
            <span className="msx-h__row">
              <LaurelBranch />
              <span className="msx-h__text">
                The <em>Way</em> I <em>Test</em>
              </span>
              <LaurelBranch flip />
            </span>
          </h2>
        </header>

        {/* ------------------------------------------ flanks + card pile */}
        <div className="msx-grid">
          {/* each flank carries its outer laurel, so the joined state reads
              "❧ The Way  I Test ❧" and the branches ride out with the split */}
          <div className="msx-flank msx-flank--l" aria-hidden="true">
            <span className="msx-flank__row">
              <LaurelBranch />
              <span className="msx-flank__h">
                The <em>Way</em>
              </span>
            </span>
          </div>

          <ol className="msx-pile">
            {CARDS.map((c, i) => (
              <li
                key={c.num}
                className="msx-card"
                data-rvl="up"
                style={
                  {
                    "--msx-i": i,
                    "--rvl-delay": `${i * 0.09}s`,
                  } as CSSProperties
                }
              >
                <span className="msx-card__num" aria-hidden="true">
                  {c.num}
                </span>
                <h3 className="msx-card__title">{c.title}</h3>
                <p className="msx-card__line">{c.line}</p>
              </li>
            ))}
          </ol>

          <div className="msx-flank msx-flank--r" aria-hidden="true">
            <span className="msx-flank__row">
              <span className="msx-flank__h">
                I <em>Test</em>
              </span>
              <LaurelBranch flip />
            </span>
          </div>
        </div>

        {/* ------------------------------------------------- floor ticker */}
        <Ticker
          items={TICKER_ITEMS}
          separator={"✦"}
          serif
          speed={34}
          className="msx-ticker"
        />

        {/* register marks */}
        <Crosshair className="msx-xh msx-xh--a" />
        <Crosshair className="msx-xh msx-xh--b" />
      </div>

      {/* the overlap runway: the last --edt-overlap of the root, where the
          stage stays stuck while the next section climbs over it. Purely a
          measuring post for the timeline's end; paints nothing. */}
      <div className="msx-hold" aria-hidden="true" />

      <style>{css}</style>
    </section>
  );
}

/* ------------------------------------------------------------------- styles */
const css = /* css */ `
.msx-root {
  position: relative;
}

/* stage — static scaffold by default (fallback view); sticky theatre when
   the pinned choreography is active */
.msx-stage {
  position: relative;
  /* the bottom pad carries the overlap the Experience panel climbs over, so
     the unpinned fallback does not lose its closing breath to it */
  padding: clamp(4.5rem, 10vw, 8.5rem) var(--pad)
    calc(clamp(3rem, 7vw, 5rem) + var(--edt-overlap));
  /* the oil canvas is an opaque absolute child — clip it to the stage */
  overflow: clip;
}
.msx-oil {
  z-index: 0;
}
/* torn-paper strip: top of the runway, over the oil and the stage content
   (heading/pile are z-index 1); the static SVG fallback hides once it draws */
.msx-tear {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 400px;
  z-index: 3;
  pointer-events: none;
  display: block;
}
.msx-root.has-gl-tear .msx-tear-fallback {
  display: none;
}
.msx-hold {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--edt-overlap);
  pointer-events: none;
}
/* the ledger's crumple pass (edt-dark::before) would otherwise be buried under
   the opaque oil canvas — lift it to z-index 1 so it textures the oil at screen
   resolution; the heading and pile are z-index 1 too but later in the DOM, so
   they still paint on top */
.msx-root.edt-dark::before {
  z-index: 1;
}

/* --------------------------------------------- heading (fallback view) */
.msx-head {
  position: relative;
  z-index: 1;
  text-align: center;
  margin: 0 auto clamp(2.6rem, 7vw, 4.2rem);
}
.msx-h {
  font-family: var(--serif);
  font-weight: 500;
  font-size: var(--fs-h2);
  line-height: var(--lh-h2);
  letter-spacing: var(--tr-display);
  color: var(--parch);
}
.msx-h em {
  font-style: italic;
  font-weight: 400;
  margin-left: -0.06em;
  color: var(--gold);
}

/* ------------------------------------------------- flank titles (pin) */
.msx-flank {
  display: none;
  /* one size drives the title, its laurel and the gap between them */
  --msx-flank-fs: calc(var(--fs-h2) * 1.3);
}
.msx-flank__h {
  display: block;
  font-family: var(--serif);
  font-weight: 500;
  font-size: var(--msx-flank-fs);
  line-height: 0.92;
  letter-spacing: var(--tr-display);
  color: var(--parch);
}
.msx-flank__h em {
  font-style: italic;
  font-weight: 400;
  margin-left: -0.1em;
  color: var(--gold);
}
.msx-flank--r .msx-flank__h em {
  margin-left: -0.04em;
}

/* ------------------------------------------------ crest cut (both views) */
/* laurel row, as .crest__row on the other section titles */
.msx-h__row,
.msx-flank__row {
  display: inline-flex;
  align-items: center;
}
.msx-h__row {
  gap: clamp(0.7rem, 1.8vw, 1.5rem);
}
/* the flank laurels scale with the flank type, not the viewport */
.msx-flank__row {
  gap: calc(var(--msx-flank-fs) * 0.25);
}
.msx-flank .crest__laurel {
  width: calc(var(--msx-flank-fs) * 0.6);
}
.msx-h__text {
  display: block;
  text-align: left;
}
/* both laurels parchment, matching the roman half of the title — the same
   choice the credo's "How I Earn Trust" makes on this dark ground */
.msx-root .crest__laurel {
  color: var(--parch);
  opacity: 1;
}
/* the crests' oversized script drop-cap on the opening letter. The pinned
   view only caps the LEFT flank: joined, the pair reads as one title */
.msx-h__text::first-letter,
.msx-flank--l .msx-flank__h::first-letter {
  font-family: var(--script);
  font-size: 1.55em;
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 0.8;
}

/* ------------------------------------------------------ grid + pile */
.msx-grid {
  position: relative;
  z-index: 1;
  max-width: var(--maxw);
  margin: 0 auto;
}
.msx-pile {
  position: relative;
  display: grid;
  gap: clamp(0.9rem, 2.4vw, 1.15rem);
  width: min(520px, 90vw);
  margin: 0 auto;
}

/* -------------------------------------------------------------- card */
.msx-card {
  position: relative;
  background: var(--parch);
  color: var(--ink);
  border: 1px solid var(--ink-line);
  border-radius: 4px;
  padding: 1.6rem 2rem;
  box-shadow: 0 26px 54px -20px rgba(7, 8, 23, 0.6),
    0 5px 14px rgba(7, 8, 23, 0.26);
}
/* crumpled-paper texture */
.msx-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--crumple-noise);
  background-size: 420px 420px;
  mix-blend-mode: multiply;
  opacity: 0.14;
  pointer-events: none;
}
.msx-card__num {
  position: absolute;
  top: 1.05rem;
  right: 1.2rem;
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: 0.14em;
  color: var(--gold-deep);
}
.msx-card__title {
  position: relative;
  font-family: var(--serif);
  font-style: italic;
  font-weight: 500;
  font-size: calc(var(--fs-h3) * 1.2);
  line-height: 1.04;
  letter-spacing: -0.01em;
  padding-right: 2.4rem;
}
.msx-card__line {
  position: relative;
  margin-top: 0.6rem;
  font-family: var(--body);
  font-weight: 300;
  font-size: var(--fs-body-sm);
  line-height: 1.55;
  color: var(--ink-muted);
  max-width: 42ch;
}

/* ------------------------------------------------------------ ticker */
.msx-ticker {
  position: relative;
  z-index: 1;
  margin: clamp(3.4rem, 9vh, 5.4rem) calc(var(--pad) * -1) 0;
  color: var(--parch);
  opacity: 0.65;
}

/* ------------------------------------------------------ register marks */
.msx-xh--a {
  top: clamp(1.4rem, 4vh, 2.4rem);
  left: calc(50% - 9px);
  opacity: 0.5;
}
.msx-xh--b {
  display: none;
  bottom: clamp(4.6rem, 11vh, 6.6rem);
  left: calc(50% - 9px);
  opacity: 0.4;
}

/* ==================================================== PINNED THEATRE
   Desktop + motion-tolerant + JS present. No-js keeps the fallback. */
@media (min-width: 860px) and (prefers-reduced-motion: no-preference) {
  html:not(.no-js) .msx-root {
    /* + the overlap: the Experience panel eats that much of the runway on its
       way up, and the pile's settle beat should not pay for it */
    height: calc(320vh + var(--edt-overlap));
  }
  html:not(.no-js) .msx-stage {
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100svh;
    padding: 0 var(--pad);
    overflow: hidden;
    display: grid;
    align-items: center;
  }
  /* the real heading stays in the accessibility tree; flanks take over */
  html:not(.no-js) .msx-head {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  html:not(.no-js) .msx-grid {
    display: grid;
    width: 100%;
    /* the pile keeps 520px down to ~1180px, then cedes width to the flanks
       so "❧ The Way" / "I Test ❧" still fit their columns on one line */
    grid-template-columns: minmax(0, 1fr) min(520px, 44vw) minmax(0, 1fr);
    column-gap: clamp(1.2rem, 3vw, 3.4rem);
    align-items: center;
  }
  html:not(.no-js) .msx-flank {
    display: block;
    will-change: transform;
    /* flank type sized to the room a flank actually has (its column plus the
       page gutter it may overhang): ~5.5em of content per side — script cap,
       "he Way", laurel, gap. The two linear terms are that budget with the
       520px pile and with the 44vw pile; the cap is the design size. */
    --msx-flank-fs: min(
      calc(var(--fs-h2) * 1.3),
      max(calc(8.5vw - 50px), calc(4.5vw - 3px))
    );
  }
  /* each half stays on one line: the joined state must read as one title */
  html:not(.no-js) .msx-flank__h {
    white-space: nowrap;
  }
  html:not(.no-js) .msx-flank--l {
    justify-self: end;
    text-align: left;
  }
  html:not(.no-js) .msx-flank--r {
    justify-self: start;
  }
  html:not(.no-js) .msx-pile {
    display: block;
    width: 100%;
    height: clamp(380px, 56vh, 560px);
    height: clamp(380px, 56svh, 560px);
    margin: 0;
  }
  /* slots step 26px downward; later cards sit ON TOP via DOM paint order.
     Pre-GSAP state parks each card below the stage (no first-paint flash);
     the scrubbed inline transform then drives it. Reveal opacity/transition
     are neutralised so data-rvl cannot fight the scrub. */
  html:not(.no-js) .msx-card {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--msx-i, 0) * 58px);
    opacity: 1 !important;
    transition: none !important;
    transform: translateY(110vh) rotate(4deg);
    will-change: transform;
  }
  html:not(.no-js) .msx-ticker {
    position: absolute;
    left: 0;
    right: 0;
    bottom: clamp(1.2rem, 3.2vh, 2.2rem);
    margin: 0;
    z-index: 0;
  }
  html:not(.no-js) .msx-xh--b {
    display: block;
  }
}

/* ------------------------------------------------------- small screens */
/* ------------------------------------------------------------- MOBILE */
@media (max-width: 767.98px) {
  .msx-tear {
    height: 260px;
  }
  /* the stage is not pinned on phones, so clear the strip: the heading starts
     below the paper's reach and the tear only ever crosses the oil ground */
  .msx-stage {
    padding: calc(260px + 1.6rem) var(--pad) calc(2.6rem + var(--edt-overlap));
  }
  .msx-head {
    margin-bottom: 1.8rem;
  }
  .msx-pile {
    width: 100%;
    gap: 0.8rem;
  }
  .msx-card {
    padding: 1.2rem 1.15rem 1.25rem;
    border-radius: 6px;
  }
  .msx-card__num {
    top: 0.95rem;
    right: 1rem;
  }
  .msx-card__title {
    font-size: clamp(1.35rem, 5.8vw, 1.6rem);
    padding-right: 2.2rem;
  }
  .msx-card__line {
    font-size: 0.95rem;
    font-weight: 400;
    max-width: none;
    color: rgba(21, 23, 61, 0.78);
  }
  .msx-ticker {
    margin-top: 2.2rem;
  }
}
`;

