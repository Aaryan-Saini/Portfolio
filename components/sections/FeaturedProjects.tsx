"use client";

/* ============================================================================
   FEATURED PROJECTS — the road so far (id="work").

   A roadmap: a road winds down the section and each project is a stop on it,
   in the order it was built, labelled with its stage and year. The road's
   centre line lights up as you scroll (a glowing marker rides its head), and
   each stop's card comes up to full strength the moment the light reaches
   its milestone — scrolling back up dims them again. The footage of the stop
   the light last reached is the one that plays.

   The road is one SVG path drawn through the milestone nodes themselves (it
   is laid out from their real positions, so it always passes through them
   whatever the card heights), with a lookup table mapping scroll depth to
   distance along the path.

   Desktop: cards alternate left and right of the road, which weaves toward
   each card. Phones: the road runs down the left edge, cards to its right.
   Reduced motion: the road is fully lit and every card is shown; no autoplay.

   The torn-paper boundary in from the hero lives in the hero itself
   (components/sections/Hero.tsx); the one out, into Sneak Peek, is Sneak
   Peek's own paper tearing up into the glow at the foot of this section
   (components/sections/WorksMarquee.tsx) — hence the tall bottom padding.
   ========================================================================== */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Crest, useCharReveal } from "@/components/ui/editorial";
import { asset } from "@/lib/asset";
import { whenUnlocked } from "@/lib/gl";
import { subscribeScroll } from "@/lib/lenis";

type Result = { value: string; label: string };

type Project = {
  year: string;
  category: string;
  title: string;
  role: string;
  body: string;
  results: [Result, Result, Result];
  tools: string[];
  video: string;
};

