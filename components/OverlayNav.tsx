/* ============================================================================
   OverlayNav — "The Register".
   The fullscreen menu drawn as the site's index page: a hairline-ruled table
   of contents on the left (folio numbers 01–08, whole-word italic-roll hover),
   a registered-dispatch meta rail on the right whose image well previews the
   hovered section, and a ruled three-column contact colophon across the foot.
   Open/close state is body.nav-open and the preview is data-preview on the
   nav — both wired in lib/siteEffects.js; the choreography lives in
   legacy.css. This component ships markup only.
   ========================================================================== */

import { asset } from "@/lib/asset";

/* Each row carries a preview plate shown in the rail's image well on hover
   (wired in lib/siteEffects.js: the nav's data-preview attribute follows the
   hovered row and persists between rows, so the well never flickers empty).
   The plates are CC0/public-domain photographs fetched by
   scripts/fetch-nav-previews.mjs — provenance in assets/. Object metaphors,
   one per row: door, pen, tools, gallery, compass, trophy, typewriter,
   telephone. */
/* Four entries only — the register signposts the main chapters; Skills,
   Honours and the Résumé are reached by scrolling (and the résumé download
   sits in the colophon below). */
const LINKS: { no: string; href: string; label: string; img: string }[] = [
  { no: "01", href: "#about", label: "About", img: "/nav/02-about.webp" },
  { no: "02", href: "#work", label: "Work", img: "/nav/04-work.webp" },
  { no: "03", href: "#experience", label: "Experience", img: "/nav/05-experience.webp" },
  { no: "04", href: "#footer", label: "Contact", img: "/nav/08-contact.webp" },
];

/* brand glyphs — official simple-icons paths, same as the footer */
const ICON_PATHS = {
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  /* Material "call" — same glyph the footer's phone disc uses */
  phone:
    "M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a.99.99 0 011.02-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.1.35.02.74-.25 1.02l-2.2 2.2z",
  /* Material "description" — a ruled sheet, for the résumé PDF */
  resume:
    "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
} as const;

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

/* Icon-only colophon disc. The wordless button keeps its name in aria-label
   (screen readers) and title (hover tooltip) so nothing is lost by dropping
   the text label. Styled as .overlay-nav__icon in legacy.css. */
type IconLinkProps = {
  href: string;
  label: string;
  path: string;
  external?: boolean;
  download?: string;
};

function IconLink({ href, label, path, external, download }: IconLinkProps) {
  return (
    <a
      className="overlay-nav__icon"
      href={href}
      aria-label={label}
      title={label}
      download={download}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      data-cursor="link"
    >
      <BrandIcon path={path} />
    </a>
  );
}

export default function OverlayNav() {
  return (
    <nav className="overlay-nav" id="overlayNav" aria-hidden="true">
      <div className="overlay-nav__bg" />
      <div className="overlay-nav__inner">
        {/* --------------------------------------------- the index (left) */}
        <ul className="overlay-nav__list">
          {LINKS.map((l) => (
            <li key={l.no}>
              <a href={l.href} data-no={l.no} data-cursor="link">
                <em>{l.no}</em>
                <span className="overlay-nav__word">
                  <span className="overlay-nav__word-in">
                    <span>{l.label}</span>
                    <span aria-hidden="true">{l.label}</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* --------------------------------- registered-dispatch meta rail */}
        <aside className="overlay-nav__rail" aria-hidden="true">
          {/* image well — the hovered row's preview plate, duotoned into the
              ledger palette; the resting frame holds a lone register mark */}
          <div className="overlay-nav__rail-well">
            <span className="overlay-nav__rail-mark">+</span>
            {LINKS.map((l) => (
              <figure data-no={l.no} key={l.no}>
                {/* no src: the plates are fetched off the critical path by
                    wireMenu — idle after the boot, or on first menu intent */}
                <img data-src={asset(l.img)} alt="" draggable={false} />
                <figcaption>
                  {l.no} · {l.label}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="overlay-nav__rail-foot">
            <p className="overlay-nav__status">
              <span className="overlay-nav__status-dot" aria-hidden="true" />
              Open to work
            </p>
            <dl className="overlay-nav__facts">
              <dt>Now</dt>
              <dd>
                Junior Quality Engineer
                <span>Kayease · on-site</span>
              </dd>
              <dt>Based</dt>
              <dd>
                Jaipur, India
                <span>IST · GMT +5:30</span>
              </dd>
            </dl>
          </div>
        </aside>

        {/* ------------------------------------------- contact colophon */}
        <div className="overlay-nav__contact">
          <div className="overlay-nav__col">
            <p className="overlay-nav__eyebrow">Email</p>
            <a
              className="overlay-nav__mail"
              href="mailto:aaryankrsaini24@gmail.com"
              data-cursor="link"
            >
              aaryankrsaini24@gmail.com
            </a>
          </div>

          <div className="overlay-nav__col">
            <p className="overlay-nav__eyebrow">Phone</p>
            <div className="overlay-nav__icons">
              {/* tel: — same number the Person schema publishes */}
              <IconLink
                href="tel:+919625511881"
                label="Call +91 96255 11881"
                path={ICON_PATHS.phone}
              />
              {/* wa.me takes the number in full international form, digits only */}
              <IconLink
                href="https://wa.me/919625511881"
                label="WhatsApp"
                path={ICON_PATHS.whatsapp}
                external
              />
            </div>
            <p className="overlay-nav__micro">IST · GMT +5:30</p>
          </div>

          <div className="overlay-nav__col">
            <p className="overlay-nav__eyebrow">Elsewhere</p>
            <div className="overlay-nav__icons">
              <IconLink
                href="https://linkedin.com/in/Aaryan-Saini"
                label="LinkedIn"
                path={ICON_PATHS.linkedin}
                external
              />
              <IconLink
                href="https://github.com/AaryanSaini"
                label="GitHub"
                path={ICON_PATHS.github}
                external
              />
              <IconLink
                href={asset("/resume.pdf")}
                label="Résumé (PDF)"
                path={ICON_PATHS.resume}
                download="Aaryan-Saini-Resume.pdf"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
