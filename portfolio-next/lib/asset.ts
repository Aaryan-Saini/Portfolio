// Prefix a /public asset path with the deploy basePath (e.g. "/Portfolio" on
// GitHub Pages project sites). Empty in local dev. `basePath` in next.config
// auto-prefixes /_next assets, but NOT raw paths in <video>/<a>/CSS — use this.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (p: string): string =>
  `${BASE_PATH}${p.startsWith("/") ? p : `/${p}`}`;
