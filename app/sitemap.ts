import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Emitted as /sitemap.xml at build time. `force-static` is required because
   the site builds with `output: "export"` — there is no server to generate
   this on request. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      // no trailing slash — matches exactly what <link rel="canonical"> emits,
      // so an audit can't read the two as competing URLs
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
