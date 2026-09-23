"use client";

/* ============================================================================
   QualityCredo — "How I earn trust."
   Formerly its own torn-paper section; it is now EMBEDDED inside IntroStamp,
   in the slot the stats strip used to hold, so it renders on the dark ledger
   rather than on paper. It therefore ships no <section>, no torn edge and no
   column rules — the host section owns all three — and its palette is the
   dark-ground one (parchment type, cyan accents).

   A headline sits top-left (per-character blur reveal), a pair of googly
   reading glasses top-right whose pupils track the cursor, and the credo
   occupies the right two columns like a pull-quote set in an old periodical —
   the statement and its supporting line, each word filling from ghost to full
   as you scroll. The three counts run as mono footnotes under the ✚ separator
   rule at the foot.

   NB: the torn top edge this used to carry (dark -> paper) now lives on
   FeaturedProjects, which is the first paper section after the move.
   ========================================================================== */

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LaurelBranch, SeparatorRule, useCharReveal } from "@/components/ui/editorial";

/* ------------------------------------------------------------------ credo */
/* Verbatim copy, tokenized per word so the scrub can fill it word-by-word.
   `a` marks the accent words; `tail` keeps punctuation glued to its word. */
type QuoteWord = { w: string; a?: true; tail?: string };
const QUOTE: QuoteWord[] = [
  { w: "I" },
  { w: "break" },
  { w: "software" },
  { w: "before" },
  { w: "your" },
  { w: "users", a: true },
  { w: "do", a: true, tail: "." },
];

/* the plain-English follow-through: what that actually looks like as work */
const SUPPORT =
  "I am a QA engineer. I write the test cases, automate the repetitive ones in Playwright, check the APIs in Postman, and chase every defect through Jira until it is fixed. ERP, CRM, e-commerce, AI products. I have tested them all.";

/* the support line, tokenized the same way so its words join the scrub */
const SUPPORT_WORDS = SUPPORT.split(" ");

/* three things a visitor should remember — the footnote row */
const FACTS: { v: string; l: string }[] = [
  { v: "500+", l: "Test cases written" },
  { v: "3", l: "Flagship products tested" },
  { v: "Web · Android", l: "Platforms covered" },
];

/* --------------------------------------------------------- googly glasses */
/* Reference easter egg: the glasses doodle, but each lens holds a pupil that
   tracks the cursor — direct style writes in rAF, no re-render. Pupils sit
   centered (static) under reduced motion or without a fine pointer. */
