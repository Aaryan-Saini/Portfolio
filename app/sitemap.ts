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
      // image sitemap entries: the portrait and the social card, so both can
      // surface in image search for the name
      images: [`${SITE_URL}/stamp-portrait.webp`, `${SITE_URL}/og.jpg`],
    },
    {
      // the résumé is its own indexable document (Google indexes PDFs and
      // takes the result title from the PDF's Title metadata)
      url: `${SITE_URL}/resume.pdf`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
