import { formatRupiah } from "@/modules/shared/lib/money";
import { describeDifference } from "@/modules/wallets/lib/balance-check";
import { reimburseStatus } from "@/modules/wallets/lib/reimburse";
import type { WalletBalance } from "@/modules/wallets/types/wallet";

export interface AttentionItem {
  kind: "receipt" | "difference" | "negative" | "reimburse";
  label: string;
  href: string;
}

/** Cek saldo terbaru satu dompet; `adjusted` = selisihnya sudah dicatat sebagai transaksi. */
export interface LatestCheck {
  walletId: string;
  difference: number;
  adjusted: boolean;
}

const walletHref = (id: string) => `/lainnya/dompet/${id}`;

/** `rows` = cek saldo proyek terbaru dulu → satu cek terbaru per dompet; `adjusted` bila ada transaksi penyesuaiannya. */
export function latestChecks(rows: { id: string; walletId: string; actualBalance: number; computedBalance: number }[], transactions: { balanceCheckId: string | null }[]): LatestCheck[] {
  const adjusted = new Set(transactions.flatMap((t) => (t.balanceCheckId ? [t.balanceCheckId] : [])));
  const seen = new Set<string>();
  const checks: LatestCheck[] = [];
  for (const row of rows) {
    if (seen.has(row.walletId)) continue;
    seen.add(row.walletId);
    checks.push({ walletId: row.walletId, difference: row.actualBalance - row.computedBalance, adjusted: adjusted.has(row.id) });
  }
  return checks;
}

/** `wallets` = dompet aktif saja. Urutan: bon, selisih cek saldo, dompet minus, reimburse. */
export function attentionItems(input: { missingReceipts: number; wallets: WalletBalance[]; latestChecks: LatestCheck[] }): AttentionItem[] {
  const byId = new Map(input.wallets.map((w) => [w.id, w]));
  const items: AttentionItem[] = [];
  if (input.missingReceipts > 0) {
    items.push({ kind: "receipt", label: `${input.missingReceipts} pengeluaran belum ada bon`, href: "/transaksi?bon=belum" });
  }
  for (const check of input.latestChecks) {
    const wallet = byId.get(check.walletId);
    if (!wallet || check.difference === 0 || check.adjusted) continue;
    const difference = describeDifference(check.difference); // "Kurang Rp …" → "kurang Rp …"
    items.push({ kind: "difference", label: `${wallet.name}: selisih ${difference[0].toLowerCase()}${difference.slice(1)} belum dicatat`, href: walletHref(wallet.id) });
  }
  for (const wallet of input.wallets) {
    if (wallet.kind !== "reimburse" && wallet.balance < 0) {
      items.push({ kind: "negative", label: `${wallet.name} minus ${formatRupiah(-wallet.balance)}`, href: walletHref(wallet.id) });
    }
  }
  for (const wallet of input.wallets) {
    if (wallet.kind === "reimburse" && wallet.balance !== 0) {
      items.push({ kind: "reimburse", label: `${wallet.name}: ${reimburseStatus(wallet.balance)}`, href: walletHref(wallet.id) });
    }
  }
  return items;
}
