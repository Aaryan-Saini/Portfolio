"use client";

/* ============================================================================
   HonoursEditorial — "Marks of Recognition & honours".
   A prize register printed on the night sky: a star field over a bank of
   rose clouds in the site's dusk palette (honours-clouds-dusk.webp — the
   untouched honours-clouds.webp graded plum-black → berry → pale rose, stars
   kept white), FIXED to the viewport so the page scrolls over a stationary
   sky. The top edge mirrors the rose glow at the foot of the Experience
   stage above, so the two meet without a seam, and the foot fades into the
   tinted Resume paper below. That makes this an .edt-dark spread —
   paper-coloured type on the night.
   A laurel crest announces the section, then the four honours run as a React
   Bits <FlowingMenu/> — serif title rows whose hover reveals a flowing amber
   band alternating a terse mono tag with the honour's photographic pill.
   ========================================================================== */

import { useEffect, useRef } from "react";
import {
  Crest,
  Crosshair,
  useCharReveal,
} from "@/components/ui/editorial";
import FlowingMenu from "@/components/ui/FlowingMenu/FlowingMenu";
import { asset } from "@/lib/asset";

type Honour = {
  year: string;
  title: string;
  desc: string;
  tag: string;
  /** photo for this row's pill — public/honours/<name>-dusk.webp is the
      original graded into the dusk palette (the untouched <name>.webp stays) */
  photo: string;
  /** generated stand-in, painted under the photo until that file exists */
  plate: string;
};

/* ------------------------------------------------------------- plates */
/* Each honour's pill carries its own generated "photograph": a full-bleed
   SVG tile — gradient ground, one distinct motif, and a fractal-noise grain
   pass so it reads as imagery rather than flat colour. Data URIs, so the
   section needs no binary assets. The pill silhouette comes from
   .marquee__img's border-radius, so the artwork runs edge to edge. */
const plate = (body: string): string =>
  /* NB: encodeURIComponent leaves ' ( ) alone, and all three are fatal inside a
     CSS url() token — a paren from the SVG's own url(#id) refs closes the token
     early and the browser drops the entire declaration. Escape them here so the
     URI is safe in any context, quoted or not. */
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">${body}</svg>`
  )
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")}`;

/* shared film grain, layered last over every plate */
const GRAIN = `<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`;
const GRAIN_LAYER = `<rect width="200" height="80" filter="url(#gr)" opacity="0.15"/>`;

/* 01 — ridgeline at dawn: the hero's sky over the mountain plate, in miniature */
const PLATE_RIDGE = plate(
  `<defs>${GRAIN}<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f36"/><stop offset="0.45" stop-color="#9c6f93"/><stop offset="0.68" stop-color="#e7bfc9"/><stop offset="0.86" stop-color="#fdb77a"/><stop offset="1" stop-color="#c4553a"/></linearGradient></defs>` +
    `<rect width="200" height="80" fill="url(#a)"/>` +
    `<circle cx="152" cy="50" r="12" fill="#fff1e2" opacity="0.85"/>` +
    `<path d="M0 60 L34 36 L58 52 L88 28 L118 56 L148 38 L200 64 L200 80 L0 80 Z" fill="#2e1a2a" opacity="0.95"/>` +
    `<path d="M0 71 L28 55 L62 69 L98 51 L134 71 L172 57 L200 73 L200 80 L0 80 Z" fill="#140c14"/>` +
    GRAIN_LAYER
);

/* 02 — circuit trace: nodes and rails, for the AI/ML placing */
const PLATE_CIRCUIT = plate(
  `<defs>${GRAIN}<linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1c28"/><stop offset="1" stop-color="#150f16"/></linearGradient></defs>` +
    `<rect width="200" height="80" fill="url(#a)"/>` +
    `<g stroke="#efa2b6" stroke-opacity="0.22" stroke-width="1"><path d="M0 20H200M0 40H200M0 60H200"/><path d="M25 0V80M50 0V80M75 0V80M100 0V80M125 0V80M150 0V80M175 0V80"/></g>` +
    `<g fill="none" stroke="#efa2b6" stroke-opacity="0.8" stroke-width="1.8"><path d="M25 60H75V40h50V20h50"/><path d="M0 40h50v20h50V40h50v20h50"/></g>` +
    `<g fill="#fff1e2"><circle cx="75" cy="40" r="3.2"/><circle cx="125" cy="20" r="3.2"/><circle cx="50" cy="60" r="2.6"/><circle cx="150" cy="60" r="2.6"/><circle cx="100" cy="40" r="2.6"/></g>` +
    GRAIN_LAYER
);

