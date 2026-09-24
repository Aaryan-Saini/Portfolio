"use client";

import { useEffect } from "react";
import initSiteEffects from "@/lib/siteEffects";

/* Client island: runs the original imperative GSAP / Lenis / cursor engine
   (hero, overlay nav, footer reveal + word cycle) against the DOM,
   plus the small IntersectionObserver the new editorial sections use for
   their [data-rvl] reveals. */
export default function SiteEffects() {
  useEffect(() => {
    initSiteEffects();

    /* [data-rvl] reveals for the editorial sections. Elements are picked up
       as they appear, not just once at boot: a section that re-renders or
       remounts (client state, hot reload) brings new [data-rvl] nodes, and
       an element nobody observes stays at opacity 0 for good. */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet<Element>();
    const io = reduce
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                (e.target as HTMLElement).classList.add("is-in");
                io?.unobserve(e.target);
              }
            }
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
        );
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-rvl]:not(.is-in)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (io) io.observe(el);
        else el.classList.add("is-in");
      });
    };
    scan();
    let raf = 0;
    const mo = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
