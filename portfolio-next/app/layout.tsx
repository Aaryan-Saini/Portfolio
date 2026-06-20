import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Space_Grotesk, Space_Mono, Chakra_Petch } from "next/font/google";
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
      className={`${serif.variable} ${sans.variable} ${mono.variable} ${tech.variable} no-js`}
      suppressHydrationWarning
    >
      <body data-loading="true" suppressHydrationWarning>
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
