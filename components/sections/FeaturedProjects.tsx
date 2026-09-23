"use client";

/* ============================================================================
   FEATURED PROJECTS — scroll-driven case studies on paper (id="work").

   Desktop: a two-column story. The footage plate on the left is pinned while
   the three chapters scroll past on the right; whichever chapter sits in the
   middle of the screen is "current" — its footage crossfades in on the plate,
   the plate's numeral and progress rail step to it, and the other chapters
   recede. One idea moves at a time, and the motion always says which project
   you are reading.

   Each chapter is nothing but its facts, in reading order: what it is (title),
   who / when (role), what happened (one paragraph), what it proved (three
   results) and what it was built with (one line). No boxes, no chips.

   Phones: one column, each chapter carrying its own footage above its text.

   The boundary in from the dark ledger above is drawn here too: a strip of the
   oil ground under a scroll-driven torn-paper edge (TornPaperEdge), hung up
   over the previous section's foot, with the static SVG tear as the no-WebGL
   fallback.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { Crest, TornEdge, useCharReveal } from "@/components/ui/editorial";
import TornPaperEdge from "@/components/ui/TornPaperEdge";
import OilFlowBackground from "@/components/ui/OilFlowBackground";
import { asset } from "@/lib/asset";
import { whenUnlocked } from "@/lib/gl";

type Result = { value: string; label: string };

type Project = {
  category: string;
  title: string;
  role: string;
  body: string;
  results: [Result, Result, Result];
  tools: string[];
  video: string;
};

const PROJECTS: Project[] = [
  {
    category: "Chrome extension · Playwright tooling",
    title: "Locator Picker",
    role: "Independent project · Chrome extension, Manifest V3 · 2026",
    body: "Right-click any element on a page and get the strongest Playwright locator that resolves to exactly one node — walked down Playwright's own hierarchy from getByRole to a CSS path, and verified against the live DOM before it is copied. Record a whole flow and export it as locators, test steps or a runnable spec.",
    results: [
      { value: "58", label: "Unit tests passing" },
      { value: "7", label: "Locator tiers, ranked" },
      { value: "0", label: "Network requests" },
    ],
    tools: ["JavaScript", "Manifest V3", "Playwright", "jsdom"],
    video: asset("/videos/locator_picker.mp4"),
  },
  {
    category: "Chrome extension · Browser internals",
    title: "Compartment — Container Tabs",
    role: "Independent project · Chrome extension, Manifest V3 · 2026",
    body: "Container tabs for Chrome, which has no container API. Every container is its own cookie jar and web storage, so one window can be signed in to the same site as several people at once. Cookies are routed per tab with declarativeNetRequest session rules, read back off responses, and namespaced by a main-world storage shim.",
    results: [
      { value: "40+", label: "Adversarial QA scenarios" },
      { value: "4", label: "Tab markers, each switchable" },
      { value: "Chrome 116+", label: "No build step, no dependencies" },
    ],
    tools: ["JavaScript", "Manifest V3", "declarativeNetRequest", "webRequest"],
    video: asset("/videos/compartment.mp4"),
  },
  {
    category: "Full-stack · Client delivery",
    title: "Saatvik Fincorp — Company Website",
    role: "Web Developer Intern · Saatvik Fincorp · May – Jul 2025",
    body: "Led a three-person team to design and ship a financial-services site from an empty repo — dark/light theming, testimonials, responsive navigation. It pulled a thousand users inside the first month.",
    results: [
      { value: "1000+", label: "Users, month one" },
      { value: "10+", label: "Pages shipped" },
      { value: "3", label: "Team led" },
    ],
    tools: ["HTML / CSS / JS", "End-to-end QA", "Cross-browser", "Responsive"],
    video: asset("/videos/fincorp.mp4"),
  },
];

const TOTAL = PROJECTS.length;
const pad = (n: number) => String(n).padStart(2, "0");

/* the two-column story runs from this width up; below it, one column */
const STORY_MQ = "(min-width: 900px)";

