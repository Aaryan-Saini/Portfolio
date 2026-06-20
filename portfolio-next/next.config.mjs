/** @type {import('next').NextConfig} */

// Set BASE_PATH at build time for a GitHub Pages *project* site, e.g.
//   BASE_PATH=/Portfolio npm run build
// Left empty for local dev / root-hosted deploys.
const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  // Produce a fully static site in ./out — deployable to GitHub Pages,
  // Netlify, Vercel, or any static host (same model as the original HTML site).
  output: "export",

  // Serve under /<repo> on GitHub Pages project sites (auto-prefixes /_next).
  basePath,
  assetPrefix: basePath || undefined,

  // Exposed to the client so raw asset paths (videos, resume, bg image) resolve.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },

  // No Next.js image-optimization server exists in a static export.
  images: { unoptimized: true },

  // Emit /about/index.html instead of /about.html — friendlier for static hosts.
  trailingSlash: true,
};

export default nextConfig;
