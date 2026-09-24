"use client";

/* ============================================================================
   ResumeEditorial — "The Résumé, on one page".
   Tinted field-notes paper. A centered mono eyebrow introduces a full-bleed
   reverse ticker of familiar tooling, ruled above and below by hairlines like
   a newspaper masthead strip. Beneath, a two-column plate: a laurel-crested
   invitation to take the document away (solid download button + mono meta,
   ghost link down to the footer), and — tilted on the right like a sheet left
   on a desk — the résumé itself, drawn as a decorative white leaf with inked
   text-lines, a spinning "QA APPROVED" wax-seal badge pinned to its corner,
   and a script signature in the lower margin. On single-column screens the
   sheet moves up between the lede and the buttons.
   ========================================================================== */

import { useRef, type CSSProperties } from "react";
import {
  SpinBadge,
  Crest,
  Crosshair,
  useCharReveal,
} from "@/components/ui/editorial";
import { asset } from "@/lib/asset";
import {
  siSelenium,
  siCypress,
  siPostman,
  siJira,
  siJavascript,
  siK6,
  siGithubactions,
  siDocker,
  siGit,
} from "simple-icons";

/* The familiar-tooling marquee: official brand marks via simple-icons where
   they exist; Playwright and Microsoft 365 have no simple-icons entry, so
   they ride a small typographic seal instead (site stamp motif). */
type Tool = { label: string; path?: string; seal?: string };
const TOOLS: Tool[] = [
  { label: "Playwright", seal: "PW" },
  { label: "Selenium", path: siSelenium.path },
  { label: "Cypress", path: siCypress.path },
  { label: "Postman", path: siPostman.path },
  { label: "Jira", path: siJira.path },
  { label: "JavaScript", path: siJavascript.path },
  { label: "k6", path: siK6.path },
  { label: "CI/CD pipelines", path: siGithubactions.path },
  { label: "Docker", path: siDocker.path },
  { label: "Git", path: siGit.path },
  { label: "Microsoft 365", seal: "365" },
];

/* one run of the marquee — rendered twice so translateX(-50%) loops clean */
function ToolRun() {
  return (
    <span className="rsx-logos__run">
      {TOOLS.map((t) => (
        <span className="rsx-logo" key={t.label}>
          {t.path ? (
            <svg
              className="rsx-logo__svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d={t.path} />
            </svg>
          ) : (
            <span className="rsx-logo__seal" aria-hidden="true">
              {t.seal}
            </span>
          )}
          <span className="rsx-logo__label">{t.label}</span>
        </span>
      ))}
    </span>
  );
}

/* decorative sheet "text" lines — two paragraphs' worth of redacted bars */
const SHEET_LINES_A = ["62%", "90%", "74%", "48%"];
const SHEET_LINES_B = ["80%", "66%", "88%"];

