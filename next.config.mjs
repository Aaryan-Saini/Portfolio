/** @type {import('next').NextConfig} */

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// This config file's own directory = the real project root.
const projectRoot = dirname(fileURLToPath(import.meta.url));

// Set BASE_PATH at build time for a GitHub Pages *project* site, e.g.
//   BASE_PATH=/Portfolio npm run build
// Left empty for local dev / root-hosted deploys.
const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  // Produce a fully static site in ./out — deployable to GitHub Pages,
  // Netlify, Vercel, or any static host (same model as the original HTML site).
  output: "export",

  // Pin the workspace root so Next doesn't infer it from a stray lockfile
  // elsewhere on the machine (e.g. C:\Users\tech\package-lock.json).
  outputFileTracingRoot: projectRoot,

  // Serve under /<repo> on GitHub Pages project sites (auto-prefixes /_next).
  basePath,
  assetPrefix: basePath || undefined,

  // Exposed to the client so raw asset paths (videos, resume, bg image) resolve.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },

  // No Next.js image-optimization server exists in a static export.
  images: { unoptimized: true },

};

export default nextConfig;