/* 03 — contour swell: stacked topographic lines, for the hackathon run */
const PLATE_CONTOUR = plate(
  `<defs>${GRAIN}<linearGradient id="a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e1520"/><stop offset="0.5" stop-color="#3a2440"/><stop offset="1" stop-color="#1e1520"/></linearGradient></defs>` +
    `<rect width="200" height="80" fill="url(#a)"/>` +
    `<g fill="none" stroke="#efa2b6" stroke-width="1.5">` +
    `<path d="M-10 18Q25 4 60 18T130 18T210 18" stroke-opacity="0.5"/>` +
    `<path d="M-10 32Q25 18 60 32T130 32T210 32" stroke-opacity="0.72"/>` +
    `<path d="M-10 46Q25 32 60 46T130 46T210 46" stroke-opacity="0.9"/>` +
    `<path d="M-10 60Q25 46 60 60T130 60T210 60" stroke-opacity="0.6"/>` +
    `<path d="M-10 74Q25 60 60 74T130 74T210 74" stroke-opacity="0.34"/>` +
    `</g>` +
    GRAIN_LAYER
);

/* 04 — constellation bloom: a lit cluster, for the community entry */
const PLATE_BLOOM = plate(
  `<defs>${GRAIN}<radialGradient id="a" cx="0.34" cy="0.42" r="0.8"><stop offset="0" stop-color="#c4553a"/><stop offset="0.55" stop-color="#3a1f36"/><stop offset="1" stop-color="#150f16"/></radialGradient></defs>` +
    `<rect width="200" height="80" fill="url(#a)"/>` +
    `<circle cx="68" cy="34" r="22" fill="#efa2b6" opacity="0.18"/>` +
    `<circle cx="68" cy="34" r="9" fill="#fff1e2" opacity="0.5"/>` +
    `<g fill="#fff1e2"><circle cx="20" cy="16" r="1.7" opacity="0.9"/><circle cx="44" cy="58" r="1.3" opacity="0.7"/><circle cx="96" cy="18" r="1.9" opacity="0.85"/><circle cx="118" cy="52" r="1.4" opacity="0.75"/><circle cx="142" cy="28" r="2.1" opacity="0.9"/><circle cx="166" cy="62" r="1.5" opacity="0.7"/><circle cx="184" cy="22" r="1.2" opacity="0.6"/><circle cx="32" cy="40" r="1.1" opacity="0.55"/></g>` +
    `<g stroke="#efa2b6" stroke-opacity="0.4" stroke-width="0.8" fill="none"><path d="M20 16L68 34L96 18M68 34L118 52L142 28L166 62"/></g>` +
    GRAIN_LAYER
);

const HONOURS: Honour[] = [
  {
    year: "2024",
    title: "50% Merit Scholarship",
    desc: "Poornima University — Merit-based undergraduate scholarship for academic excellence.",
    tag: "50% Scholarship",
    photo: "/honours/scholarship-dusk.webp",
    plate: PLATE_RIDGE,
  },
  {
    year: "2024",
    title: "Top 10 · Prayogam",
    desc: "Inter-University AI/ML competition — top 10 rank for Diabetic Retinopathy project.",
    tag: "Top 10 · Prayogam",
    photo: "/honours/prayogam-dusk.webp",
    plate: PLATE_CIRCUIT,
  },
  {
    year: "2024",
    title: "Top 50 · Hack2Skill",
    desc: "National-level hackathon — top 50 finish among hundreds of competing teams.",
    tag: "Top 50 · Hack2Skill",
    photo: "/honours/hack2skill-dusk.webp",
    plate: PLATE_CONTOUR,
  },
  {
    year: "2023",
    title: "Google GDG Participant",
    desc: "Google Solution Challenge — participant with GDG campus community.",
    tag: "Google GDG",
    photo: "/honours/gdg-dusk.webp",
    plate: PLATE_BLOOM,
  },
];

