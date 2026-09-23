"use client";

import { useEffect } from "react";
import { createLenis, destroyLenis, getLenis, LENIS_OPTIONS } from "@/lib/lenis";

/* Lenis for routes that don't run the full site engine (the 404).
   The home page boots Lenis from lib/siteEffects.js and drives it off the
   GSAP ticker; here there is no GSAP, so Lenis runs its own rAF loop. Same
   tuning (LENIS_OPTIONS), same reduced-motion rule: under
   prefers-reduced-motion nothing is created and the page scrolls natively.

   Only destroys what it created — if an instance already exists (client-side
   navigation from the home page) it is left to its owner. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (getLenis()) return;

    createLenis({ ...LENIS_OPTIONS, autoRaf: true });
    return () => {
      destroyLenis();
    };
  }, []);

  return null;
}