/* in the order they were built — the road runs through them top to bottom */
const PROJECTS: Project[] = [
  {
    year: "2025",
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
  {
    year: "2026",
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
    year: "2026",
    category: "Chrome extension · Browser internals",
    title: "Compartment — Container Tabs",
    role: "Independent project · Chrome extension, Manifest V3 · 2026",
    body: "Container tabs for Chrome, which has no container API. Every container is its own cookie jar and web storage, so one window can be signed in to the same site as several people at once. Cookies are routed per tab with declarativeNetRequest session rules, read back off responses, and namespaced by a main-world storage shim.",
    results: [
      { value: "40+", label: "Adversarial QA scenarios" },
      { value: "4", label: "Tab markers, each switchable" },
      { value: "116+", label: "Chrome, no build step" },
    ],
    tools: ["JavaScript", "Manifest V3", "declarativeNetRequest", "webRequest"],
    video: asset("/videos/compartment.mp4"),
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

/* phones / narrow windows: the road runs down the left edge */
const NARROW_MQ = "(max-width: 899.98px)";
/* the "reading line": the road is lit down to this height of the viewport */
const READ_AT = 0.62;

export default function FeaturedProjects() {
  const rootRef = useRef<HTMLElement | null>(null);
  const routeRef = useRef<HTMLDivElement | null>(null);
  /* the stop the light last reached (-1: none yet) — its footage plays */
  const [current, setCurrent] = useState(-1);
  /* the section is within one viewport of the screen — only then do the
     videos get their sources */
  const [near, setNear] = useState(false);

  useCharReveal(rootRef, ".fpx-crest .crest__title");

  /* ---- the road: laid out through the milestone nodes, lit by scroll */
  useEffect(() => {
    const route = routeRef.current;
    if (!route) return;
    const svg = route.querySelector<SVGSVGElement>(".fpx-road");
    const lits = Array.from(route.querySelectorAll<SVGPathElement>(".fpx-road__lit"));
    const lit = lits[lits.length - 1];
    const car = route.querySelector<SVGGElement>(".fpx-road__car");
    if (!svg || !lit || !car) return;
    const setLit = (prop: "strokeDasharray" | "strokeDashoffset", v: string) =>
      lits.forEach((l) => (l.style[prop] = v));
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>(".fpx-road__p"));
    const stops = Array.from(route.querySelectorAll<HTMLElement>(".fpx-stop"));
    const narrow = window.matchMedia(NARROW_MQ);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let total = 0;
    let lut: { len: number; y: number }[] = [];
    let nodeLen: number[] = [];
    let lastLit = -1;
    let lastCur = -2;
    let raf = 0;

    /* distance along the road at which it reaches height y (the path only
       ever runs downward, so y is monotonic in length) */
    const lenAtY = (y: number) => {
      if (!lut.length || y <= lut[0].y) return 0;
      for (let i = 1; i < lut.length; i++) {
        if (lut[i].y >= y) {
          const a = lut[i - 1];
          const b = lut[i];
          return a.len + (b.len - a.len) * ((y - a.y) / Math.max(1e-6, b.y - a.y));
        }
      }
      return total;
    };

    const update = () => {
      raf = 0;
      if (!total) return;
      const rr = route.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rr.bottom < -vh || rr.top > 2 * vh) return; // far off screen
      const litLen = reduce ? total : Math.max(0, Math.min(total, lenAtY(vh * READ_AT - rr.top)));
      if (Math.abs(litLen - lastLit) > 0.4) {
        lastLit = litLen;
        setLit("strokeDashoffset", (total - litLen).toFixed(1));
        const pt = lit.getPointAtLength(litLen);
        car.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      }
      let cur = -1;
      stops.forEach((s, i) => {
        const reached = litLen >= nodeLen[i] - 1;
        if (s.classList.contains("is-reached") !== reached) s.classList.toggle("is-reached", reached);
        if (reached) cur = i;
      });
      if (cur !== lastCur) {
        lastCur = cur;
        stops.forEach((s, i) => s.classList.toggle("is-current", i === cur));
        setCurrent(cur);
      }
    };
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const layout = () => {
      const W = route.clientWidth;
      const H = route.clientHeight;
      if (!W || !H || !stops.length) return;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const rr = route.getBoundingClientRect();
      const pts = stops.map((s) => {
        const n = s.querySelector(".fpx-node")!.getBoundingClientRect();
        return { x: n.left + n.width / 2 - rr.left, y: n.top + n.height / 2 - rr.top };
      });
      const sx = narrow.matches ? pts[0].x : W / 2;
      const ex = narrow.matches ? pts[pts.length - 1].x : W / 2;
      const all = [{ x: sx, y: 0 }, ...pts, { x: ex, y: H }];
      let d = `M${all[0].x.toFixed(1)} 0`;
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1];
        const b = all[i];
        const dy = (b.y - a.y) * 0.5;
        d += `C${a.x.toFixed(1)} ${(a.y + dy).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - dy).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      paths.forEach((p) => p.setAttribute("d", d));
      lits.forEach((l) => l.setAttribute("d", d));
      total = lit.getTotalLength();
      setLit("strokeDasharray", `${total.toFixed(1)} ${total.toFixed(1)}`);
      lut = [];
      const N = 240;
      for (let i = 0; i <= N; i++) {
        const len = (total * i) / N;
        lut.push({ len, y: lit.getPointAtLength(len).y });
      }
      nodeLen = pts.map((p) => lenAtY(p.y));
      lastLit = -1;
      lastCur = -2;
      update();
    };

    layout();
    route.classList.add("is-live");
    const ro = new ResizeObserver(() => layout());
    ro.observe(route);
    narrow.addEventListener("change", layout);
    document.fonts?.ready.then(() => layout());
    const offScroll = subscribeScroll(tick);
    window.addEventListener("resize", tick);
    return () => {
      ro.disconnect();
      narrow.removeEventListener("change", layout);
      offScroll();
      window.removeEventListener("resize", tick);
      if (raf) cancelAnimationFrame(raf);
      route.classList.remove("is-live");
    };
  }, []);

  /* ---- footage sources are attached only once the section is within one
     viewport, and never during the boot — nothing can approach the viewport
     while scroll is locked behind the loader */
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !near) return;
    root.querySelectorAll<HTMLVideoElement>(".fpx-video").forEach((v) => {
      if (v.src || !v.dataset.src) return;
      v.preload = "metadata";
      if (v.dataset.poster) v.poster = v.dataset.poster;
      v.src = v.dataset.src; // assigning src runs the load algorithm
    });
  }, [near]);

  /* ---- only the footage of the stop the light last reached plays */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !near) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll<HTMLVideoElement>(".fpx-video").forEach((v, i) => {
      if (!reduce && i === current) v.play().catch(() => {});
      else v.pause();
    });
  }, [near, current]);

  return (
    <section id="work" ref={rootRef} className="fpx edt-paper">
      {/* the dusk glow, held behind the whole road (same as the dossier) */}
      <div className="fpx-glow" aria-hidden="true" />

      <div className="fpx-inner">
        <div className="fpx-crest">
          <Crest eyebrow="THE ROAD SO FAR">
            Featured <em>Projects</em>
          </Crest>
          <p className="fpx-lede">Every stop is a project — and the stage I built it at.</p>
        </div>

        <div className="fpx-route" ref={routeRef}>
          <svg className="fpx-road" aria-hidden="true" focusable="false">
            <defs>
              <filter id="fpx-glow-f" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path className="fpx-road__p fpx-road__rim" />
            <path className="fpx-road__p fpx-road__bed" />
            <path className="fpx-road__p fpx-road__dash" />
            {/* the lit centre line and its soft glow (a wider translucent stroke
                rather than an SVG filter: a filter region is sized from the
                path's bounding box, which is zero-wide on the phones' straight
                road and would clip it away) */}
            <path className="fpx-road__lit fpx-road__lit--glow" />
            <path className="fpx-road__lit" />
            <g className="fpx-road__car">
              <circle r="17" className="fpx-road__halo" />
              <circle r="6.5" className="fpx-road__dot" filter="url(#fpx-glow-f)" />
            </g>
          </svg>

          <p className="fpx-sign fpx-sign--start" aria-hidden="true">
            Start
          </p>

          <ol className="fpx-stops">
            {PROJECTS.map((p, i) => (
              <li
                key={p.video}
                className={`fpx-stop ${i % 2 === 0 ? "fpx-stop--l" : "fpx-stop--r"}`}
                style={{ "--i": i } as CSSProperties}
              >
                <span className="fpx-node" aria-hidden="true">
                  {pad(i + 1)}
                </span>

                <article className="fpx-card" aria-label={`Stage ${i + 1}, ${p.year}: ${p.title}`}>
                  <div className="fpx-media">
                    <video
                      className="fpx-video"
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
                  <div className="fpx-cardbody">
                    <p className="fpx-stage">
                      <span className="fpx-stage__dot" aria-hidden="true" />
                      Stage {pad(i + 1)} · {p.year}
                    </p>
                    <p className="fpx-cat">{p.category}</p>
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
                    <ul className="fpx-tools" aria-label="Built with">
                      {p.tools.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            ))}
          </ol>

          <p className="fpx-sign fpx-sign--end" aria-hidden="true">
            The road continues
          </p>
        </div>
      </div>

      <style>{css}</style>
    </section>
  );
}

const css = /* css */ `
/* ---------------------------------------------------------------- section */
.fpx {
  --road-w: 34px;
  --road-x: 50%;
  position: relative;
  scroll-margin-top: 4rem;
  /* the clearance Sneak Peek's torn strip hangs up into (--wmx-tear-h there:
     320px, 220px on phones) — nothing of this section sits under its reach */
  padding: 0 0 calc(320px + 2rem);
}
/* the dusk glow behind the road: a viewport-tall backdrop that stays put
   (sticky) while the stops scroll over it */
.fpx-glow {
  position: sticky;
  top: 0;
  z-index: 0;
  height: 100vh;
  height: 100lvh;
  margin-bottom: -100vh;
  margin-bottom: -100lvh;
  background: var(--dusk-stage);
  opacity: 0.8;
  pointer-events: none;
}
/* a rose sky at the foot of the section, fixed to it (not the viewport): the
   sky Sneak Peek's torn paper rises into, so the tear always reads as a dark
   ragged silhouette against the glow — the way the hero ends */
.fpx::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  height: 85vh;
  background:
    radial-gradient(130% 75% at 50% 100%, rgba(232, 70, 150, 0.62) 0%, rgba(239, 130, 170, 0.3) 34%, rgba(154, 117, 173, 0.1) 58%, transparent 78%),
    linear-gradient(180deg, transparent 0%, rgba(74, 24, 57, 0.55) 100%);
  pointer-events: none;
}
.fpx-inner {
  position: relative;
  z-index: 1;
  width: min(1240px, 100% - 2 * var(--pad));
  margin: 0 auto;
  padding-top: clamp(2.8rem, 6vw, 5rem);
}

/* ------------------------------------------------------------- crest head */
.fpx-crest {
  text-align: center;
  margin-bottom: clamp(1.2rem, 3vh, 2rem);
}
.fpx-crest .crest__laurel { color: var(--gold); opacity: 1; }
.fpx-crest .crest__eyebrow span { color: var(--gold); }
.fpx-lede {
  margin: clamp(0.9rem, 2vh, 1.3rem) auto 0;
  font: 400 0.72rem / 1.5 var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

/* -------------------------------------------------------------- the route */
.fpx-route {
  position: relative;
  padding: clamp(90px, 12vh, 130px) 0 clamp(110px, 15vh, 160px);
}
.fpx-road {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.fpx-road path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* the road: a dark asphalt bed with a faint rose rim, a dashed centre line */
.fpx-road__rim {
  stroke: rgba(239, 162, 182, 0.22);
  stroke-width: calc(var(--road-w) + 4px);
}
.fpx-road__bed {
  stroke: #120b16;
  stroke-width: var(--road-w);
}
.fpx-road__dash {
  stroke: rgba(248, 244, 236, 0.26);
  stroke-width: 2px;
  stroke-dasharray: 12 14;
}
/* the distance travelled: the centre line lit rose, down to the reading line */
.fpx-road__lit {
  stroke: var(--gold);
  stroke-width: 4px;
  visibility: hidden;
}
.fpx-road__lit--glow {
  stroke: rgba(239, 162, 182, 0.28);
  stroke-width: 14px;
}
.fpx-road__car {
  visibility: hidden;
}
.fpx-route.is-live .fpx-road__lit,
.fpx-route.is-live .fpx-road__car {
  visibility: visible;
}
.fpx-road__halo {
  fill: rgba(239, 162, 182, 0.2);
  stroke: rgba(239, 162, 182, 0.55);
  stroke-width: 1px;
}
.fpx-road__dot {
  fill: #fff0f4;
}

/* road signs at either end */
.fpx-sign {
  position: absolute;
  left: var(--road-x);
  z-index: 1;
  margin: 0;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #1a1020;
  border: 1px solid rgba(239, 162, 182, 0.35);
  font: 400 0.62rem / 1 var(--mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  white-space: nowrap;
  transform: translate(-50%, -50%);
}
.fpx-sign--start {
  top: 0;
}
.fpx-sign--end {
  top: 100%;
  color: var(--muted);
}

/* -------------------------------------------------------------- the stops */
.fpx-stops {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;
  list-style: none;
}
.fpx-stop {
  --side: -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px minmax(0, 1fr);
  align-items: center;
}
.fpx-stop--r {
  --side: 1;
}
.fpx-stop + .fpx-stop {
  margin-top: clamp(4rem, 14vh, 9rem);
}

/* the milestone on the road — the road is laid out through its centre */
.fpx-node {
  position: relative;
  grid-row: 1;
  grid-column: 2;
  justify-self: center;
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  translate: calc(var(--side) * 46px) 0;
  background: #1a1020;
  border: 2px solid rgba(239, 162, 182, 0.35);
  font: 700 0.78rem / 1 var(--mono);
  letter-spacing: 0.04em;
  color: var(--muted);
  transition: background 0.5s var(--ease), color 0.5s var(--ease), border-color 0.5s var(--ease), box-shadow 0.5s var(--ease);
}
/* a short arm from the milestone to its card */
.fpx-node::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 26px;
  height: 1px;
  background: rgba(239, 162, 182, 0.4);
}
.fpx-stop--l .fpx-node::after { right: 100%; }
.fpx-stop--r .fpx-node::after { left: 100%; }
.fpx-stop.is-reached .fpx-node {
  background: linear-gradient(150deg, #f7cfd9, #efa2b6 55%, #d9728f);
  border-color: #f7cfd9;
  color: #2a1020;
  box-shadow: 0 0 0 6px rgba(239, 162, 182, 0.14), 0 0 26px rgba(239, 162, 182, 0.55);
}
.fpx-stop.is-current .fpx-node {
  animation: fpx-pulse 2.2s ease-out infinite;
}
@keyframes fpx-pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 162, 182, 0.45), 0 0 26px rgba(239, 162, 182, 0.55); }
  70% { box-shadow: 0 0 0 16px rgba(239, 162, 182, 0), 0 0 26px rgba(239, 162, 182, 0.55); }
  100% { box-shadow: 0 0 0 0 rgba(239, 162, 182, 0), 0 0 26px rgba(239, 162, 182, 0.55); }
}

/* ------------------------------------------------------------- the card */
.fpx-card {
  grid-row: 1;
  width: 100%;
  max-width: 540px;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025) 60%);
  border: 1px solid rgba(239, 162, 182, 0.14);
  box-shadow: 0 30px 60px -24px rgba(0, 0, 0, 0.65);
  opacity: 0.4;
  transform: translateY(18px) scale(0.985);
  transition: opacity 0.7s var(--ease), transform 0.7s var(--ease), border-color 0.7s var(--ease), box-shadow 0.7s var(--ease);
}
.fpx-stop--l .fpx-card { grid-column: 1; justify-self: end; }
.fpx-stop--r .fpx-card { grid-column: 3; justify-self: start; }
.fpx-stop.is-reached .fpx-card {
  opacity: 1;
  transform: none;
  border-color: rgba(239, 162, 182, 0.34);
  box-shadow: 0 30px 60px -24px rgba(0, 0, 0, 0.65), 0 20px 70px -30px rgba(222, 60, 140, 0.45);
}

.fpx-media {
  position: relative;
  aspect-ratio: 16 / 10;
  margin: 12px 12px 0;
  border-radius: 12px;
  overflow: hidden;
  background: #120b16;
}
.fpx-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.5) brightness(0.72);
  transition: filter 0.7s var(--ease);
}
.fpx-stop.is-reached .fpx-video {
  filter: none;
}

