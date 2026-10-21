"use client";

import { ExternalLink, FileSpreadsheet, FolderOpen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CARD_TITLE } from "@/components/app/typography";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useDisconnectGoogle, useExportReport } from "../hooks/use-export";
import type { ExportStatus } from "../queries/export-status";

export function ExportPanel({ status }: { status: ExportStatus }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const exportReport = useExportReport(status.projectId);
  const disconnect = useDisconnectGoogle();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const links = exportReport.data ?? (status.sheetUrl ? { sheetUrl: status.sheetUrl, folderUrl: status.folderUrl } : null);

  // Hasil kembali dari Google (/api/auth/google/callback) → toast sekali, lalu bersihkan query.
  const googleResult = searchParams.get("google");
  const googleMessage = searchParams.get("pesan");
  useEffect(() => {
    if (!googleResult) return;
    if (googleResult === "ok") toast.success("Akun Google terhubung.");
    else toast.error(googleMessage ?? "Gagal menghubungkan akun Google.");
    router.replace(pathname);
  }, [googleResult, googleMessage, pathname, router]);

  function runExport() {
    exportReport.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(result.uploaded ? `Laporan jadi. ${result.uploaded} foto bon diunggah ke Drive.` : "Laporan jadi.");
        router.refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Akun Google</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {status.google.connected ? (
            <>
              <p>
                Terhubung: <span className="font-head font-bold">{status.google.account ?? "akun Google"}</span>
              </p>
              {confirmDisconnect ? (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground">Ekspor berikutnya perlu menghubungkan akun lagi. Sheet dan folder di Drive tidak dihapus.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={disconnect.isPending}
                      onClick={() =>
                        disconnect.mutate(undefined, {
                          onSuccess: () => {
                            setConfirmDisconnect(false);
                            toast("Akun Google diputuskan.");
                            router.refresh();
                          },
                          onError: (error) => toast.error(error.message),
                        })
                      }
                    >
                      Ya, putuskan
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmDisconnect(false)}>
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="self-start" onClick={() => setConfirmDisconnect(true)}>
                  Putuskan…
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Laporan dibuat di Google Drive akunmu. Hubungkan sekali dari laptop (localhost): Google menolak alamat IP. Setelah terhubung, ekspor bisa dari HP.</p>
              {/* Navigasi penuh: route mengarahkan ke halaman consent Google. */}
              <a href="/api/auth/google/start" className={buttonVariants({ className: "self-start" })}>
                Hubungkan akun Google
              </a>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Laporan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">Membuat Google Sheet baru (Rekap, Detail, Harian, Pagu) dan mengunggah foto bon yang belum ada ke folder Drive proyek.</p>
          <Button disabled={!status.google.connected || exportReport.isPending} onClick={runExport}>
            {exportReport.isPending ? <Spinner /> : <FileSpreadsheet />}
            {exportReport.isPending ? "Mengekspor… (bisa 1–2 menit)" : "Ekspor ke Google Sheets"}
          </Button>
          {links && (
            <div className="flex flex-col gap-2">
              <a href={links.sheetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                <ExternalLink className="size-4" /> Buka Sheet terakhir
              </a>
              {links.folderUrl && (
                <a href={links.folderUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                  <FolderOpen className="size-4" /> Buka folder Drive
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
