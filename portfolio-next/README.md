# Aaryan Kumar Saini — Portfolio (Next.js)

The portfolio of Aaryan Kumar Saini (QA Engineer & Developer), rebuilt from a
static HTML/CSS/JS site into a **Next.js 15 (App Router) + TypeScript** project.

The original cinematic design is preserved 1:1 — GSAP + ScrollTrigger scroll
choreography, Lenis smooth scrolling, the WebGL contact-smoke shader, the canvas
glow cursor, the preloader, and the pinned horizontal projects gallery.

## How it's structured

- `app/layout.tsx` — html/body shell, SEO metadata, self-hosted Google fonts
  (Cormorant Garamond / Space Grotesk / Space Mono) exposed as CSS variables.
- `app/page.tsx` — server-rendered page composing the section components.
- `app/globals.css` — the full original stylesheet (plus the small Lenis stylesheet).
- `components/` — one component per section (Hero, About, Skills, …) + chrome.
- `components/SiteEffects.tsx` — a `'use client'` island that runs the animations.
- `lib/siteEffects.js` — the ported `main.js`: all the imperative GSAP / Lenis /
  WebGL / cursor behaviour, now using the npm `gsap` + `lenis` packages.
- `public/` — videos, `forest.jpg`, and `resume.docx`.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build a static site

```bash
npm run build    # outputs a fully static site to ./out
```

`./out` is plain static files — deploy it to GitHub Pages, Netlify, Vercel, or
any static host (same model as the original site).

### Deploying to GitHub Pages

- **User/Org site** (`username.github.io`): deploy `out/` as-is.
- **Project site** (`username.github.io/<repo>`): set `basePath` and
  `assetPrefix` to `/<repo>` in `next.config.mjs` (commented placeholders are
  already there), then rebuild.

A `public/.nojekyll` file is included so GitHub Pages serves the `_next/` folder.
