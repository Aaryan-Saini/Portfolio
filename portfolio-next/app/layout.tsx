import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Space_Grotesk, Space_Mono, Chakra_Petch, Roboto } from "next/font/google";
import "./globals.css";

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

/* Squared techno display face — used only by the preloader HUD headline. */
const tech = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tech",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aaryan Kumar Saini — QA Engineer & Developer",
  description:
    "Aaryan Kumar Saini — QA Engineer, Data Analyst & Web Developer. Building quality-driven digital experiences through testing, code, and data. Written in logic, built with care.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16100f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} ${tech.variable} ${body.variable} no-js`}
      suppressHydrationWarning
    >
      <body data-loading="true" suppressHydrationWarning>
        {/* Critical CSS, inlined so the loader covers the viewport on the very
            first paint — before the external stylesheet downloads. Without this
            the #preloader cover + scroll-lock rules live only in the 54KB CSS,
            so the home page flashed through until that file arrived. The full
            HUD styling comes with the main stylesheet moments later. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              '#preloader{position:fixed;inset:0;z-index:9500;background:#0c0807}body[data-loading="true"]{overflow:hidden;height:100vh}',
          }}
        />
        {/* Runs synchronously before the preloader is parsed, so the loader is
            shown on the very first paint (no flash of the home page underneath):
            ·  remove `no-js` immediately — `.no-js #preloader{display:none}` is
               only a JS-disabled fallback; leaving it until hydration let the
               page show through first. If JS is off this never runs, so the
               fallback still applies.
            ·  on a same-tab reload (session flag set) mark <html> to skip the
               loader before first paint. A new tab is a fresh session. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove("no-js");try{if(sessionStorage.getItem("ak_loaded"))document.documentElement.classList.add("ak-skip-loader")}catch(e){}`,
          }}
        />
        {children}
        {/* Failsafe: if the JS bundle never runs, don't leave the page
            stuck behind the preloader. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){if(document.body.getAttribute("data-loading")==="true"){document.body.removeAttribute("data-loading");document.body.classList.add("is-ready");var p=document.getElementById("preloader");if(p)p.style.display="none";}},14000);`,
          }}
        />
      </body>
    </html>
  );
}
