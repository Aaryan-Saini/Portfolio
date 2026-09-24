"use client";

/* ============================================================================
   ExperienceEditorial — the beloved horizontal-scroll internship section,
   reframed as pinned "dossier" cards of dark frosted glass (the Featured
   Projects card) sliding across the dusk stage. Wrapper ~340vh scrolls; the stage stays sticky at 100svh while
   the 300vw track scrubs from 0 to -66.7 xPercent. Behind each card a
   giant ghost serif word drifts on its own parallax. Section id="experience".
   Fallback (<860px / reduced motion): unpinned vertical stack of the cards.
   ========================================================================== */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Crest, Crosshair, useCharReveal } from "@/components/ui/editorial";

/* ------------------------------------------------------------ verbatim data */
type Dossier = {
  role: string;
  company: string;
  ghost: string;
  monogram: string;
  description: string;
};

const DOSSIERS: Dossier[] = [
  {
    role: "Junior Quality Engineer",
    company: "KAYEASE · ON-SITE · FULL-TIME · DEC 2025 — PRESENT",
    ghost: "TESTING",
    monogram: "K",
    description:
      "Executed comprehensive QA across three flagship products — a Sales Management ERP (covering inventory, salesman tracking, distributor workflows and accounts), a School Management System (with Student, Teacher, Staff, Admin and Super Admin roles), and a Financial CRM built for NBFCs and private lending firms, where DSA agents and sales reps manage customer pipelines, track loan progress, monitor repayments and handle end-to-end client lifecycle — tested across all role-based flows. Performed manual, functional, regression, smoke, UI, cross-browser and mobile testing on both web and Android applications. Wrote 500+ test cases and test scenarios, validated role-based permissions, business workflows and edge cases. Tested Shopify themes and e-commerce flows. Explored Playwright-based automation scripting for web application regression suites. Conducted API testing via Postman and tracked all defects in Jira through full SDLC cycles.",
  },
  {
    role: "Data Analyst Intern",
    company: "GROWLY · REMOTE · MAY – JUL 2025",
    ghost: "ANALYTICS",
    monogram: "G",
    description:
      "Worked with 100+ datasets (up to 100 MB) using SQL, MySQL and Excel — cleaning, transforming and analysing raw business data into actionable insights. Built 3 interactive dashboards and pivot-based reports to track KPIs across sales and operations. Identified processing bottlenecks through SQL query optimisation, improving pipeline efficiency by 15%. Documented findings and presented to stakeholders. Earned a Letter of Recommendation for quality of analysis and delivery speed.",
  },
  {
    role: "Web Developer Intern",
    company: "SAATVIK FINCORP · ON-SITE · MAY – JUL 2025",
    ghost: "DEVELOPMENT",
    monogram: "S",
    description:
      "Led a 3-person team to design, develop and launch a 10+ page business website for a financial services firm — from wireframe to live deployment. Built with HTML, CSS and JavaScript; implemented dark/light mode, testimonials carousel, responsive navigation and contact forms. Grew organic traffic to 1,000+ users in month one. Conducted full end-to-end manual QA across browsers and devices before each release. Managed client communication and delivered within deadline.",
  },
];

const TOTAL = DOSSIERS.length;

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
      className="edt-dark exx-sec"
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
              <article className="exx-slide" key={d.monogram}>
                <div className="exx-ghostbox" aria-hidden="true">
                  <span className="exx-ghost">{d.ghost}</span>
                </div>

                <div className="exx-card" data-rvl="up">
                  <span className="exx-medal" aria-hidden="true">
                    {d.monogram}
                  </span>
                  <div className="exx-cardin">
                    <p className="pill-badge exx-eyebrow">
                      <span className="pill-badge__dot" aria-hidden="true" />
                      {`0${i + 1} / 03 · Work experience`}
                    </p>
                    <h3 className="exx-role">{d.role}</h3>
                    <p className="exx-meta">{d.company}</p>
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
.exx-stage {
  /* plum above, a rose-magenta glow rising from the foot of the stage */
  background: var(--dusk-stage);
  background-color: var(--wine-900);
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
/* dark frosted glass — the same card as Featured Projects: a faint light
   sheen over the stage, a rose rim and a rose glow beneath, with the ghost
   word behind blurred through it */
.exx-card {
  position: relative;
  width: min(700px, 100%);
  color: var(--fg);
  border-radius: 18px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025) 60%);
  border: 1px solid rgba(239, 162, 182, 0.34);
  -webkit-backdrop-filter: blur(14px) saturate(1.15);
  backdrop-filter: blur(14px) saturate(1.15);
  padding: clamp(1.6rem, 1rem + 2vw, 2.4rem) clamp(1.4rem, 0.9rem + 2.2vw, 2.6rem);
  box-shadow:
    0 30px 60px -24px rgba(0, 0, 0, 0.65),
    0 20px 70px -30px rgba(222, 60, 140, 0.45);
}
.exx-cardin {
  position: relative;
  z-index: 1;
}

