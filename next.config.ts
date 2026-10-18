import type { NextConfig } from "next";

// Static export: `npm run build` writes a plain HTML/JS site to `out/`,
// which any free static host (Cloudflare Pages, Vercel, Netlify, GitHub Pages) can serve.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
