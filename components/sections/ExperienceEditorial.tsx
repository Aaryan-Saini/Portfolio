"use client";

/* ============================================================================
   ExperienceEditorial — the beloved horizontal-scroll internship section,
   reframed as pinned "dossier" paper cards sliding across the midnight
   ledger. Wrapper ~340vh scrolls; the stage stays sticky at 100svh while
   the 300vw track scrubs from 0 to -66.7 xPercent. Behind each card a
   giant ghost serif word drifts on its own parallax. Section id="experience".
   Fallback (<860px / reduced motion): unpinned vertical stack of the cards.
   ========================================================================== */

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Crest, Crosshair, useCharReveal } from "@/components/ui/editorial";

/* ------------------------------------------------------------ verbatim data */
type Dossier = {
  role: string;
  company: string;
  ghost: string;
  monogram: string;
  accent: string; // palette token — letter + medallion border colour
  chips: string[];
  description: string;
};

const DOSSIERS: Dossier[] = [
  {
    role: "Junior Quality Engineer",
    company: "KAYEASE · ON-SITE · FULL-TIME · DEC 2025 — PRESENT",
    ghost: "TESTING",
    monogram: "K",
    accent: "var(--gold)" /* #87ceeb */,
    chips: [
      "500+ Test Cases",
      "3 Flagship Products",
      "Playwright & Postman",
      "Jira SDLC Defect Tracking",
    ],
    description:
      "Executed comprehensive QA across three flagship products — a Sales Management ERP (covering inventory, salesman tracking, distributor workflows and accounts), a School Management System (with Student, Teacher, Staff, Admin and Super Admin roles), and a Financial CRM built for NBFCs and private lending firms, where DSA agents and sales reps manage customer pipelines, track loan progress, monitor repayments and handle end-to-end client lifecycle — tested across all role-based flows. Performed manual, functional, regression, smoke, UI, cross-browser and mobile testing on both web and Android applications. Wrote 500+ test cases and test scenarios, validated role-based permissions, business workflows and edge cases. Tested Shopify themes and e-commerce flows. Explored Playwright-based automation scripting for web application regression suites. Conducted API testing via Postman and tracked all defects in Jira through full SDLC cycles.",
  },
  {
    role: "Data Analyst Intern",
    company: "GROWLY · REMOTE · MAY – JUL 2025",
    ghost: "ANALYTICS",
    monogram: "G",
    accent: "var(--gold-soft)" /* #b1dff2 */,
    chips: [
      "100+ Datasets (100MB)",
      "3 Interactive Dashboards",
      "15% Pipeline Optimization",
      "Letter of Recommendation",
    ],
    description:
      "Worked with 100+ datasets (up to 100 MB) using SQL, MySQL and Excel — cleaning, transforming and analysing raw business data into actionable insights. Built 3 interactive dashboards and pivot-based reports to track KPIs across sales and operations. Identified processing bottlenecks through SQL query optimisation, improving pipeline efficiency by 15%. Documented findings and presented to stakeholders. Earned a Letter of Recommendation for quality of analysis and delivery speed.",
  },
  {
    role: "Web Developer Intern",
    company: "SAATVIK FINCORP · ON-SITE · MAY – JUL 2025",
    ghost: "DEVELOPMENT",
    monogram: "S",
    accent: "var(--gold-deep)" /* #1e84ae */,
    chips: [
      "Led 3-Person Team",
      "10+ Page Financial Site",
      "1,000+ Month-One Users",
      "End-to-End QA & Launch",
    ],
    description:
      "Led a 3-person team to design, develop and launch a 10+ page business website for a financial services firm — from wireframe to live deployment. Built with HTML, CSS and JavaScript; implemented dark/light mode, testimonials carousel, responsive navigation and contact forms. Grew organic traffic to 1,000+ users in month one. Conducted full end-to-end manual QA across browsers and devices before each release. Managed client communication and delivered within deadline.",
  },
];

const TOTAL = DOSSIERS.length;