function GooglyGlasses({ className = "" }: { className?: string }) {
  const lensL = useRef<SVGCircleElement>(null);
  const lensR = useRef<SVGCircleElement>(null);
  const pupL = useRef<SVGCircleElement>(null);
  const pupR = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const lL = lensL.current;
    const lR = lensR.current;
    const pL = pupL.current;
    const pR = pupR.current;
    if (!lL || !lR || !pL || !pR) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    /* pupil deflects up to 30% of the lens radius (r=12 → 3.6 user units;
       CSS px on SVG children are user units, so it scales with the svg) */
    const MAX = 3.6;
    /* the svg is drawn under rotate(3deg) · rotate(-8deg) = net -5°;
       rotate the screen-space aim vector by +5° into local coords */
    const ROT = (5 * Math.PI) / 180;

    let px = 0;
    let py = 0;
    let raf = 0;

    const aim = (lens: SVGCircleElement, pupil: SVGCircleElement) => {
      /* bbox center of a circle is its center regardless of rotation */
      const r = lens.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      const ang = Math.atan2(dy, dx) + ROT;
      const pull = Math.min(1, Math.hypot(dx, dy) / 90) * MAX;
      pupil.style.transform = `translate(${(Math.cos(ang) * pull).toFixed(
        2
      )}px, ${(Math.sin(ang) * pull).toFixed(2)}px)`;
    };
    const frame = () => {
      raf = 0;
      aim(lL, pL);
      aim(lR, pR);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      pL.style.transform = "";
      pR.style.transform = "";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className={`phx-glasses ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 96 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle ref={lensL} cx="22" cy="19" r="12" />
        <circle ref={lensR} cx="74" cy="19" r="12" />
        <path d="M34 17 C 42 10, 54 10, 62 17" />
        <path d="M10 15 L2 9 M86 15 L94 9" strokeLinecap="round" />
        <circle
          ref={pupL}
          className="phx-pupil"
          cx="22"
          cy="19"
          r="7"
          fill="var(--ink)"
          stroke="none"
        />
        <circle
          ref={pupR}
          className="phx-pupil"
          cx="74"
          cy="19"
          r="7"
          fill="var(--ink)"
          stroke="none"
        />
      </svg>
    </span>
  );
}

export default function QualityCredo() {
  const rootRef = useRef<HTMLDivElement>(null);

  /* heading — the reference's per-character blur reveal */
  useCharReveal(rootRef, ".phx-heading", { stagger: 0.02 });

  /* credo — scroll-scrubbed word fill (0.22 → 1; accents 0.35 → 1) across the
     statement and its support line together, tied to scroll position so the
     text fills as it travels up the screen and empties again on the way back.
     Desktop + motion-tolerant only; otherwise CSS default = full opacity. */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 860px) and (prefers-reduced-motion: no-preference)",
      () => {
        const root = rootRef.current;
        if (!root) return;
        /* The dimmed resting state lives in CSS (.phx-scrub), not in a from()
           value: ScrollTrigger reverts the animation's inline styles on every
           refresh and then re-renders only the first staggered word, so a
           fromTo left words 2+ at full strength until the scrub reached them.
           A to() tween reads its start from the stylesheet and survives that. */
        root.classList.add("phx-scrub");
        const ctx = gsap.context(() => {
          const credo = root.querySelector<HTMLElement>(".phx-credo");
          if (!credo) return;
          const words = Array.from(credo.querySelectorAll<HTMLElement>(".phx-w"));
          if (!words.length) return;
          gsap.to(words, {
            opacity: 1,
            ease: "none",
            duration: 0.6,
            stagger: 0.08,
            scrollTrigger: {
              trigger: credo,
              start: "top 80%",
              end: "bottom 55%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }, root);
        return () => {
          ctx.revert();
          root.classList.remove("phx-scrub");
        };
      }
    );
    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="phx-embed">
      <div className="phx-inner">
        {/* -------------------------------------------------- top register */}
        <div className="phx-top">
          {/* built like the other section titles: roman opening, italic tail,
              crest__title for the script initials the crests all carry */}
          <h2 className="t-h2 crest__title phx-heading">
            <span className="phx-heading__row">
              <LaurelBranch />
              <span className="phx-heading__text">
                How I <em>Earn Trust.</em>
              </span>
              <LaurelBranch flip />
            </span>
          </h2>

          <GooglyGlasses />
        </div>

        {/* -------------------------------------------------- the credo */}
        {/* one wrapper, one scrub: the statement's words fill first, the
            support line's follow, all driven by where the block sits */}
        <div className="phx-credo">
          <p className="t-statement phx-quote">
            {QUOTE.map((t, i) => (
              <Fragment key={i}>
                {i > 0 ? " " : null}
                <span className={t.a ? "phx-w phx-w--a" : "phx-w"}>
                  {t.a ? <span className="t-accent">{t.w}</span> : t.w}
                  {t.tail ?? null}
                </span>
              </Fragment>
            ))}
          </p>

          <p className="phx-support">
            {SUPPORT_WORDS.map((w, i) => (
              <Fragment key={i}>
                {i > 0 ? " " : null}
                <span className="phx-w">{w}</span>
              </Fragment>
            ))}
          </p>
        </div>

        {/* -------------------------------------------------- footnotes */}
        <div className="phx-foot">
          <SeparatorRule className="phx-foot__rule" />
          <div className="phx-foot__row">
            {FACTS.map((f) => (
              <span className="phx-foot__label" key={f.l}>
                <b>{f.v}</b> {f.l}
              </span>
            ))}
          </div>
        </div>

      </div>

      <style>{css}</style>
    </div>
  );
}

const css = /* css */ `
/* Embedded block, not a section: no min-height, no paper ground, no padding —
   IntroStamp's .edt-section and .edt-inner already provide all three. */
.phx-embed {
  display: flex;
  flex-direction: column;
  margin-top: clamp(3.5rem, 9vh, 6.5rem);
}
.phx-inner {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ---------------------------------------------------------- top register */
.phx-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(1.5rem, 4vw, 3rem);
}
/* --ink -> --fg throughout: this now prints on the dark ledger, not on paper */
.phx-heading {
  margin: 0;
  color: var(--fg);
  /* room for italic overhang + descenders while chars translate in */
  padding: 0.05em 0.14em 0.08em;
}
.phx-heading__row {
  display: inline-flex;
  align-items: center;
  text-align: left;
  gap: clamp(0.7rem, 1.8vw, 1.5rem);
}
/* the italic tail in the footer's "let's <word>" blue — the same white-line,
   blue-word motif the closing screen uses */
.phx-heading em {
  color: #2d59c9;
}
/* both laurels white, matching the roman half of the title */
.phx-heading .crest__laurel {
  color: var(--parch);
  opacity: 1;
}

/* googly glasses — reference composition: tilted wrapper, counter-tilted svg */
.phx-glasses {
  display: block;
  width: 100px;
  flex: 0 0 auto;
  color: var(--fg);
  margin-top: clamp(0.4rem, 1.2vw, 1rem);
  transform: rotate(3deg);
}
.phx-glasses svg {
  display: block;
  width: 100%;
  height: auto;
  transform: scale(0.94) rotate(-8deg);
}
.phx-pupil {
  will-change: transform;
}

/* -------------------------------------------------------------- the credo */
/* the statement: the biggest type on the ledger, so the claim lands first */
/* The credo is set as the pull-quote it was before the slab rewrite: an
   italic serif statement indented into the right half of the measure, rather
   than a full-width display headline. The support line and the counts below
   share the same 48% indent, so the three read as one offset quotation.
   --phx-indent is the single dial; the responsive blocks step it down. */
.phx-embed {
  --phx-indent: 48%;
}
p.phx-quote {
  margin: clamp(3.5rem, 9vh, 6.5rem) 0 0 var(--phx-indent);
  font-style: italic;
  line-height: 1.35;
  text-indent: 3ch;
  color: var(--fg);
}
/* words default to full opacity; on desktop, motion-tolerant viewports the
   effect adds .phx-scrub, which dims them, and GSAP scrubs them back to 1 */
.phx-scrub .phx-w {
  opacity: 0.22;
}
.phx-scrub .phx-w--a {
  opacity: 0.35;
}
.phx-w {
  display: inline-block;
  /* the paragraph sets text-indent for its opening line, and indent inherits —
     an inline-block is its own block container, so without this reset every
     single word would be pushed 3ch to the right of its own box */
  text-indent: 0;
  will-change: opacity;
}

/* what that means in practice — same indent, reading size, joins the scrub */
.phx-support {
  margin: clamp(1.4rem, 3.4vh, 2.2rem) 0 0 var(--phx-indent);
  max-width: 62ch;
  font-family: var(--body);
  font-weight: 400;
  font-size: var(--fs-lead);
  line-height: 1.62;
  color: rgba(255, 255, 255, 0.82);
}

/* -------------------------------------------------------------- footnotes */
.phx-foot {
  margin-top: auto;
  padding-top: clamp(4rem, 10vh, 7rem);
}
.phx-foot__rule {
  color: var(--fg);
  margin-bottom: clamp(0.9rem, 2.4vh, 1.5rem);
}
.phx-foot__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.8rem 2rem;
}
.phx-foot__label {
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: var(--tr-label);
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
}
/* the count leads each footnote in the ledger's cyan */
.phx-foot__label b {
  font-weight: 400;
  color: var(--gold);
}


/* ------------------------------------------------------------- responsive */
@media (max-width: 1024px) {
  .phx-embed {
    --phx-indent: 40%;
  }
}
@media (max-width: 900px) {
  .phx-embed {
    --phx-indent: 0%;
  }
  .phx-glasses {
    width: 72px;
  }
}
/* ------------------------------------------------------------- MOBILE */
@media (max-width: 767.98px) {
  .phx-embed {
    margin-top: 2.8rem;
  }
  .phx-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
  .phx-heading {
    padding: 0.05em 0 0.08em;
    font-size: clamp(1.75rem, 7.8vw, 2.25rem);
  }
  .phx-heading__row {
    gap: 0.55rem;
  }
  .phx-glasses {
    width: 54px;
    margin-top: -0.3rem;
    align-self: flex-end;
  }
  p.phx-quote {
    margin-top: 1.5rem;
    text-indent: 0;
    font-size: clamp(1.32rem, 5.7vw, 1.62rem);
    line-height: 1.42;
  }
  .phx-support {
    font-size: 1rem;
  }
  .phx-foot {
    padding-top: 2.4rem;
  }
  .phx-foot__rule {
    margin-bottom: 0.8rem;
  }
  .phx-foot__row {
    flex-direction: column;
    gap: 0.55rem;
  }
}
`;
