import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Dev: Next 16 menolak origin selain localhost, sehingga halaman yang dibuka dari HP lewat IP laptop
// tidak pernah hydrate (tombol tidak bereaksi). Izinkan IPv4 LAN laptop + rentang IP privat (wildcard per
// segmen), karena daftar ini hanya dihitung saat `next dev` start: ganti Wi-Fi/DHCP tidak perlu restart.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net !== undefined && net.family === "IPv4" && !net.internal)
  .map((net) => net!.address);
const privateRanges = ["192.168.*.*", "10.*.*.*", ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`)];

const nextConfig: NextConfig = {
  allowedDevOrigins: [...lanHosts, ...privateRanges],
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
