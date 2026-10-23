import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { selectBudgetCategoryLinks, selectBudgets } from "@/modules/budgets/api/budgets-repo";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { selectCategoryGroups } from "@/modules/budgets/api/category-groups-repo";
import { toBudget } from "@/modules/budgets/mappers/budget";
import { toCategory } from "@/modules/budgets/mappers/category";
import { toCategoryGroup } from "@/modules/budgets/mappers/category-group";
import type { Budget } from "@/modules/budgets/types/budget";
import type { Category } from "@/modules/budgets/types/category";
import type { CategoryGroup } from "@/modules/budgets/types/category-group";
import { getProjectDetail } from "@/modules/projects/queries/projects";
import type { ProjectDetail } from "@/modules/projects/types/project";
import { selectProjectAttachments } from "@/modules/receipts/api/attachments-repo";
import { toAttachment } from "@/modules/receipts/mappers/attachment";
import type { Attachment } from "@/modules/receipts/types/attachment";
import { selectWallets } from "@/modules/wallets/api/wallets-repo";
import { toWallet } from "@/modules/wallets/mappers/wallet";
import { selectUsersByIds } from "@/modules/users/api/users-repo";
import { toPerson } from "@/modules/users/mappers/user";
import type { Person } from "@/modules/users/types/user-list";
import type { Wallet } from "@/modules/wallets/types/wallet";
import { selectTransactions } from "../api/transactions-repo";
import { toTransaction } from "../mappers/transaction";
import type { Transaction } from "../types/transaction";

/** Seluruh data buku kas satu proyek; semua angka diturunkan darinya oleh fungsi di lib/. */
export interface Ledger {
  project: ProjectDetail;
  wallets: Wallet[];
  categories: Category[];
  groups: CategoryGroup[];
  budgets: Budget[];
  transactions: Transaction[];
  attachments: Attachment[];
  /** User yang dirujuk jejak penginput transaksi. */
  people: Person[];
}

export const getLedger = cache(async (db: Db, projectId: string): Promise<Ledger> => {
  const project = await getProjectDetail(db, projectId);
  const [walletRows, categoryRows, groupRows, budgetRows, transactionRows, attachmentRows] = await Promise.all([
    selectWallets(db, projectId),
    selectCategories(db, projectId),
    selectCategoryGroups(db, projectId),
    selectBudgets(db, projectId),
    selectTransactions(db, projectId),
    selectProjectAttachments(db, projectId),
  ]);
  const personIds = [...new Set(transactionRows.flatMap((t) => [t.createdBy, t.updatedBy]).filter((id): id is string => id !== null))];
  const [links, personRows] = await Promise.all([
    selectBudgetCategoryLinks(
      db,
      budgetRows.map((b) => b.id),
    ),
    selectUsersByIds(db, personIds),
  ]);
  return {
    project,
    wallets: walletRows.map(toWallet),
    categories: categoryRows.map(toCategory),
    groups: groupRows.map(toCategoryGroup),
    budgets: budgetRows.map((b) => toBudget(b, links.filter((l) => l.budgetId === b.id).map((l) => l.categoryId))),
    transactions: transactionRows.map(toTransaction),
    attachments: attachmentRows.map((row) => toAttachment(row, projectId)),
    people: personRows.map(toPerson),
  };
});

export const refsOf = (ledger: Ledger) => ({ wallets: ledger.wallets, categories: ledger.categories, vehicles: ledger.project.vehicles, attachments: ledger.attachments, people: ledger.people });
