import type { Metadata, Viewport } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import { Providers } from "@/lib/query-client";
import "./globals.css";

// Sama dengan neobrutalism.com: Space Grotesk untuk judul, Geist untuk isi.
const head = Space_Grotesk({ subsets: ["latin"], variable: "--font-head", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "UDP Tracker",
  description: "Catat dan pertanggungjawabkan UDP produksi.",
  icons: { icon: "/icons/192", apple: "/icons/180" },
  appleWebApp: { capable: true, title: "UDP", statusBarStyle: "default" },
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
      {/* Ekstensi browser (mis. ColorZilla: cz-shortcut-listen) menambah atribut ke <body> sebelum hydrate.
          Hanya berlaku untuk atribut <body> ini sendiri, bukan anak-anaknya. */}
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
