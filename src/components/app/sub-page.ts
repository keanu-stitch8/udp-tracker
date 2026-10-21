// Header sub-halaman: judul + tujuan tombol kembali. Halaman bottom nav (Beranda, Kalender, Transaksi, Lainnya) → null,
// yang tetap memakai header proyek.
import { safeNextPath } from "@/modules/auth/lib/safe-next";

export interface SubPage {
  title: string;
  back: string;
}

const LAINNYA: Record<string, string> = {
  "/lainnya/dompet": "Dompet",
  "/lainnya/kategori": "Kategori",
  "/lainnya/pagu": "Pagu",
  "/lainnya/proyek": "Pengaturan proyek",
};

/** `from` = query `?dari=`: form transaksi kembali ke halaman asalnya (sama dengan tujuan setelah simpan). */
export function subPageOf(pathname: string, from: string | null): SubPage | null {
  const backTo = (parent: string) => (from ? safeNextPath(from) : parent);
  if (pathname === "/transaksi/baru") return { title: "Catat transaksi", back: backTo("/") };
  if (pathname.startsWith("/transaksi/")) return { title: "Ubah transaksi", back: backTo("/transaksi") };
  if (LAINNYA[pathname]) return { title: LAINNYA[pathname], back: "/lainnya" };
  if (pathname.startsWith("/lainnya/dompet/")) return { title: "Detail dompet", back: "/lainnya/dompet" };
  if (pathname === "/proyek") return { title: "Proyek", back: "/" };
  if (pathname === "/proyek/baru") return { title: "Proyek baru", back: "/proyek" };
  return null;
}