export default function FeaturedProjects() {
  const rootRef = useRef<HTMLElement | null>(null);
  /* the WebGL tear reports in once it draws; until then (and without WebGL)
     the static SVG tear keeps the paper edge */
  const [glTear, setGlTear] = useState(false);
  /* which chapter sits in the middle of the screen (desktop story only) */
  const [active, setActive] = useState(0);
  const [story, setStory] = useState(false);
  /* the section is within one viewport of the screen — only then do the
     videos get their sources (and may start playing) */
  const [near, setNear] = useState(false);

  useCharReveal(rootRef, ".fpx-crest .crest__title");

  /* ---- desktop: the chapter crossing the viewport's middle band is current.
     A thin observer band (the middle 10% of the screen) means exactly one
     chapter can own it at a time, and it changes hands the moment the next
     chapter's copy reaches the centre — the plate answers immediately. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mq = window.matchMedia(STORY_MQ);
    let io: IntersectionObserver | null = null;

    const arm = () => {
      disarm();
      if (!mq.matches) {
        setStory(false);
        return;
      }
      setStory(true);
      const chapters = Array.from(root.querySelectorAll<HTMLElement>(".fpx-chapter"));
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
          }
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      chapters.forEach((c) => io?.observe(c));
    };
    const disarm = () => {
      io?.disconnect();
      io = null;
    };
    arm();
    mq.addEventListener("change", arm);
    return () => {
      mq.removeEventListener("change", arm);
      disarm();
    };
  }, []);

  /* ---- footage sources are attached only once the section is within one
     viewport, and never during the boot: six <video src> elements used to
     start range requests at hydration (one file was read in full, 1.6 MB,
     before anything was on screen). Armed after the boot overlay is gone —
     nothing can approach the viewport while scroll is locked behind it. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let io: IntersectionObserver | null = null;
    const arm = () => {
      if (!("IntersectionObserver" in window)) {
        setNear(true);
        return;
      }
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io?.disconnect();
          io = null;
          setNear(true);
        },
        { rootMargin: "100% 0px" }
      );
      io.observe(root);
    };
    const cancel = whenUnlocked(arm);
    return () => {
      cancel();
      io?.disconnect();
    };
  }, []);

  /* only the set the current layout shows gets sources — the other set stays
     empty (CSS hides it), so a file is never fetched twice; the poster is the
     footage's own first frame, so the plate looks as it did with preloaded
     metadata */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !near) return;
    const sel = story ? ".fpx-plate__video" : ".fpx-chapter__video";
    root.querySelectorAll<HTMLVideoElement>(sel).forEach((v) => {
      if (v.src || !v.dataset.src) return;
      v.preload = "metadata";
      if (v.dataset.poster) v.poster = v.dataset.poster;
      v.src = v.dataset.src; // assigning src runs the load algorithm
    });
  }, [near, story]);

  /* ---- footage: on the story layout only the current plate plays; on phones
     each chapter's own footage plays while it is on screen */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!near) return; // no sources yet — nothing to play
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plates = Array.from(root.querySelectorAll<HTMLVideoElement>(".fpx-plate__video"));
    const inline = Array.from(root.querySelectorAll<HTMLVideoElement>(".fpx-chapter__video"));

    if (story) {
      inline.forEach((v) => v.pause());
      plates.forEach((v, i) => {
        if (i === active && !reduce) v.play().catch(() => {});
        else v.pause();
      });
      return;
    }

    plates.forEach((v) => v.pause());
    if (reduce || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.25 }
    );
    inline.forEach((v) => io.observe(v));
    return () => {
      io.disconnect();
      inline.forEach((v) => v.pause());
    };
  }, [near, story, active]);

  return (
    <section
      id="work"
      ref={rootRef}
      className={`fpx edt-paper edt-section${glTear ? " has-gl-tear" : ""}${story ? " is-story" : ""}`}
    >
      {/* the boundary in from the dark ledger above, hung up into the section
          before us: a strip of the oil ground (fading in out of the flat
          ledger) under a scroll-driven torn-paper edge — the reference's own
          orientation, paper below the tear. The SVG tear stays as the
          no-WebGL fallback. */}
      <div className="fpx-tearzone" aria-hidden="true">
        <OilFlowBackground className="fpx-tearoil" />
      </div>
      <TornPaperEdge className="fpx-tear" paperSide="bottom" onReady={() => setGlTear(true)} />
      <TornEdge side="top" color="var(--parch)" seed={7} className="fpx-tear-fallback" />

      <div className="edt-rules" aria-hidden="true" />

      <div className="edt-inner">
        <div className="fpx-crest">
          <Crest eyebrow="SOME OF MY">
            Featured <em>Projects</em>
          </Crest>
        </div>

        <div className="fpx-story">
          {/* ------------------------------------------ the pinned plate */}
          <div className="fpx-pin" aria-hidden="true">
            <div className="fpx-plate">
              {PROJECTS.map((p, i) => (
                <video
                  key={p.video}
                  className={`fpx-plate__video${i === active ? " is-current" : ""}`}
                  data-src={p.video}
                  data-poster={p.video.replace(/\.mp4$/, "-poster.webp")}
                  muted
                  loop
                  playsInline
                  preload="none"
                  tabIndex={-1}
                />
              ))}
            </div>

            {/* numeral + progress rail: where you are in the three */}
            <div className="fpx-rail">
              <p className="fpx-rail__count">
                <b>{pad(active + 1)}</b>
                <span>/ {pad(TOTAL)}</span>
              </p>
              <ol className="fpx-rail__ticks">
                {PROJECTS.map((p, i) => (
                  <li key={p.video} className={i === active ? "is-current" : i < active ? "is-past" : ""} />
                ))}
              </ol>
              <p className="fpx-rail__name">{PROJECTS[active].title}</p>
            </div>
          </div>

          {/* --------------------------------------------- the chapters */}
          <div className="fpx-chapters">
            {PROJECTS.map((p, i) => (
              <article
                key={p.video}
                className={`fpx-chapter${i === active ? " is-current" : ""}`}
                data-index={i}
              >
                {/* phones only: the chapter carries its own footage */}
                <div className="fpx-chapter__media" data-rvl="up">
                  <video
                    className="fpx-chapter__video"
                    data-src={p.video}
                    data-poster={p.video.replace(/\.mp4$/, "-poster.webp")}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </div>

                <div className="fpx-chapter__copy" data-rvl="up">
                  <p className="fpx-eyebrow">
                    <b>{pad(i + 1)}</b>
                    <span>{p.category}</span>
                  </p>
                  <h3 className="fpx-title">{p.title}</h3>
                  <p className="fpx-role">{p.role}</p>
                  <p className="fpx-body">{p.body}</p>

                  <dl className="fpx-results">
                    {p.results.map((r) => (
                      <div key={r.label}>
                        <dd>{r.value}</dd>
                        <dt>{r.label}</dt>
                      </div>
                    ))}
                  </dl>

                  <p className="fpx-tools">
                    <span className="fpx-tools__label">Built with</span>
                    {p.tools.map((t, k) => (
                      <span key={t}>
                        {k > 0 ? <i aria-hidden="true">·</i> : null}
                        {t}
                      </span>
                    ))}
                  </p>
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

const css = /* css */ `
.fpx { scroll-margin-top: 4rem; --fpx-tear-h: 320px; }

/* ------------------------------------------------------------- tear boundary */
/* both layers hang above the section's top edge, over the ledger's clearance
   (IntroStamp reserves the same height at its foot) */
.fpx-tearzone,
.fpx-tear {
  position: absolute;
  left: 0;
  width: 100%;
  height: var(--fpx-tear-h);
  top: calc(-1 * var(--fpx-tear-h));
  pointer-events: none;
}
.fpx-tearzone {
  z-index: 4;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(transparent, #000 42%);
  mask-image: linear-gradient(transparent, #000 42%);
}
.fpx-tearoil { z-index: 0; }
.fpx-tear { z-index: 5; display: block; }
.fpx.has-gl-tear .fpx-tear-fallback { display: none; }

/* ------------------------------------------------------------- crest head */
.fpx-crest {
  position: relative;
  z-index: 1;
  text-align: center;
  color: var(--ink);
  margin-bottom: clamp(2.6rem, 6vh, 4.5rem);
}
.fpx-crest .crest__laurel { color: var(--gold-deep); opacity: 1; }
.fpx-crest .crest__eyebrow { color: var(--ink-muted); }
.fpx-crest .crest__eyebrow span { color: var(--gold-deep); }

/* ------------------------------------------------------------- the story */
.fpx-story {
  position: relative;
  z-index: 2;
  width: min(1180px, 100%);
  margin: 0 auto;
}

/* ---- the pinned plate (story layout only) */
.fpx-pin {
  display: none;
}
.fpx-plate {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 6px;
  background: var(--parch-3);
  border: 1px solid var(--ink-line-soft);
  box-shadow:
    0 1px 2px rgba(16, 17, 44, 0.06),
    0 24px 48px -24px rgba(16, 17, 44, 0.28);
}
.fpx-plate__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 0.55s var(--ease), transform 0.9s var(--ease);
}
.fpx-plate__video.is-current {
  opacity: 1;
  transform: scale(1);
}

/* numeral + rail under the plate */
.fpx-rail {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 1.1rem;
  row-gap: 0.45rem;
  margin-top: 1.1rem;
  color: var(--ink);
}
.fpx-rail__count {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  font-family: var(--serif);
  font-weight: 500;
  font-size: 1.5rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.fpx-rail__count b { font-weight: 500; }
.fpx-rail__count span {
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: 0.1em;
  color: var(--ink-muted);
}
.fpx-rail__ticks {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.fpx-rail__ticks li {
  height: 2px;
  flex: 1 1 0;
  background: var(--ink-line);
  border-radius: 2px;
  transition: background 0.4s var(--ease);
}
.fpx-rail__ticks li.is-past { background: color-mix(in srgb, var(--ink) 45%, transparent); }
.fpx-rail__ticks li.is-current { background: var(--gold-deep); }
.fpx-rail__name {
  grid-column: 1 / -1;
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* ---- the chapters */
.fpx-chapters {
  display: grid;
  gap: clamp(2.6rem, 6vh, 4rem);
}
.fpx-chapter {
  transition: opacity 0.5s var(--ease);
}
.fpx-chapter__media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border-radius: 6px;
  background: var(--parch-3);
  border: 1px solid var(--ink-line-soft);
  margin-bottom: 1.2rem;
}
.fpx-chapter__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* reading order, top to bottom */
.fpx-eyebrow {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  font-family: var(--mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.fpx-eyebrow b {
  font-weight: 400;
  color: var(--gold-deep);
}
.fpx-title {
  margin-top: 0.7rem;
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(1.9rem, 1.2rem + 2vw, 2.9rem);
  line-height: 1.08;
  letter-spacing: -0.012em;
  color: var(--ink);
  text-wrap: balance;
}
.fpx-role {
  margin-top: 0.6rem;
  font-family: var(--sans);
  font-size: var(--fs-body-sm);
  color: var(--ink-muted);
}
.fpx-body {
  margin-top: 1.15rem;
  max-width: 56ch;
  font-family: var(--body);
  font-weight: 400;
  font-size: 1.08rem;
  line-height: 1.65;
  color: rgba(21, 23, 61, 0.86);
}

/* three results — number first, its label under it, one hairline above all */
.fpx-results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.2rem;
  margin: 1.6rem 0 0;
  padding-top: 1.2rem;
  border-top: 1px solid var(--ink-line);
}
.fpx-results > div {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.fpx-results dd {
  margin: 0;
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(1.35rem, 1rem + 0.9vw, 1.75rem);
  line-height: 1.1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.fpx-results dt {
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.45;
}

/* tools — one quiet line, not a row of boxes */
.fpx-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem 0;
  margin-top: 1.3rem;
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
}
.fpx-tools__label {
  margin-right: 0.9rem;
  color: var(--ink-muted);
}
.fpx-tools i {
  font-style: normal;
  margin: 0 0.55rem;
  color: var(--gold-deep);
}

/* ================================================== STORY LAYOUT (≥900px) */
@media (min-width: 900px) {
  .fpx-story {
    display: grid;
    grid-template-columns: minmax(0, 11fr) minmax(0, 10fr);
    column-gap: clamp(2.4rem, 5vw, 5.5rem);
    align-items: start;
  }
  .fpx-pin {
    display: block;
    position: sticky;
    top: clamp(5rem, 12vh, 7.5rem);
  }
  /* the chapters each get a screen's worth of runway so the plate holds on
     one project while its facts are read; the copy sits at the vertical
     centre, where the observer band is */
  .fpx-chapters {
    gap: 0;
  }
  .fpx-chapter {
    min-height: 78vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-block: clamp(1.5rem, 4vh, 3rem);
  }
  .fpx-chapter:first-child { padding-top: 0; min-height: 66vh; }
  .fpx-chapter:last-child { padding-bottom: 0; min-height: 60vh; }
  .fpx-chapter__media { display: none; }
  /* the chapters not being read recede; the current one is full strength */
  .fpx.is-story .fpx-chapter:not(.is-current) { opacity: 0.46; }
}

/* ------------------------------------------------------------- phones */
@media (max-width: 767.98px) {
  .fpx { scroll-margin-top: 3rem; --fpx-tear-h: 220px; }
  .fpx-crest { margin-bottom: 1.8rem; }
  .fpx-chapters { gap: 2.8rem; }
  .fpx-chapter__media { aspect-ratio: 4 / 3; margin-bottom: 1rem; }
  .fpx-title { font-size: clamp(1.55rem, 6.6vw, 1.95rem); }
  .fpx-body { font-size: 1rem; }
  .fpx-results { grid-template-columns: 1fr; gap: 0; padding-top: 0.2rem; }
  .fpx-results > div {
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid var(--ink-line-soft);
  }
  .fpx-results dd { font-size: 1.3rem; flex: none; }
  .fpx-results dt { text-align: right; }
  .fpx-tools {
    display: block;
    font-size: 0.64rem;
    line-height: 1.9;
  }
  .fpx-tools__label {
    display: block;
    margin: 0 0 0.1rem;
  }
}

/* ------------------------------------------------------- reduced motion */
@media (prefers-reduced-motion: reduce) {
  .fpx-plate__video,
  .fpx-chapter,
  .fpx-rail__ticks li {
    transition: none;
  }
  .fpx-plate__video { transform: none; }
  .fpx.is-story .fpx-chapter:not(.is-current) { opacity: 1; }
}
`;
