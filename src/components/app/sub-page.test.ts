import { describe, expect, it } from "vitest";
import { subPageOf } from "./sub-page";

describe("subPageOf", () => {
  it("halaman bottom nav → null (header proyek)", () => {
    for (const path of ["/", "/kalender", "/transaksi", "/lainnya"]) expect(subPageOf(path, null)).toBeNull();
  });

  it("transaksi: kembali ke ?dari= bila ada, selain itu ke induknya", () => {
    expect(subPageOf("/transaksi/baru", null)).toEqual({ title: "Catat transaksi", back: "/" });
    expect(subPageOf("/transaksi/baru", "/kalender")).toEqual({ title: "Catat transaksi", back: "/kalender" });
    expect(subPageOf("/transaksi/abc", null)).toEqual({ title: "Ubah transaksi", back: "/transaksi" });
    expect(subPageOf("/transaksi/abc", "/lainnya/dompet/w1")).toEqual({ title: "Ubah transaksi", back: "/lainnya/dompet/w1" });
  });

  it("?dari= hanya path internal", () => {
    expect(subPageOf("/transaksi/abc", "https://jahat.example")).toEqual({ title: "Ubah transaksi", back: "/" });
  });

  it("sub-halaman Lainnya dan proyek", () => {
    expect(subPageOf("/lainnya/dompet", null)).toEqual({ title: "Dompet", back: "/lainnya" });
    expect(subPageOf("/lainnya/dompet/w1", null)).toEqual({ title: "Detail dompet", back: "/lainnya/dompet" });
    expect(subPageOf("/lainnya/kategori", null)).toEqual({ title: "Kategori", back: "/lainnya" });
    expect(subPageOf("/lainnya/pagu", null)).toEqual({ title: "Pagu", back: "/lainnya" });
    expect(subPageOf("/lainnya/ekspor", null)).toEqual({ title: "Ekspor laporan", back: "/lainnya" });
    expect(subPageOf("/lainnya/proyek", null)).toEqual({ title: "Pengaturan proyek", back: "/lainnya" });
    expect(subPageOf("/proyek", null)).toEqual({ title: "Proyek", back: "/" });
    expect(subPageOf("/proyek/baru", null)).toEqual({ title: "Proyek baru", back: "/proyek" });
  });

  it("profil riwayat", () => {
    expect(subPageOf("/lainnya/profil", null)).toEqual({ title: "Profil", back: "/lainnya" });
    expect(subPageOf("/lainnya/profil/u1", "/lainnya/anggota")).toEqual({ title: "Riwayat", back: "/lainnya/anggota" });
    expect(subPageOf("/lainnya/profil/u1/p1", null)).toEqual({ title: "Riwayat proyek", back: "/lainnya/profil/u1" });
  });
});
