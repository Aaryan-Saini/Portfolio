"use client";

/* ============================================================================
   IntroStamp — postage-stamp portrait-object on the dark ledger surface,
   followed by the "Quality, as I see it" credo. No anchor — the hero
   statement section owns #about.

   The count-up stats strip (internships / followers / bugs caught / platforms)
   that used to sit under the stamp was replaced by the credo, which was
   previously its own paper section (PhilosophyPaper).
   ========================================================================== */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset } from "@/lib/asset";
import { BugDoodle, Crosshair, SpinBadge } from "@/components/ui/editorial";
import QualityCredo from "@/components/sections/PhilosophyPaper";

/* ---------------------------------------------------------------- component */
export default function IntroStamp() {
  const rootRef = useRef<HTMLElement>(null);

  /* stamp + badge entrances — reference exact:
     hero image scale 1.3→1 spring(200,40,1) ≈ 1.1s power2.out;
     badge opacity .001 / y:40 / skewX:6deg → 0.8s tween,
     ease cubic-bezier(0.44,0,0.56,1) ≈ power1.inOut. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ix-stampbox",
        { scale: 1.15, opacity: 1 },
        {
          scale: 1,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".ix-stampbox", start: "top 85%", once: true },
        }
      );
      gsap.fromTo(
        ".ix-badge",
        { opacity: 0.001, y: 40, skewX: 6 },
        {
          opacity: 1,
          y: 0,
          skewX: 0,
          duration: 0.8,
          ease: "power1.inOut",
          scrollTrigger: { trigger: ".ix-stampbox", start: "top 85%", once: true },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className="edt-dark edt-section ix-sec" ref={rootRef}>
      <div className="edt-inner">
        {/* ------------------------------------------------ stamp stage */}
        <div className="ix-stage">
          <svg
            className="ix-wave"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 80 C 160 28, 320 132, 480 80 S 800 28, 960 80 S 1280 132, 1440 80"
              fill="none"
              stroke="var(--line)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <Crosshair className="ix-xh" style={{ top: "50%", left: "30%" }} />
          <Crosshair className="ix-xh" style={{ top: "50%", right: "30%" }} />

          {/* entrance handled by gsap (scale 1.15→1) — no data-rvl here,
              or the stamp would double-animate */}
          <div className="ix-stampbox">
            <div className="stamp ix-stamp">
              <div className="stamp__art ix-art">
                {/* the portrait takes the plate the AKS monogram used to hold —
                    first child so the frames, ticks and microcopy (z-index 1-2)
                    all print over it, the way a real stamp is engraved */}
                <img
                  src={asset("/stamp-portrait.webp")}
                  alt="Aaryan Kumar Saini"
                  className="ix-portrait"
                  width={600}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div className="ix-frame" aria-hidden="true" />
                <div className="ix-frame ix-frame--in" aria-hidden="true" />
                <span className="ix-tick ix-tick--tl" aria-hidden="true" />
                <span className="ix-tick ix-tick--tr" aria-hidden="true" />
                <span className="ix-tick ix-tick--bl" aria-hidden="true" />
                <span className="ix-tick ix-tick--br" aria-hidden="true" />
                <p className="ix-micro ix-micro--top">QA ENGINEER · INDIA</p>
                <BugDoodle className="ix-bug" />
                <p className="ix-micro ix-micro--bot">MMXXVI · FIRST CLASS</p>
              </div>
            </div>

            <span className="t-script ix-sign">Aaryan</span>

            <SpinBadge
              className="ix-badge"
              text="OPEN TO WORK · OPEN TO BREAK · "
              size={110}
              solid
              draggable
            >
              <span style={{ fontSize: "1.4rem" }}>✳</span>
            </SpinBadge>
          </div>
        </div>

        <div className="ix-fleuron" aria-hidden="true">
          ✦
        </div>

        {/* ---------------------------------------- "Quality, as I see it" */}
        {/* took the slot the stats strip held; ships its own styles and runs
            on the dark ledger rather than on its old paper section */}
        <QualityCredo />
      </div>
      <style>{css}</style>
    </section>
  );
}

