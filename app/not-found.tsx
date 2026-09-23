import type { Metadata } from "next";
import Link from "next/link";
import TryAgainButton from "@/components/TryAgainButton";
import SmoothScroll from "@/components/SmoothScroll";

/* ============================================================================
   404 — "Well, that's a defect."
   Layout follows the getnudge.info/404 pattern the design was chosen from:
   a floating pill nav, a centred illustration, a display headline, two lines
   of muted copy, a solid/ghost button pair, and a short "you might be looking
   for" list. Everything is redrawn in this site's own vocabulary — tinted
   field-notes paper, hairlines, crosshairs, the wax-seal stamp — so it reads
   as part of the portfolio rather than a transplant.
   ========================================================================== */

export const metadata: Metadata = {
  title: "404 — Page not found | Aaryan Kumar Saini",
  description: "That page doesn't exist. Head back to the portfolio.",
  // an error page should never compete with the real one in the index
  robots: { index: false, follow: true },
};

const QUICK_LINKS = [
  { label: "About", href: "/#about" },
  { label: "Selected Work", href: "/#work" },
  { label: "Résumé", href: "/#resume" },
  { label: "Contact", href: "/#footer" },
];

export default function NotFound() {
  return (
    <main className="nf-root">
      <section className="nf-stage">
        {/* --------------------------------------------------- illustration */}
        <div className="nf-art" aria-hidden="true">
          <svg viewBox="0 0 460 300" role="img">
            <defs>
              {/* painterly edge, the same turbulence trick the honours
                  section uses for its grain */}
              <filter id="nf-wash" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.022"
                  numOctaves="4"
                  seed="7"
                  result="n"
                />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="26" />
              </filter>
              <filter id="nf-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <linearGradient id="nf-sheet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#eef8fd" />
              </linearGradient>
            </defs>

            {/* watercolour wash behind the sheet */}
            <g filter="url(#nf-wash)" opacity="0.5">
              <ellipse cx="205" cy="140" rx="150" ry="96" fill="#b1dff2" />
              <ellipse cx="285" cy="170" rx="120" ry="78" fill="#87ceeb" opacity="0.75" />
              <ellipse cx="170" cy="185" rx="104" ry="60" fill="#dbeff9" />
            </g>

            {/* the mislaid sheet */}
            <g transform="rotate(-4 230 150)">
              <rect
                x="120"
                y="52"
                width="220"
                height="196"
                rx="2"
                fill="url(#nf-sheet)"
                stroke="#c9dbe6"
                strokeWidth="1"
              />
              <rect x="120" y="52" width="220" height="196" fill="#15173d" opacity="0.04" filter="url(#nf-grain)" />
              {/* header rule */}
              <line x1="140" y1="86" x2="320" y2="86" stroke="#1e84ae" strokeWidth="1" opacity="0.5" />
              <text
                x="140"
                y="78"
                fontFamily="var(--mono), monospace"
                fontSize="8"
                letterSpacing="2.6"
                fill="#1e84ae"
              >
                DEFECT REPORT
              </text>
              {/* the number */}
              <text
                x="230"
                y="158"
                textAnchor="middle"
                fontFamily="var(--serif), Georgia, serif"
                fontStyle="italic"
                fontSize="72"
                fill="#15173d"
              >
                404
              </text>
              {/* redacted body lines, same motif as the résumé leaf */}
              <g fill="#15173d" opacity="0.14">
                <rect x="146" y="182" width="148" height="5" />
                <rect x="146" y="196" width="120" height="5" />
                <rect x="146" y="210" width="136" height="5" />
              </g>
            </g>

            {/* wax seal, pinned to the corner */}
            <g transform="translate(348 74) rotate(12)">
              <circle r="34" fill="#15173d" />
              <circle r="27" fill="none" stroke="#87ceeb" strokeWidth="0.8" opacity="0.65" />
              <text
                textAnchor="middle"
                y="-6"
                fontFamily="var(--mono), monospace"
                fontSize="7"
                letterSpacing="1.6"
                fill="#87ceeb"
              >
                NOT
              </text>
              <text
                textAnchor="middle"
                y="6"
                fontFamily="var(--mono), monospace"
                fontSize="7"
                letterSpacing="1.6"
                fill="#87ceeb"
              >
                FOUND
              </text>
              <path
                d="M-11 14 h22"
                stroke="#87ceeb"
                strokeWidth="1"
                opacity="0.5"
                strokeLinecap="round"
              />
            </g>

            {/* the bug that got away */}
            <g
              transform="translate(126 236) rotate(-12)"
              fill="none"
              stroke="#15173d"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <ellipse cx="0" cy="0" rx="11" ry="13" fill="#ffffff" />
              <path d="M0 -13 V13 M-11 -4 H-20 M11 -4 H20 M-10 5 l-8 6 M10 5 l8 6 M-9 -9 l-6 -7 M9 -9 l6 -7" />
              <circle cx="-5" cy="-17" r="3.4" />
              <circle cx="5" cy="-17" r="3.4" />
            </g>
          </svg>
        </div>

        {/* ---------------------------------------------------------- copy */}
        <h1 className="nf-title">
          Well, That&rsquo;s A <em>Defect.</em>
        </h1>
        <p className="nf-lede">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been
          moved. Let&rsquo;s get you back on track.
        </p>

        <div className="nf-actions">
          <Link href="/" className="btn-solid nf-btn">
            <span className="mas">Go to homepage</span>
            <span className="face" aria-hidden="true">Go to homepage</span>
          </Link>
          <TryAgainButton className="btn-ghost nf-btn nf-btn--ghost" />
        </div>

        <p className="nf-hint">You might be looking for:</p>
        <ul className="nf-links">
          {QUICK_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <span className="nf-xh nf-xh--tl" aria-hidden="true" />
      <span className="nf-xh nf-xh--br" aria-hidden="true" />

      {/* same Lenis glide as the home page (skipped under reduced motion) */}
      <SmoothScroll />

      <style>{css}</style>
    </main>
  );
}

const css = /* css */ `
.nf-root {
  position: relative;
  min-height: 100svh;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(2rem, 6vw, 4rem) var(--pad, 1.4rem);
  overflow: clip;
}
/* This <style> only ships inside 404.html, so re-skinning <body> here is
   scoped to the error page. It has to be body rather than .nf-root: body's
   background is what propagates to the canvas, and the site's default dark
   --bg would otherwise flash in the overscroll gutter on mobile. */
body {
  background: var(--parch-2, #effafe);
  background-image: var(--paper-noise);
  background-blend-mode: multiply;
}

/* --------------------------------------------------------------- the stage */
.nf-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: min(680px, 100%);
}
.nf-art {
  width: min(430px, 92%);
  margin-bottom: clamp(1.2rem, 3vw, 2rem);
}
.nf-art svg { width: 100%; height: auto; display: block; }

.nf-title {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(2.4rem, 1.5rem + 4.4vw, 4.6rem);
  line-height: 1.04;
  letter-spacing: -0.012em;
  color: var(--ink);
  margin: 0;
}
.nf-title em { font-style: italic; color: var(--gold-deep, #1e84ae); }

.nf-lede {
  font-family: var(--body);
  font-size: var(--fs-body);
  line-height: 1.6;
  color: var(--ink-muted);
  max-width: 46ch;
  margin: clamp(0.9rem, 2vw, 1.3rem) auto 0;
}

.nf-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: clamp(1.5rem, 3vw, 2.2rem);
}
.nf-btn { border-radius: 999px; }
/* The site's .btn-ghost is uppercase mono; the reference layout pairs two
   sentence-case pills, so this one is re-typed to sit beside .btn-solid. */
.nf-btn--ghost {
  font-family: var(--sans);
  font-size: var(--fs-body-sm);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--ink);
  border: 1px solid var(--ink-line, rgba(21, 23, 61, 0.16));
  background: color-mix(in srgb, var(--parch, #fff) 70%, transparent);
}
.nf-btn--ghost > span {
  padding: 0.95rem 1.6rem;
}
.nf-btn--ghost:hover {
  border-color: var(--gold, #87ceeb);
}

.nf-hint {
  font-family: var(--mono);
  font-size: var(--fs-label-sm, 0.68rem);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
  opacity: 0.75;
  margin-top: clamp(2rem, 4.5vw, 3rem);
}
.nf-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(0.9rem, 2.4vw, 1.6rem);
  list-style: none;
  margin: 0.7rem 0 0;
  padding: 0;
}
.nf-links a {
  font-family: var(--body);
  font-size: 0.95rem;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 26%, transparent);
  padding-bottom: 1px;
  transition: color 0.25s var(--ease, ease), border-color 0.25s var(--ease, ease);
}
.nf-links a:hover {
  color: var(--gold-deep, #1e84ae);
  border-color: var(--gold-deep, #1e84ae);
}

/* register marks, same as the editorial sections */
.nf-xh { position: absolute; width: 26px; height: 26px; opacity: 0.35; }
.nf-xh::before, .nf-xh::after { content: ""; position: absolute; background: var(--gold-deep, #1e84ae); }
.nf-xh::before { left: 50%; top: 0; width: 1px; height: 100%; transform: translateX(-50%); }
.nf-xh::after { top: 50%; left: 0; height: 1px; width: 100%; transform: translateY(-50%); }
.nf-xh--tl { top: clamp(18px, 3vw, 40px); left: clamp(18px, 3vw, 40px); }
.nf-xh--br { bottom: clamp(18px, 3vw, 40px); right: clamp(18px, 3vw, 40px); }
`;