/* monogram, top-right — lit like a reached milestone on the projects road */
.exx-medal {
  position: absolute;
  z-index: 2;
  top: 1.2rem;
  right: 1.2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(150deg, #f7cfd9, #efa2b6 55%, #d9728f);
  border: 2px solid #f7cfd9;
  color: #2a1020;
  box-shadow: 0 0 0 6px rgba(239, 162, 182, 0.14), 0 0 26px rgba(239, 162, 182, 0.5);
  font: 700 1.05rem / 1 var(--mono);
  user-select: none;
}

/* the eyebrow rides the shared glow pill, sized like the projects' stage pill */
.exx-eyebrow {
  margin: 0 64px 0 0;
  padding: 0.35rem 0.75rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  background: rgba(239, 162, 182, 0.1);
  border-color: rgba(239, 162, 182, 0.3);
}
.exx-eyebrow .pill-badge__dot {
  width: 6px;
  height: 6px;
}
.exx-role {
  margin-top: 0.9rem;
  font: 600 clamp(1.45rem, 1rem + 1.2vw, 2rem) / 1.15 var(--sans);
  letter-spacing: -0.02em;
  color: var(--fg);
  text-wrap: balance;
}
.exx-meta {
  margin-top: 0.5rem;
  font: 400 0.64rem / 1.5 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
/* hairline divider with a single dingbat */
.exx-div {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 1.2rem 0 1rem;
  color: var(--gold);
}
.exx-div::before,
.exx-div::after {
  content: "";
  height: 1px;
  flex: 1;
  background: rgba(248, 244, 236, 0.12);
}
.exx-div span {
  font-size: 0.6rem;
  line-height: 1;
  opacity: 0.7;
}
.exx-desc {
  font: 300 clamp(0.92rem, 0.88rem + 0.15vw, 0.98rem) / 1.62 var(--body);
  color: color-mix(in srgb, var(--fg) 82%, transparent);
  max-width: 64ch;
  text-wrap: pretty;
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
   Tighter padding and a smaller medal; the description prints at full 16px. */
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
  .exx-card {
    padding: 1.3rem 1.1rem 1.4rem;
    border-radius: 16px;
  }
  .exx-medal {
    top: 1rem;
    right: 1rem;
    width: 38px;
    height: 38px;
    font-size: 0.85rem;
    box-shadow: 0 0 0 4px rgba(239, 162, 182, 0.14), 0 0 18px rgba(239, 162, 182, 0.45);
  }
  .exx-eyebrow {
    margin: 0 48px 0.8rem 0;
  }
  .exx-role {
    font-size: clamp(1.4rem, 6.2vw, 1.75rem);
  }
  .exx-meta {
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    line-height: 1.6;
  }
  .exx-div {
    margin: 1rem 0 0.9rem;
  }
  .exx-desc {
    font-size: 0.97rem;
    line-height: 1.62;
    max-width: none;
    color: color-mix(in srgb, var(--fg) 86%, transparent);
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
    padding: clamp(9.5rem, 25vh, 14.5rem) var(--pad) clamp(3.4rem, 8vh, 5rem);
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
    /* the slide's content box — the space left under the crest — so a long
       dossier never rides up into the title */
    max-height: 100%;
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
    font-size: clamp(1.3rem, 1rem + 0.9vw, 1.6rem);
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
  .exx-div {
    margin: 1rem 0 0.85rem;
  }
  .exx-medal {
    width: 42px;
    height: 42px;
    font-size: 0.9rem;
  }
}
`;
