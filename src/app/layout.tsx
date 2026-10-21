import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import { Providers } from "@/lib/query-client";
import "./globals.css";

const head = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-head", display: "swap" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "UDP Tracker",
  description: "Catat dan pertanggungjawabkan UDP produksi.",
};

export const viewport: Viewport = {
  themeColor: "#ffdb33",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${head.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