.fpx-cardbody {
  padding: clamp(1.1rem, 2vw, 1.5rem) clamp(1.2rem, 2.2vw, 1.7rem) clamp(1.3rem, 2.2vw, 1.7rem);
}
.fpx-stage {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(239, 162, 182, 0.1);
  border: 1px solid rgba(239, 162, 182, 0.3);
  font: 700 0.62rem / 1 var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold);
}
.fpx-stage__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 8px var(--gold);
}
.fpx-cat {
  margin: 0.9rem 0 0;
  font: 400 0.62rem / 1.5 var(--mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.fpx-title {
  margin: 0.35rem 0 0;
  font: 600 clamp(1.35rem, 1rem + 1vw, 1.8rem) / 1.15 var(--sans);
  letter-spacing: -0.02em;
  color: var(--fg);
  text-wrap: balance;
}
.fpx-role {
  margin: 0.45rem 0 0;
  font: 400 0.8rem / 1.5 var(--body);
  color: var(--muted);
}
.fpx-body {
  margin: 0.9rem 0 0;
  font: 300 clamp(0.9rem, 0.86rem + 0.15vw, 0.98rem) / 1.62 var(--body);
  color: color-mix(in srgb, var(--fg) 80%, transparent);
  text-wrap: pretty;
}
.fpx-results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1.1rem 0 0;
}
.fpx-results > div {
  padding: 0.7rem 0.75rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.fpx-results dd {
  margin: 0;
  font: 600 clamp(1.15rem, 0.95rem + 0.6vw, 1.45rem) / 1 var(--sans);
  letter-spacing: -0.02em;
  color: var(--gold);
}
.fpx-results dt {
  margin-top: 0.4rem;
  font: 400 0.56rem / 1.35 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.fpx-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}
.fpx-tools li {
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  background: rgba(239, 162, 182, 0.07);
  border: 1px solid rgba(239, 162, 182, 0.2);
  font: 400 0.6rem / 1 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--fg) 82%, transparent);
}

