"use client";

import { Camera, ExternalLink, FileText, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useUploadReceipt } from "../hooks/use-upload-receipt";
import type { AttachmentDraft, ReceiptScan, ScanResult } from "../types/receipt";

const MAX_ATTACHMENTS = 5;

/** Lampiran di form: draf baru (pratinjau object URL) atau yang sudah tersimpan (`url` route app). */
export interface ReceiptItem extends AttachmentDraft {
  ocr: ReceiptScan | null;
  previewUrl: string;
}

interface ReceiptPickerProps {
  projectId: string;
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
  onScanned: (result: ScanResult) => void;
  disabled?: boolean;
}

export function ReceiptPicker({ projectId, items, onChange, onScanned, disabled }: ReceiptPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadReceipt(projectId);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ReceiptItem | null>(null);
  const full = items.length >= MAX_ATTACHMENTS;

  function pick(file: File | undefined) {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: ({ attachment, scan }) => {
        const previewUrl = URL.createObjectURL(file);
        onChange([...items, { ...attachment, ocr: scan.ok ? scan.scan : null, previewUrl }]);
        onScanned(scan);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function remove(item: ReceiptItem) {
    if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
    onChange(items.filter((i) => i.pathname !== item.pathname));
    setConfirmRemove(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button type="button" size="lg" variant="secondary" className="h-14 w-full text-base" disabled={disabled || upload.isPending || full} onClick={() => input.current?.click()}>
        {upload.isPending ? (
          <>
            <Spinner /> Membaca bon…
          </>
        ) : (
          <>
            <Camera /> {items.length ? "Tambah bon" : "Scan Bon"}
          </>
        )}
      </Button>

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Lampiran bon">
          {items.map((item) => (
            <li key={item.pathname} className="relative">
              {confirmRemove === item.pathname ? (
                <div className="flex size-20 flex-col items-stretch justify-center gap-1 border-2 bg-background p-1">
                  <Button type="button" size="sm" variant="destructive" className="h-8 text-xs" onClick={() => remove(item)}>
                    Ya, hapus
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setConfirmRemove(null)}>
                    Batal
                  </Button>
                </div>
              ) : (
                <>
                  {item.mimeType === "application/pdf" ? (
                    // PDF dibuka di tab baru: Safari iOS tidak bisa menampilkan PDF dengan baik di dalam dialog.
                    <a href={item.previewUrl} target="_blank" rel="noreferrer" className="flex size-20 items-center justify-center border-2 bg-accent">
                      <FileText className="size-8" aria-label="PDF bon" />
                    </a>
                  ) : (
                    <button type="button" aria-label="Lihat foto bon" className="flex size-20 overflow-hidden border-2 bg-accent" onClick={() => setViewing(item)}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- object URL / route privat, bukan aset statis */}
                      <img src={item.previewUrl} alt="" className="size-full object-cover" />
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      aria-label="Hapus lampiran"
                      className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border-2 bg-background"
                      onClick={() => setConfirmRemove(item.pathname)}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent showCloseButton={false} className="gap-2 p-2 sm:max-w-lg">
          <DialogTitle className="sr-only">Foto bon</DialogTitle>
          {viewing && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- object URL / route privat, bukan aset statis */}
              <img src={viewing.previewUrl} alt="Foto bon" className="max-h-[75dvh] w-full border-2 bg-accent object-contain" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" render={<a href={viewing.previewUrl} target="_blank" rel="noreferrer" />} nativeButton={false}>
                  <ExternalLink /> Buka ukuran asli
                </Button>
                <DialogClose render={<Button className="flex-1" />}>Tutup</DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
