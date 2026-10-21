"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AMOUNT, CARD_TITLE } from "@/components/app/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import { useWalletList } from "../hooks/use-wallets";
import { WALLET_KIND_LABELS } from "../lib/kinds";
import type { WalletListItem } from "../queries/wallets";
import { WalletForm } from "./wallet-form";

export function WalletList({ projectId }: { projectId: string }) {
  const { data } = useWalletList(projectId);
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  if (!data) return null;
  const active = data.wallets.filter((w) => !w.archived);
  const archived = data.wallets.filter((w) => w.archived);

  return (
    <div className="flex flex-col gap-4">
      {data.locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Dompet dikunci. Buka kembali proyek untuk mengubah.</AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-muted-foreground">Tap dompet untuk cek saldo dan mencocokkan dengan saldo asli.</p>

      {adding ? (
        <Card>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>Dompet baru</CardTitle>
          </CardHeader>
          <CardContent>
            <WalletForm projectId={projectId} vehicles={data.vehicles} onDone={() => setAdding(false)} />
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" disabled={data.locked} onClick={() => setAdding(true)}>
          + Tambah dompet
        </Button>
      )}

      {active.length ? <WalletLinks wallets={active} /> : <p className="text-sm text-muted-foreground">Belum ada dompet aktif.</p>}

      {archived.length > 0 && (
        <>
          <Button variant="ghost" className="self-start" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Sembunyikan" : "Tampilkan"} dompet diarsipkan ({archived.length})
          </Button>
          {showArchived && <WalletLinks wallets={archived} />}
        </>
      )}
    </div>
  );
}

function WalletLinks({ wallets }: { wallets: WalletListItem[] }) {
  return (
    <ul className="flex flex-col divide-y-2 border-2 bg-card shadow-md">
      {wallets.map((wallet) => (
        <li key={wallet.id}>
          <Link href={`/lainnya/dompet/${wallet.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{wallet.name}</p>
              <p className="truncate text-xs text-muted-foreground">{[WALLET_KIND_LABELS[wallet.kind], wallet.vehicleName, wallet.holder].filter(Boolean).join(" · ")}</p>
            </div>
            <span className={cn(AMOUNT, wallet.balance < 0 && "text-destructive")}>{formatRupiah(wallet.balance)}</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