/* the download arrow, rendered once per stacked label of the masked button */
function DownloadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className="rsx-download-glyph"
    >
      <path
        d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ResumeEditorial() {
  const rootRef = useRef<HTMLElement>(null);

  /* crest display title — shared per-character blur reveal */
  useCharReveal(rootRef, ".rsx-copy .crest__title");

  return (
    <section
      id="resume"
      className="edt-paper edt-paper--tint edt-section rsx-root"
      ref={rootRef}
    >
      <div className="edt-rules" aria-hidden="true" />

      {/* corner register marks */}
      <Crosshair className="rsx-xhair rsx-xhair--tr" />
      <Crosshair className="rsx-xhair rsx-xhair--bl" />

      {/* ------------------------------------------------ masthead ticker */}
      <p className="t-eyebrow rsx-eyebrow" data-rvl="fade">
        <span aria-hidden="true">{"✦"}&nbsp;&nbsp;</span>
        FAMILIAR WITH
        <span aria-hidden="true">&nbsp;&nbsp;{"✦"}</span>
      </p>
      {/* reference: band enters from y:42, then the tool marks auto-scroll
          in a continuous line (paused on hover, static under reduced motion) */}
      <div className="rsx-band" data-rvl style={{ "--rvl-delay": "0.1s" } as CSSProperties}>
        <div className="rsx-logos" aria-hidden="true">
          <div className="rsx-logos__track">
            <ToolRun />
            <ToolRun />
          </div>
        </div>
        <span className="sr-only">
          {TOOLS.map((t) => t.label).join(", ")}
        </span>
      </div>

      {/* --------------------------------------------------- two-col plate */}
      <div className="edt-inner rsx-grid">
        {/* left — the invitation */}
        <div className="rsx-copy">
          {/* title entrance owned by the char reveal — no data-rvl (double-anim) */}
          <div>
            <Crest eyebrow={"THE RÉSUMÉ"}>
              The Whole Story, <em>On One Page.</em>
            </Crest>
          </div>

          <p className="rsx-lede" data-rvl style={{ "--rvl-delay": "0.14s" } as CSSProperties}>
            {
              "Three internships, two AI projects, and a BCA in AI & Data Science — distilled into a single, considered document. Take it with you."
            }
          </p>

          <div className="rsx-actions" data-rvl style={{ "--rvl-delay": "0.22s" } as CSSProperties}>
            <a
              className="btn-solid rsx-download"
              href={asset("/resume.pdf")}
              download="Aaryan-Saini-Resume.pdf"
            >
              <span className="mas">
                {"Download Résumé"}
                <DownloadGlyph />
              </span>
              <span className="face" aria-hidden="true">
                {"Download Résumé"}
                <DownloadGlyph />
              </span>
            </a>
            <span className="rsx-meta">{"PDF · ONE PAGE"}</span>
          </div>
          <div className="rsx-ghostrow" data-rvl style={{ "--rvl-delay": "0.3s" } as CSSProperties}>
            <a className="btn-ghost rsx-ghost" href="https://wa.me/919625511881" target="_blank" rel="noopener noreferrer">
              <span className="mas">{"Or simply say hello ↓"}</span>
              <span className="face" aria-hidden="true">{"Or simply say hello ↓"}</span>
            </a>
          </div>
        </div>

        {/* right — the document itself (purely decorative) */}
        <div className="rsx-sheetwrap" data-rvl="scale" style={{ "--rvl-delay": "0.18s" } as CSSProperties}>
          <div className="rsx-sheet" aria-hidden="true">
            <SpinBadge
              text={"QA APPROVED · QA APPROVED · "}
              size={92}
              solid
              draggable
              className="rsx-badge"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.5 12.5l4.8 4.8L19.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </SpinBadge>

            <header className="rsx-sheet-head">
              <p className="rsx-sheet-name">Aaryan Kumar Saini</p>
              <p className="rsx-sheet-role">{"QA ENGINEER & DEVELOPER"}</p>
            </header>

            <div className="rsx-sheet-body">
              <div className="rsx-para">
                {SHEET_LINES_A.map((w, i) => (
                  <div key={`a-${i}`} className="rsx-line" style={{ width: w }} />
                ))}
              </div>
              <div className="rsx-para rsx-para--second">
                {SHEET_LINES_B.map((w, i) => (
                  <div key={`b-${i}`} className="rsx-line" style={{ width: w }} />
                ))}
              </div>
            </div>

            <span className="rsx-sign t-script">Aaryan</span>
          </div>
        </div>
      </div>

      <style>{css}</style>
    </section>
  );
}

