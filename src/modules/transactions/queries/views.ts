import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { sortCategoriesForPicker } from "@/modules/budgets/lib/category-order";
import type { Category } from "@/modules/budgets/types/category";
import type { CategoryGroup } from "@/modules/budgets/types/category-group";
import type { Vehicle } from "@/modules/projects/types/project";
import type { ProjectStatus } from "@/modules/shared/types/enums";
import type { Wallet } from "@/modules/wallets/types/wallet";
import { toTransactionViews } from "../lib/ledger";
import type { TransactionView } from "../types/transaction";
import { getLedger, refsOf } from "./ledger";

export const listTransactionViews = cache(async (db: Db, projectId: string): Promise<TransactionView[]> => {
  const ledger = await getLedger(db, projectId);
  return toTransactionViews(ledger.transactions, refsOf(ledger));
});

export const getTransactionView = cache(async (db: Db, projectId: string, id: string): Promise<TransactionView> => {
  const view = (await listTransactionViews(db, projectId)).find((t) => t.id === id);
  if (!view) throw new NotFoundError("Transaksi tidak ditemukan.");
  return view;
});

/** Data untuk form transaksi. */
export interface TransactionReference {
  project: { id: string; startDate: string; endDate: string; status: ProjectStatus };
  wallets: Wallet[];
  categories: Category[];
  groups: CategoryGroup[];
  vehicles: Vehicle[];
  /** Dompet pengeluaran terakhir (bukan Reimburse) → default pilihan dompet (spec §5). */
  lastWalletId: string | null;
}

export const getTransactionReference = cache(async (db: Db, projectId: string): Promise<TransactionReference> => {
  const ledger = await getLedger(db, projectId);
  const { project } = ledger;
  const reimburseWallets = new Set(ledger.wallets.filter((w) => w.kind === "reimburse").map((w) => w.id));
  return {
    project: { id: project.id, startDate: project.startDate, endDate: project.endDate, status: project.status },
    wallets: ledger.wallets.filter((w) => !w.archived),
    categories: sortCategoriesForPicker(ledger.categories.filter((c) => !c.archived)),
    groups: ledger.groups,
    vehicles: project.vehicles,
    lastWalletId: ledger.transactions.find((t) => t.type === "expense" && !reimburseWallets.has(t.walletId))?.walletId ?? null,
  };
});
