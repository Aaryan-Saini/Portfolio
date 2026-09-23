import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Cormorant_Garamond, Space_Grotesk, Space_Mono, Roboto, Pinyon_Script } from "next/font/google";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  profilePageSchema,
} from "@/lib/site";
import { asset } from "@/lib/asset";
/* Lenis' own base rules (height:auto, overflow:clip while stopped, overscroll
   containment for every data-lenis-prevent-* variant, iframe pointer-events)
   — imported first so globals.css can layer the site's guard on top. */
import "lenis/dist/lenis.css";
import "./globals.css";
import "./legacy.css";

/* Self-hosted Google fonts → exposed as the CSS variables globals.css expects
   (--font-serif / --font-sans / --font-mono). No layout shift, no extra request. */
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

/* Roboto — body / running copy face. Light (300) is the base reading weight;
   400/500/700 are loaded for inline emphasis (<b>, <strong>, lede highlights). */
const body = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

/* Pinyon Script — the "signature" script face for editorial accents
   (stamp signature, "Let's Catchup" swashes, script eyebrows). */
const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

/* NB: Chakra Petch (preloader HUD) and Caveat (footer annotation note) were
   dropped — no rendered element uses them; the CSS that referenced them
   (.ld-*, .footer__note-text) belongs to components that are no longer on the
   page, so removing the files changes nothing visually. */

export const metadata: Metadata = {
  /* Resolves every relative URL below (canonical, og:image, twitter:image)
     into the absolute form those tags require. */
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  keywords: [
    "Aaryan Kumar Saini",
    "QA Engineer",
    "Software Tester",
    "Test Automation",
    "Playwright",
    "Selenium",
    "Web Developer",
    "Portfolio",
  ],
  /* One page, one canonical — stops the vercel.app URL, any custom domain and
     any ?query variant from being indexed as separate documents. */
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Aaryan Kumar Saini — QA Engineer & Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.jpg",
        alt: "Aaryan Kumar Saini — QA Engineer & Developer",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070817",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} ${body.variable} ${script.variable} no-js`}
      suppressHydrationWarning
      /* the buttons' torn-edge mask sprite — set here (not in CSS) so the
         deploy basePath is honoured; see the BUTTONS block in globals.css */
      style={{ "--btn-mask": `url("${asset("/mask.png")}")` } as CSSProperties}
    >
      <body className="is-ready" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html:
              /* no-js off; then decide the boot overlay before first paint: a
                 repeat visit in this tab (or reduced motion) hides the veil
                 outright, a first visit is scroll-locked from the very first
                 frame — see components/PreloaderEditorial.tsx */
              'document.documentElement.classList.remove("no-js");' +
              'try{var s=sessionStorage.getItem("plx_seen")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches;' +
              'document.documentElement.classList.add(s?"plx-seen":"plx-lock")}catch(e){document.documentElement.classList.add("plx-lock")}',
          }}
        />
        {/* schema.org Person — see lib/site.ts. Rendered as a plain script tag
            (not next/script) so it is present in the static HTML for crawlers
            that never execute JavaScript. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
