import type { NextConfig } from "next";

// Static export: `npm run build` writes a plain HTML/JS site to `out/`,
// which any free static host (Cloudflare Pages, Vercel, Netlify, GitHub Pages) can serve.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Lets phones on the home Wi-Fi use the dev server (development only).
  allowedDevOrigins: ["192.168.0.32", "192.168.*.*"],
};

export default nextConfig;