/* ----------------------------------------------------------------- styles */
const css = /* css */ `
section.ix-sec {
  /* bottom clearance = the torn-paper strip FeaturedProjects hangs up into
     this section (see .fpx-tear there) — nothing may sit under its reach */
  padding-block: clamp(6rem, 12vw, 11.5rem) calc(2.5rem + 320px);
  overflow-x: clip;
}

/* ------------------------------------------------------- statement head */
.ix-head {
  width: fit-content;
  margin-inline: auto;
  text-align: center;
}
.ix-lead {
  font-family: var(--serif);
  font-style: italic;
  font-size: calc(var(--fs-lead) * 1.2);
  color: var(--muted);
  text-align: left;
  padding-left: 0.2em;
  margin-bottom: 0.9rem;
}
.ix-statement {
  max-width: 28ch;
  margin-inline: auto;
  font-size: calc(var(--fs-statement) * 1.4);
  line-height: 1.18;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.ix-w {
  will-change: opacity;
}

/* ------------------------------------------------------------ stamp stage */
.ix-stage {
  position: relative;
  margin-top: clamp(3.2rem, 7vw, 5.5rem);
  display: grid;
  justify-items: center;
}
.ix-wave {
  position: absolute;
  left: 50%;
  top: 54%;
  width: 100vw;
  height: clamp(90px, 12vw, 160px);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.ix-xh {
  opacity: 0.5;
}
.ix-stampbox {
  position: relative;
  z-index: 1;
}
.ix-stamp {
  transform: rotate(-2deg);
}
.ix-stamp .ix-art {
  width: clamp(238px, 24vw, 300px);
  aspect-ratio: 5 / 6;
  background: var(--ink-2);
}
.ix-stamp .ix-art::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--crumple-noise);
  opacity: 0.22;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.ix-stamp .ix-art::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* The first two are scrim bands for the microcopy rows. The plate used to be
     flat ink, so cyan type read anywhere on it; over a photograph the top row
     lands on bright sky and the bottom row on pale stone, and both vanished.
     These sit under .ix-micro (z-index 2) and hold the type without touching
     the middle of the portrait. */
  background:
    linear-gradient(180deg, rgba(16, 17, 44, 0.82) 0%, rgba(16, 17, 44, 0) 24%),
    linear-gradient(0deg, rgba(16, 17, 44, 0.82) 0%, rgba(16, 17, 44, 0) 24%),
    radial-gradient(ellipse at 50% 40%, rgba(135, 206, 235, 0.07), transparent 62%),
    radial-gradient(ellipse at center, transparent 56%, rgba(0, 0, 0, 0.32));
}
/* thin double border, gold-deep */
.ix-frame {
  position: absolute;
  inset: 10px;
  border: 1px solid var(--gold-deep);
  opacity: 0.75;
  pointer-events: none;
  z-index: 1;
}
.ix-frame--in {
  inset: 14px;
  opacity: 0.38;
}
/* tiny register crosshairs, on the frame corners */
.ix-tick {
  position: absolute;
  width: 9px;
  height: 9px;
  color: var(--gold);
  opacity: 0.55;
  z-index: 2;
}
.ix-tick::before,
.ix-tick::after {
  content: "";
  position: absolute;
  background: currentColor;
}
.ix-tick::before {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-50%);
}
.ix-tick::after {
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-50%);
}
.ix-tick--tl { top: 20px; left: 20px; }
.ix-tick--tr { top: 20px; right: 20px; }
.ix-tick--bl { bottom: 20px; left: 20px; }
.ix-tick--br { bottom: 20px; right: 20px; }
/* mono microcopy rows */
.ix-micro {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  text-align: center;
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--gold-soft);
  opacity: 0.82;
}
.ix-micro--top { top: 27px; }
.ix-micro--bot { bottom: 27px; }
/* the engraved portrait — fills the plate the AKS monogram used to occupy.
   z-index 0 keeps it under the frames, ticks and microcopy; the art's own
   ::after (cyan wash + vignette) still prints over the top, which is what
   settles the photo into the stamp instead of leaving it pasted on. */
.ix-portrait {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* the file is already the full frame at the plate's 5:6, so this crops
     nothing further — dead centre keeps the shot as it was taken */
  object-position: center center;
  /* Full colour, full strength — the photo prints as shot. The microcopy and
     frame lines are kept readable by the scrim bands in .ix-art::after rather
     than by dimming the picture, so nothing here needs to fight the image. */
  opacity: 1;
}
/* lift the crumple pass above the portrait so the grain prints on the photo
   rather than being buried under it */
.ix-stamp .ix-art::before {
  z-index: 1;
}
.ix-bug {
  position: absolute;
  left: 24px;
  bottom: 46px;
  z-index: 2;
  width: 30px;
  height: auto;
  color: var(--gold);
  opacity: 0.4;
}
/* script signature, overlapping bottom-right */
.ix-sign {
  position: absolute;
  right: -2.4rem;
  bottom: 0.7rem;
  z-index: 3;
  font-size: 3.4rem;
  color: var(--parch);
  transform: rotate(8deg);
  text-shadow:
    0 0 16px rgba(135, 206, 235, 0.55),
    0 0 42px rgba(135, 206, 235, 0.25);
  pointer-events: none;
}
/* spin badge, overlapping bottom-left */
.ix-badge {
  position: absolute;
  left: -3rem;
  bottom: -2.1rem;
  z-index: 3;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

/* ------------------------------------------------------------- ornament */
.ix-fleuron {
  margin-top: clamp(3.6rem, 7vw, 5.6rem);
  text-align: center;
  font-size: 0.85rem;
  color: var(--gold);
  opacity: 0.6;
}

/* ------------------------------------------------------------ responsive */
/* ------------------------------------------------------------- MOBILE */
@media (max-width: 767.98px) {
  section.ix-sec {
    padding-block: 2.2rem calc(1.5rem + 220px);
  }
  .ix-stage {
    margin-top: 0.8rem;
  }
  .ix-wave,
  .ix-xh {
    display: none;
  }
  .ix-stamp .ix-art {
    width: min(64vw, 260px);
  }
  .ix-sign {
    font-size: 2.6rem;
    right: -0.5rem;
    bottom: 0.4rem;
  }
  .ix-badge {
    left: -1.3rem;
    bottom: -1.9rem;
    --spin-size: 92px !important;
  }
  .ix-fleuron {
    margin-top: 2.6rem;
  }
}
`;
