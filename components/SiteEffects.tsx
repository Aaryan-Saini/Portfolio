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

    /* [data-rvl] reveals for the editorial sections */
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rvl]"));
    if (!els.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