/* role title: roman words + final word in italic (mixed-face editorial) */
function RoleTitle({ role }: { role: string }) {
  const words = role.split(" ");
  const last = words[words.length - 1];
  const head = words.slice(0, -1).join(" ");
  return (
    <h3 className="exx-role">
      {head ? <>{head} </> : null}
      <em>{last}</em>
    </h3>
  );
}

/* ---------------------------------------------------------------- component */
export default function ExperienceEditorial() {
  const rootRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /* crest display title — shared per-character blur reveal */
  useCharReveal(rootRef, ".exx-crest .crest__title");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 860px) and (prefers-reduced-motion: no-preference)",
      () => {
        const wrap = wrapRef.current;
        const track = trackRef.current;
        if (!wrap || !track) return;
        const ghosts = gsap.utils.toArray<HTMLElement>(".exx-ghost", wrap);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });

        /* the 300vw track slides two full viewports left */
        tl.to(track, { xPercent: -66.7, duration: 1 }, 0);

        /* each ghost word drifts through its slide's centre on its own
           parallax — zero displacement exactly when its slide is centred */
        ghosts.forEach((g, i) => {
          const centre = i / (TOTAL - 1); /* 0 · 0.5 · 1 */
          tl.fromTo(
            g,
            { x: `${(centre * 22).toFixed(2)}vw` },
            { x: `${((centre - 1) * 22).toFixed(2)}vw`, duration: 1 },
            0
          );
        });
      }
    );
    return () => mm.revert();
  }, []);

  return (
    <section
      id="experience"
      className="edt-dark edt-overlap exx-sec"
      ref={rootRef}
    >
      <div className="exx-wrap" ref={wrapRef}>
        <div className="exx-stage">
          <div className="edt-rules" aria-hidden="true" />
          <Crosshair style={{ top: 26, left: 26 }} />
          <Crosshair style={{ top: 26, right: 26 }} />

          {/* section crest — sits inside the stage so that on desktop it rides
              the pin and titles the whole horizontal run, instead of scrolling
              away before the cards start. Replaces the old sr-only <h2>; Crest
              renders the real one, so there is still exactly one heading. */}
          <div className="exx-crest">
            <Crest eyebrow="THE DOSSIER">
              Three Chapters, <em>One Craft.</em>
            </Crest>
          </div>

          <div className="exx-track" ref={trackRef}>
            {DOSSIERS.map((d, i) => (
              <article
                className="exx-slide"
                key={d.monogram}
                style={{ "--exx-accent": d.accent } as CSSProperties}
              >
                <div className="exx-ghostbox" aria-hidden="true">
                  <span className="exx-ghost">{d.ghost}</span>
                </div>

                <div className="exx-card" data-rvl="up">
                  <span className="exx-medal" aria-hidden="true">
                    {d.monogram}
                  </span>
                  <div className="exx-cardin">
                    <p className="pill-badge pill-badge--paper exx-eyebrow">
                      <span className="pill-badge__dot" aria-hidden="true" />
                      {`0${i + 1} / 03 — WORK EXPERIENCE`}
                    </p>
                    <RoleTitle role={d.role} />
                    <p className="exx-meta">{d.company}</p>
                    <ul className="exx-chips">
                      {d.chips.map((c) => (
                        <li className="chip-mono" key={c}>
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className="exx-div" aria-hidden="true">
                      <span>✦</span>
                    </div>
                    <p className="exx-desc">{d.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

        </div>
      </div>

      <style>{css}</style>
    </section>
  );
}

/* --------------------------------------------------------------------- css */
const css = /* css */ `
.exx-sec {
  position: relative;
}
/* .edt-overlap rounds the section's top corners; the sticky stage clips its
   own contents (ghost words, card shadows) to the same curve so nothing
   squares off the lifted edge as the panel climbs the Method ledger. */
.exx-stage {
  border-radius: inherit;
}

/* ------------- fallback-first: unpinned vertical stack of dossier cards */
.exx-stage {
  position: relative;
  padding: clamp(4.5rem, 10vw, 8rem) var(--pad);
}
/* ------------------------------------------------------------ section crest */
/* fallback layout: ordinary flow above the stacked cards, like every other
   section's heading */
.exx-crest {
  position: relative;
  z-index: 2;
  margin-bottom: clamp(2.6rem, 7vw, 4rem);
}
.exx-crest .crest__laurel {
  color: var(--gold);
  opacity: 1;
}
.exx-track {
  position: relative;
  z-index: 1;
  display: grid;
  gap: clamp(2.2rem, 6vw, 3.4rem);
  max-width: 740px;
  margin: 0 auto;
}
.exx-slide {
  position: relative;
  display: grid;
  justify-items: center;
}
.exx-ghostbox {
  display: none;
}

/* ------------------------------------------------------- the dossier card */
.exx-card {
  position: relative;
  width: min(700px, 100%);
  background: var(--parch);
  color: var(--ink);
  border: 1px solid var(--ink-line);
  padding: clamp(1.7rem, 1rem + 2.2vw, 2.6rem) clamp(1.4rem, 0.9rem + 2.4vw, 2.8rem);
  box-shadow:
    0 34px 80px rgba(7, 8, 23, 0.55),
    0 8px 22px rgba(7, 8, 23, 0.35);
  rotate: 1deg;
}
.exx-slide:nth-child(odd) .exx-card {
  rotate: -1deg;
}
/* paper grain */
.exx-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: var(--paper-noise);
  opacity: 0.06;
}
/* inner hairline frame — printed dossier register */
.exx-card::after {
  content: "";
  position: absolute;
  inset: 9px;
  pointer-events: none;
  border: 1px solid var(--ink-line-soft);
}
.exx-cardin {
  position: relative;
  z-index: 1;
}

/* circular monogram medallion, top-right */
.exx-medal {
  position: absolute;
  z-index: 2;
  top: 1.1rem;
  right: 1.1rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid var(--exx-accent, var(--gold-deep));
  color: var(--exx-accent, var(--gold-deep));
  background: color-mix(in srgb, var(--exx-accent, var(--gold-deep)) 9%, transparent);
  font-family: var(--serif);
  font-weight: 500;
  font-size: 1.7rem;
  line-height: 1;
  user-select: none;
}

/* the eyebrow rides the shared glow-pill badge (paper variant) */
.exx-eyebrow {
  margin: 0 64px 0.9rem 0;
  align-self: flex-start;
}
.exx-role {
  font-family: var(--serif);
  font-weight: 500;
  font-size: calc(var(--fs-h3) * 1.3);
  line-height: 1.05;
  letter-spacing: var(--tr-display);
}
.exx-role em {
  font-style: italic;
  font-weight: 400;
}
.exx-meta {
  font-family: var(--mono);
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 0.7rem;
}
.exx-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.2rem;
}
/* hairline divider with a single dingbat */
.exx-div {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 1.3rem 0 1.1rem;
  color: var(--ink-muted);
}
.exx-div::before,
.exx-div::after {
  content: "";
  height: 1px;
  flex: 1;
  background: var(--ink-line);
}
.exx-div span {
  font-size: 0.6rem;
  line-height: 1;
  opacity: 0.7;
}
.exx-desc {
  font-family: var(--body);
  font-weight: 300;
  font-size: var(--fs-body-sm);
  line-height: 1.62;
  color: var(--ink-muted);
  max-width: 62ch;
}

/* ghost word (hidden in fallback; shown on the pinned stage) */
.exx-ghost {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 500;
  font-size: calc(var(--fs-mega) * 1.6);
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--ink-2);
  opacity: 0.55;
  white-space: nowrap;
  user-select: none;
  will-change: transform;
}

/* ----------------------------------------------------------------- MOBILE
   The dossiers lose their ±1° tilt — slanted running text is the one thing a
   phone reader cannot forgive — and the description prints at full 16px. */
@media (max-width: 767.98px) {
  .exx-stage {
    padding: 3.5rem var(--pad);
  }
  .exx-crest {
    margin-bottom: 1.8rem;
  }
  .exx-track {
    gap: 1.4rem;
  }
  .exx-card,
  .exx-slide:nth-child(odd) .exx-card {
    rotate: 0deg;
    padding: 1.3rem 1.1rem 1.4rem;
    box-shadow: 0 18px 44px rgba(7, 8, 23, 0.45);
  }
  .exx-card::after {
    inset: 7px;
  }
  .exx-medal {
    top: 0.9rem;
    right: 0.9rem;
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  .exx-eyebrow {
    margin: 0 48px 0.8rem 0;
  }
  .exx-role {
    font-size: clamp(1.5rem, 6.6vw, 1.85rem);
  }
  .exx-meta {
    font-size: 0.64rem;
    letter-spacing: 0.1em;
    line-height: 1.6;
    margin-top: 0.55rem;
  }
  .exx-chips {
    margin-top: 0.9rem;
    gap: 0.4rem;
  }
  .exx-div {
    margin: 1rem 0 0.9rem;
  }
  .exx-desc {
    font-size: 0.97rem;
    font-weight: 400;
    line-height: 1.62;
    max-width: none;
    color: rgba(21, 23, 61, 0.8);
  }
}

/* ---------------- pinned horizontal choreography — desktop, motion-tolerant */
@media (min-width: 860px) and (prefers-reduced-motion: no-preference) {
  .exx-wrap {
    height: 340vh;
  }
  .exx-stage {
    position: sticky;
    top: 0;
    height: 100svh;
    overflow: hidden;
    padding: 0;
  }
  .exx-track {
    display: flex;
    width: 300vw;
    height: 100%;
    max-width: none;
    margin: 0;
    gap: 0;
    will-change: transform;
  }
  /* lifted out of flow so it cannot displace the 100%-height track, and left
     pinned to the top of the sticky stage — it holds while the cards scrub
     past, filling the dead space above the centred card */
  .exx-crest {
    position: absolute;
    top: clamp(2.4rem, 6vh, 4rem);
    left: var(--pad);
    right: var(--pad);
    margin: 0;
    pointer-events: none;
  }
  .exx-slide {
    flex: 0 0 100vw;
    width: 100vw;
    height: 100%;
    display: grid;
    place-items: center;
    /* top padding now clears the crest so the centred card sits below it */
    padding: clamp(9rem, 23vh, 14rem) var(--pad) clamp(3.4rem, 8vh, 5rem);
  }
  .exx-ghostbox {
    display: grid;
    position: absolute;
    inset: 0;
    place-items: center;
    /* pushed down out from under the crest, mirroring the slide's new padding */
    padding-top: 12vh;
    padding-bottom: 4vh;
    pointer-events: none;
  }
  /* guard against very short viewports — card may scroll, chrome hidden.
     A nested scroller under Lenis: allowNestedScroll (lib/lenis.ts) hands
     the wheel to the card only while it has more to scroll, then the page
     takes over again. */
  .exx-card {
    max-height: calc(100svh - 15rem);
    overflow-y: auto;
    scrollbar-width: none;
  }
  .exx-card::-webkit-scrollbar {
    display: none;
  }
}

/* short-viewport compaction so the long dossier never clips */
@media (min-width: 860px) and (prefers-reduced-motion: no-preference) and (max-height: 800px) {
  .exx-card {
    padding-top: 1.45rem;
    padding-bottom: 1.45rem;
  }
  .exx-role {
    font-size: calc(var(--fs-h3) * 1.12);
  }
  .exx-desc {
    font-size: 0.84rem;
    line-height: 1.5;
    max-width: 68ch;
  }
  .exx-eyebrow {
    margin-bottom: 0.6rem;
  }
  .exx-meta {
    margin-top: 0.5rem;
  }
  .exx-chips {
    margin-top: 0.85rem;
  }
  .exx-div {
    margin: 1rem 0 0.85rem;
  }
  .exx-medal {
    width: 44px;
    height: 44px;
    font-size: 1.4rem;
  }
}
`;
