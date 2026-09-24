import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/site";
import { asset } from "@/lib/asset";

/* Emitted as /manifest.webmanifest and linked from every page — the name,
   icons and colours Chrome uses for the site (tab, install prompt, Android
   home screen). `force-static` because the site builds with
   `output: "export"`; asset() keeps the paths right under a basePath. */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#1a1020",
    theme_color: "#1a1020",
    icons: [
      { src: asset("/icon.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: asset("/apple-icon.png"), sizes: "180x180", type: "image/png" },
    ],
  };
}
