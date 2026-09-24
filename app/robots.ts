import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Emitted as /robots.txt at build time (it replaces the old static
   public/robots.txt), so the Sitemap line follows SITE_URL — and with it any
   NEXT_PUBLIC_SITE_URL override — instead of a hard-coded domain. Everything
   stays crawlable, /_next/ included: Google needs those scripts and styles to
   render the page. `force-static` because the site builds with
   `output: "export"`. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
