import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { AMOUNT, CARD_TITLE, LABEL } from "@/components/app/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateLong } from "@/modules/shared/lib/date";
import { formatRupiah } from "@/modules/shared/lib/money";
import { describeDifference } from "@/modules/wallets/lib/balance-check";
import { describeActiveHolder, describeRevokedHolder } from "@/modules/wallets/lib/holder-history";
import { reimburseStatus } from "@/modules/wallets/lib/reimburse";
import type { HeldWalletSummary, PersonProjectSummary } from "../types/history";

/** Ringkasan riwayat satu orang di satu proyek (spec profil riwayat). `href` = kartu bisa dibuka ke rinciannya. */
export function ProjectHistoryCard({ summary, href }: { summary: PersonProjectSummary; href?: string }) {
  const { project, wallets, input } = summary;
  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>{href ? <Link href={href}>{project.name}</Link> : project.name}</CardTitle>
        <CardDescription>
          {project.divisionName} · {formatDateLong(project.startDate)} – {formatDateLong(project.endDate)}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Badge variant={project.status === "done" ? "outline" : "default"}>{project.status === "done" ? "Selesai" : "Berjalan"}</Badge>
          {href && (
            <Link href={href} aria-label={`Rincian ${project.name}`}>
              <ChevronRight className="size-5" />
            </Link>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {wallets.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className={LABEL}>Dompet yang dipegang</p>
            {wallets.map((w) => (
              <HeldWallet key={w.walletId} wallet={w} />
            ))}
          </section>
        )}
        <section className="flex flex-col gap-1">
          <p className={LABEL}>Yang diinput</p>
          {input.count ? (
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <Stat label="Transaksi" value={String(input.count)} />
              <Stat label="Masuk" value={formatRupiah(input.income)} />
              <Stat label="Keluar" value={formatRupiah(input.expense)} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada transaksi yang diinput.</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function HeldWallet({ wallet }: { wallet: HeldWalletSummary }) {
  const position = wallet.kind === "reimburse" ? reimburseStatus(wallet.balance) : wallet.balance >= 0 ? "Dikembalikan ke kantor" : "Perlu reimburse";
  return (
    <div className="flex flex-col gap-2 border-2 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium">{wallet.name}</p>
        <p className={cn(AMOUNT, wallet.balance < 0 && "text-destructive")}>{formatRupiah(wallet.balance)}</p>
      </div>
      <p className="text-xs text-muted-foreground">{position}</p>
      <ul className="flex flex-col gap-0.5 text-xs">
        {wallet.periods.map((p) => (
          <li key={p.id}>{p.revokedAt ? describeRevokedHolder(p) : `${describeActiveHolder(p)} · masih memegang`}</li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Saldo awal" value={formatRupiah(wallet.openingBalance)} />
        <Stat label="Masuk" value={formatRupiah(wallet.moneyIn)} />
        <Stat label="Keluar" value={formatRupiah(wallet.moneyOut)} />
      </dl>
      {wallet.lastCheckDifference !== null && <p className="text-xs">Cek saldo terakhir: {describeDifference(wallet.lastCheckDifference)}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn(AMOUNT, "truncate")}>{value}</dd>
    </div>
  );
}