/* ------------------------------------------------------------- phones */
@media (max-width: 899.98px) {
  .fpx {
    --road-w: 22px;
    --road-x: 22px;
  }
  .fpx-stop,
  .fpx-stop--r {
    --side: 0;
    grid-template-columns: 44px minmax(0, 1fr);
    column-gap: 14px;
    align-items: start;
  }
  .fpx-node {
    grid-column: 1;
    margin-top: 22px;
    width: 40px;
    height: 40px;
    font-size: 0.68rem;
  }
  .fpx-stop--l .fpx-node::after,
  .fpx-stop--r .fpx-node::after {
    right: auto;
    left: 100%;
    width: 14px;
  }
  .fpx-stop--l .fpx-card,
  .fpx-stop--r .fpx-card {
    grid-column: 2;
    justify-self: stretch;
    max-width: none;
  }
  .fpx-stop + .fpx-stop {
    margin-top: 3rem;
  }
  .fpx-sign {
    transform: translate(-22px, -50%);
  }
}
@media (max-width: 767.98px) {
  .fpx {
    padding-bottom: calc(220px + 1.5rem);
  }
}

/* ------------------------------------------------ reduced motion / no JS */
@media (prefers-reduced-motion: reduce) {
  .fpx-card,
  .fpx-node,
  .fpx-video {
    transition: none;
  }
  .fpx-stop.is-current .fpx-node {
    animation: none;
  }
}
html.no-js .fpx-card {
  opacity: 1;
  transform: none;
}
html.no-js .fpx-video {
  filter: none;
}
`;
