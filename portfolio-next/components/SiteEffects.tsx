"use client";

import { useEffect } from "react";
import initSiteEffects from "@/lib/siteEffects";

/* Client island: runs all the imperative GSAP / Lenis / WebGL / cursor logic
   against the server-rendered DOM once the page has mounted. Renders nothing. */
export default function SiteEffects() {
  useEffect(() => {
    initSiteEffects();
  }, []);

  return null;
}
