// Semua data buku kas satu proyek berada di bawah ["ledger", projectId] → satu invalidate setelah mutasi.
export const ledgerKeys = {
  all: (projectId: string) => ["ledger", projectId] as const,
  summary: (projectId: string) => [...ledgerKeys.all(projectId), "summary"] as const,
  calendar: (projectId: string, month: string) => [...ledgerKeys.all(projectId), "calendar", month] as const,
  day: (projectId: string, date: string) => [...ledgerKeys.all(projectId), "day", date] as const,
  transactions: (projectId: string) => [...ledgerKeys.all(projectId), "transactions"] as const,
  transaction: (projectId: string, id: string) => [...ledgerKeys.all(projectId), "transaction", id] as const,
  reference: (projectId: string) => [...ledgerKeys.all(projectId), "reference"] as const,
  budgets: (projectId: string) => [...ledgerKeys.all(projectId), "budgets"] as const,
  wallets: (projectId: string) => [...ledgerKeys.all(projectId), "wallets"] as const,
  wallet: (projectId: string, walletId: string) => [...ledgerKeys.all(projectId), "wallet", walletId] as const,
};
