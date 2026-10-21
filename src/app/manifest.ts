import type { MetadataRoute } from "next";

// PWA (spec §10): "Add to Home Screen" tanpa service worker. Ikon dari src/app/icons/[name]/route.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UDP Tracker",
    short_name: "UDP",
    description: "Catat dan pertanggungjawabkan UDP produksi.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffdb33",
    theme_color: "#ffdb33",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