/* The band carries the short tag only — the full citation lives in the
   screen-reader list below rather than scrolling past at reading speed.
   Pill art is layered [photo, plate]: once a file lands in public/honours/
   it paints over its stand-in with no code change; until then the 404s
   silently fall through to the generated plate. */
const FLOW_ITEMS = HONOURS.map((h) => ({
  link: "#certifications",
  text: h.title,
  marqueeText: h.tag,
  image: [asset(h.photo), h.plate],
}));

export default function HonoursEditorial() {
  const rootRef = useRef<HTMLElement>(null);

  /* crest display title — shared per-character blur reveal */
  useCharReveal(rootRef, ".hnx-crest .crest__title");

  /* the sky photograph (115 KB) is attached only once the section is within
     two viewports — about what a fast Lenis flick covers — via the .hnx-near
     class (see css); until then the edge blends sit on the .edt-dark ground */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("hnx-near");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add("hnx-near");
        io.disconnect();
      },
      { rootMargin: "200% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="certifications"
      className="edt-dark edt-section hnx-root"
      ref={rootRef}
    >
      <div className="edt-rules hnx-rules" aria-hidden="true" />

      {/* corner register marks */}
      <Crosshair className="hnx-xhair hnx-xhair--tl" />
      <Crosshair className="hnx-xhair hnx-xhair--br" />

      <div className="edt-inner hnx-inner">
        {/* ------------------------------------------------------- crest */}
        {/* title entrance owned by the char reveal — no data-rvl (double-anim) */}
        <div className="hnx-crest">
          <Crest eyebrow="MARKS OF">
            Recognition <em>&amp; Honours</em>
          </Crest>
        </div>

        {/* -------------------------------------- flowing prize register */}
        <div className="hnx-flow" data-rvl="fade">
          <FlowingMenu
            items={FLOW_ITEMS}
            speed={18}
            textColor="var(--fg)"
            bgColor="transparent"
            marqueeBgColor="var(--gold)"
            marqueeTextColor="var(--ink)"
            borderColor="var(--line)"
          />
        </div>
        {/* phones: the hover-driven band never opens on touch, so the four
            honours print as a plain register — photo, year, title, citation.
            display:none on desktop (the flowing menu carries them there). */}
        <ol className="hnx-list" data-rvl="up">
          {HONOURS.map((h) => (
            <li className="hnx-item" key={h.title}>
              <span
                className="hnx-item__pic"
                style={{
                  backgroundImage: `url("${asset(h.photo)}"), url("${h.plate}")`,
                }}
                aria-hidden="true"
              />
              <div className="hnx-item__body">
                <span className="hnx-item__year">{h.year}</span>
                <h3 className="hnx-item__title">{h.title}</h3>
                <p className="hnx-item__desc">{h.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* screen-reader fallback — hover-only marquee hides the citations */}
        <ul className="sr-only hnx-srlist">
          {HONOURS.map((h) => (
            <li key={h.title}>
              {h.year} — {h.title}. {h.desc}
            </li>
          ))}
        </ul>

      </div>

      <style>{css}</style>
    </section>
  );
}

const css = /* css */ `
.hnx-root {
  /* no overflow hidden — the torn edge must poke above the section */
  /* edge blends, scrolling with the section, top to bottom:
     · the Experience stage's foot, mirrored — its rose-magenta glow (same
       stops, same 130% × 70vh ellipse, centre 10vh past the edge) over its
       #4a1839 plum, so both sides of the seam are the same colour, fading
       into the sky by ~60vh
     · a short fade into the Resume paper's --night at the foot */
  --hnx-edges:
    radial-gradient(130% 70vh at 50% -10vh, rgba(232, 70, 150, 0.62) 0%, rgba(239, 130, 170, 0.3) 32%, rgba(154, 117, 173, 0.12) 54%, transparent 74%),
    linear-gradient(180deg, #4a1839 0, rgba(61, 22, 54, 0.9) 14vh, rgba(41, 20, 47, 0.5) 34vh, rgba(29, 17, 36, 0) 60vh),
    linear-gradient(0deg, var(--night) 0, rgba(26, 16, 32, 0) 16vh);
  background-image: var(--hnx-edges);
  background-size: 100% 100%, 100% 100%, 100% 100%, cover;
  background-position: 0 0, 0 0, 0 0, center 62%;
  background-repeat: no-repeat;
  background-attachment: scroll, scroll, scroll, fixed;
}
/* the sky photograph is attached only once the section is within two
   viewports (IntersectionObserver in the component); composed here so
   asset() gets the basePath. Fixed, so the page scrolls over a still sky. */
.hnx-root.hnx-near {
  background-image: var(--hnx-edges), url("${asset("/honours-clouds-dusk.webp")}");
}
/* touch / narrow viewports: iOS ignores fixed attachment and repaints cost —
   let the sky scroll with the section instead */
@media (max-width: 1023.5px), (hover: none) {
  .hnx-root {
    background-attachment: scroll;
  }
}
.hnx-inner {
  width: 100%;
}

/* ---------------------------------------------------------------- crest */
/* laurels lifted to the brighter cyan so they hold against the sky */
.hnx-crest .crest__laurel {
  color: var(--gold);
  opacity: 1;
}

/* -------------------------------------------- flowing prize register */
.hnx-flow {
  position: relative;
  height: clamp(340px, 58vh, 520px);
  margin-top: clamp(3rem, 7vw, 5.5rem);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
/* editorial retheme of the React Bits menu: serif rows, mixed case */
.hnx-flow .menu__item-link {
  font-family: var(--serif);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.01em;
  font-size: clamp(1.5rem, 4.6vh, 2.7rem);
  transition: font-style 0s, letter-spacing 0.3s var(--ease);
}
.hnx-flow .menu__item-link:hover {
  font-style: italic;
}
/* the flowing band: the hero's rose sky band (pale rose → rose → berry-rose) laid
   over the solid --gold the menu component sets as its background colour */
.hnx-flow .marquee {
  background-image: linear-gradient(100deg, var(--gold-soft) 0%, var(--gold) 48%, #d9728f 100%);
}
/* terse mono stamp alternating with photographic pills */
.hnx-flow .marquee span {
  font-family: var(--mono);
  font-style: normal;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: clamp(0.82rem, 2.1vh, 1.05rem);
  padding: 0 1.9vw;
}
/* pill: the photograph itself, clipped to a bare capsule — no ring, no
   shadow, so it sits flush in the band the way the reference does */
.hnx-flow .marquee__img {
  width: clamp(150px, 15vw, 210px);
  height: clamp(52px, 8.4vh, 76px);
  margin: 0 1.9vw;
  padding: 0;
  border-radius: 999px;
  box-shadow: none;
}

/* ------------------------------------------------------- corner marks */
.hnx-xhair--tl {
  top: clamp(3.6rem, 6vw, 4.6rem);
  left: clamp(1.1rem, 3vw, 2.6rem);
}
.hnx-xhair--br {
  bottom: clamp(1.1rem, 3vw, 2.6rem);
  right: clamp(1.1rem, 3vw, 2.6rem);
}

/* ----------------------------------------------------------- responsive */
@media (max-width: 900px) {
  .hnx-rules {
    display: none;
  }
}
.hnx-list {
  display: none;
}

/* ----------------------------------------------------------------- MOBILE
   The flowing menu is hover-only, so phones get the plain register instead:
   photo pill, year, title and the full citation, on a frosted ink panel so
   the type holds against the clouds. */
@media (max-width: 767.98px) {
  .hnx-flow,
  .hnx-srlist {
    display: none;
  }
  .hnx-list {
    display: grid;
    margin-top: 1.9rem;
    padding: 0.2rem 0.95rem;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(21, 15, 22, 0.42), rgba(21, 15, 22, 0.62));
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .hnx-item {
    display: grid;
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 0.95rem;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--line);
  }
  .hnx-item:last-child {
    border-bottom: 0;
  }
  .hnx-item__pic {
    display: block;
    width: 78px;
    height: 78px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 20px rgba(12, 8, 12, 0.45);
  }
  .hnx-item__year {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.16em;
    color: var(--gold);
  }
  .hnx-item__title {
    margin-top: 0.15rem;
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(1.3rem, 5.6vw, 1.55rem);
    line-height: 1.12;
    color: var(--parch);
  }
  .hnx-item__desc {
    margin-top: 0.35rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.78);
  }
}
`;
