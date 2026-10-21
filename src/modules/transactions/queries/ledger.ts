import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { selectBudgetCategoryLinks, selectBudgets } from "@/modules/budgets/api/budgets-repo";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { toBudget } from "@/modules/budgets/mappers/budget";
import { toCategory } from "@/modules/budgets/mappers/category";
import type { Budget } from "@/modules/budgets/types/budget";
import type { Category } from "@/modules/budgets/types/category";
import { getProjectDetail } from "@/modules/projects/queries/projects";
import type { ProjectDetail } from "@/modules/projects/types/project";
import { selectProjectAttachments } from "@/modules/receipts/api/attachments-repo";
import { toAttachment } from "@/modules/receipts/mappers/attachment";
import type { Attachment } from "@/modules/receipts/types/attachment";
import { selectWallets } from "@/modules/wallets/api/wallets-repo";
import { toWallet } from "@/modules/wallets/mappers/wallet";
import type { Wallet } from "@/modules/wallets/types/wallet";
import { selectTransactions } from "../api/transactions-repo";
import { toTransaction } from "../mappers/transaction";
import type { Transaction } from "../types/transaction";

/** Seluruh data buku kas satu proyek; semua angka diturunkan darinya oleh fungsi di lib/. */
export interface Ledger {
  project: ProjectDetail;
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  attachments: Attachment[];
}

export const getLedger = cache(async (db: Db, projectId: string): Promise<Ledger> => {
  const project = await getProjectDetail(db, projectId);
  const [walletRows, categoryRows, budgetRows, transactionRows, attachmentRows] = await Promise.all([
    selectWallets(db, projectId),
    selectCategories(db, projectId),
    selectBudgets(db, projectId),
    selectTransactions(db, projectId),
    selectProjectAttachments(db, projectId),
  ]);
  const links = await selectBudgetCategoryLinks(
    db,
    budgetRows.map((b) => b.id),
  );
  return {
    project,
    wallets: walletRows.map(toWallet),
    categories: categoryRows.map(toCategory),
    budgets: budgetRows.map((b) => toBudget(b, links.filter((l) => l.budgetId === b.id).map((l) => l.categoryId))),
    transactions: transactionRows.map(toTransaction),
    attachments: attachmentRows.map((row) => toAttachment(row, projectId)),
  };
});

export const refsOf = (ledger: Ledger) => ({ wallets: ledger.wallets, categories: ledger.categories, vehicles: ledger.project.vehicles, attachments: ledger.attachments });
