import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Dev: Next 16 menolak origin selain localhost, sehingga halaman yang dibuka dari HP lewat IP laptop
// tidak pernah hydrate (tombol tidak bereaksi). Izinkan IPv4 LAN milik laptop ini saja.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net !== undefined && net.family === "IPv4" && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanHosts,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