const css = /* css */ `
/* ------------------------------------------------------------ scaffolding */
.rsx-root {
  overflow: clip; /* keep the full-bleed ticker inside the section */
}
.rsx-xhair {
  z-index: 1;
}
.rsx-xhair--tr {
  top: clamp(18px, 3vw, 34px);
  right: clamp(18px, 3vw, 34px);
}
.rsx-xhair--bl {
  bottom: clamp(18px, 3vw, 34px);
  left: clamp(18px, 3vw, 34px);
}

/* --------------------------------------------------------- masthead strip */
.rsx-eyebrow {
  position: relative;
  z-index: 1;
  text-align: center;
  color: var(--ink-muted);
  margin-bottom: 1.1rem;
}
.rsx-eyebrow span {
  opacity: 0.55;
  font-size: 0.85em;
}
.rsx-band {
  position: relative;
  z-index: 1;
  margin: 0 calc(-1 * var(--pad)) clamp(3.2rem, 7vw, 5.5rem);
  border-top: 1px solid var(--ink-line);
  border-bottom: 1px solid var(--ink-line);
  padding: 0.9rem 0;
}
/* reference ticker entrance: from y:42 (not the default 32) — settles via
   [data-rvl].is-in { transform: none } once the global IO flips it in */
.rsx-band[data-rvl]:not(.is-in) {
  transform: translateY(42px);
}
html.no-js .rsx-band[data-rvl] {
  transform: none;
}
/* ------------------------------------------- tool-mark marquee (auto line) */
.rsx-logos {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
}
.rsx-logos__track {
  display: flex;
  width: max-content;
  animation: rsx-scroll 34s linear infinite;
  will-change: transform;
}
.rsx-logos:hover .rsx-logos__track {
  animation-play-state: paused;
}
.rsx-logos__run {
  display: flex;
  align-items: center;
}
.rsx-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.35rem clamp(1.5rem, 3.2vw, 2.8rem);
}
.rsx-logo__svg {
  width: 21px;
  height: 21px;
  flex: none;
  fill: var(--ink);
  opacity: 0.82;
}
.rsx-logo__seal {
  flex: none;
  width: 25px;
  height: 25px;
  border: 1px solid color-mix(in srgb, var(--ink) 55%, transparent);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  color: var(--ink);
  opacity: 0.85;
}
.rsx-logo__label {
  font-family: var(--mono);
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
  white-space: nowrap;
}
@keyframes rsx-scroll {
  to {
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rsx-logos__track {
    animation: none;
    width: 100%;
  }
  .rsx-logos__run {
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }
  .rsx-logos__run:last-child {
    display: none;
  }
  .rsx-logos {
    -webkit-mask-image: none;
    mask-image: none;
  }
}

/* -------------------------------------------------------------- the plate */
.rsx-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
  gap: clamp(2.8rem, 6vw, 6.5rem);
  align-items: center;
}

/* left column — centered like a title page */
.rsx-copy {
  text-align: center;
  display: grid;
  justify-items: center;
}
.rsx-lede {
  font-family: var(--body);
  font-size: var(--fs-body);
  line-height: var(--lh-body, 1.65);
  color: var(--ink-muted);
  max-width: 44ch;
  margin: clamp(1.3rem, 2.6vw, 1.9rem) auto 0;
}
.rsx-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.1rem;
  margin-top: clamp(1.8rem, 3.4vw, 2.6rem);
}
.rsx-download-glyph {
  width: 17px;
  height: 17px;
  flex: none;
}
.rsx-meta {
  font-family: var(--mono);
  font-size: var(--fs-label-sm);
  letter-spacing: var(--tr-label);
  text-transform: uppercase;
  color: var(--ink-muted);
  white-space: nowrap;
}
.rsx-ghostrow {
  margin-top: 1.15rem;
}
.rsx-ghost {
  color: var(--ink-muted);
}

/* ------------------------------------------------- the document, itself */
.rsx-sheetwrap {
  position: relative;
  z-index: 1;
  justify-self: center;
  /* headroom so the corner badge never collides with the ticker rule */
  padding: 30px 0 10px 30px;
}
.rsx-sheet {
  position: relative;
  width: min(380px, 100%);
  aspect-ratio: 1 / 1.35;
  background: var(--parch);
  border: 1px solid var(--ink-line);
  box-shadow:
    0 2px 6px rgba(21, 15, 22, 0.06),
    0 18px 44px rgba(21, 15, 22, 0.14),
    0 42px 90px rgba(21, 15, 22, 0.12);
  transform: rotate(2.5deg);
  transition: transform 0.45s var(--ease), box-shadow 0.45s var(--ease);
  padding: clamp(1.6rem, 3.2vw, 2.4rem) clamp(1.4rem, 2.8vw, 2.1rem);
  display: flex;
  flex-direction: column;
}
.rsx-sheet::after {
  /* faint paper grain on the leaf */
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: var(--paper-noise);
  opacity: 0.05;
}
.rsx-sheetwrap:hover .rsx-sheet {
  transform: rotate(2.5deg) translateY(-8px);
  box-shadow:
    0 4px 10px rgba(21, 15, 22, 0.07),
    0 26px 56px rgba(21, 15, 22, 0.17),
    0 56px 110px rgba(21, 15, 22, 0.14);
}

/* corner seal */
.rsx-badge {
  position: absolute;
  top: -28px;
  left: -30px;
  z-index: 2;
}

/* sheet header */
.rsx-sheet-head {
  text-align: center;
  padding-bottom: clamp(0.9rem, 2vw, 1.3rem);
  border-bottom: 1px solid var(--ink-line-soft);
  margin-bottom: clamp(1.2rem, 2.6vw, 1.8rem);
}
.rsx-sheet-name {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(1.25rem, 1rem + 1vw, 1.7rem);
  line-height: 1.15;
  color: var(--ink);
}
.rsx-sheet-role {
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 0.5rem;
}

/* redacted text lines */
.rsx-sheet-body {
  flex: 1;
}
.rsx-para {
  display: grid;
  gap: clamp(0.55rem, 1.3vw, 0.8rem);
}
.rsx-para--second {
  margin-top: clamp(1.3rem, 2.8vw, 2rem);
}
.rsx-line {
  height: 6px;
  background: color-mix(in srgb, var(--ink) 14%, transparent);
}

/* signature */
.rsx-sign {
  align-self: flex-end;
  font-size: clamp(2rem, 1.6rem + 1.6vw, 2.7rem);
  color: var(--gold-deep);
  transform: rotate(-5deg);
  margin: 0 0.35rem -0.2rem 0;
}

/* ------------------------------------------------------------ responsive */
/* single column: the sheet sits between the lede and the buttons, so the
   document is shown before the call to download it. The copy column
   dissolves (display: contents) and its children join the grid directly —
   title and lede first, then the sheet, then the actions (order: 1). */
@media (max-width: 899px) {
  .rsx-grid {
    grid-template-columns: 1fr;
    gap: 0;
    justify-items: center;
    text-align: center;
  }
  .rsx-copy {
    display: contents;
  }
  .rsx-actions,
  .rsx-ghostrow {
    order: 1;
  }
  .rsx-sheetwrap {
    padding-left: 26px;
    margin-top: clamp(2rem, 6vw, 3rem);
  }
  .rsx-sheet {
    width: min(340px, 100%);
  }
  .rsx-badge {
    top: -24px;
    left: -24px;
  }
}
/* ------------------------------------------------------------- MOBILE */
@media (max-width: 767.98px) {
  .rsx-band {
    margin-bottom: 2.6rem;
    padding: 0.7rem 0;
  }
  .rsx-logo {
    gap: 0.55rem;
    padding: 0.3rem 1.1rem;
  }
  .rsx-lede {
    font-size: 1rem;
    margin-top: 1.1rem;
  }
  .rsx-actions {
    flex-direction: column;
    gap: 0.7rem;
    margin-top: 2.2rem;
    width: 100%;
  }
  .rsx-download {
    width: 100%;
    justify-content: center;
  }
  .rsx-ghostrow {
    width: 100%;
    margin-top: 0.8rem;
  }
  .rsx-ghost {
    width: 100%;
    justify-content: center;
  }
  .rsx-sheetwrap {
    padding: 22px 0 6px 18px;
  }
  .rsx-sheet {
    width: min(250px, 100%);
    transform: rotate(2deg);
  }
  .rsx-sheetwrap:hover .rsx-sheet {
    transform: rotate(2deg) translateY(-8px);
  }
  .rsx-badge {
    top: -18px;
    left: -16px;
    --spin-size: 72px !important;
  }
  .rsx-sheet-role {
    font-size: 0.52rem;
    letter-spacing: 0.22em;
  }
}

/* ------------------------------------------------------- reduced motion */
@media (prefers-reduced-motion: reduce) {
  .rsx-sheet,
  .rsx-sheetwrap:hover .rsx-sheet {
    transition: none;
    transform: rotate(2.5deg);
  }
}
`;
