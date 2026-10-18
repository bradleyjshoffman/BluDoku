import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Lets players add BluDoku to their home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BluDoku",
    short_name: "BluDoku",
    description: "Find the hidden cats! A cute logic puzzle with 200 levels.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff4ea",
    theme_color: "#cfd9ff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
