// Sumber tunggal nilai enum: dipakai skema DB (pgEnum), validasi zod, dan UI.
export const PROJECT_STATUSES = ["active", "done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const WALLET_KINDS = ["bank", "cash", "flazz", "ewallet", "reimburse"] as const;
export type WalletKind = (typeof WALLET_KINDS)[number];

export const CATEGORY_KINDS = ["expense", "income"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const BUDGET_BASES = ["per_pax_per_day", "per_vehicle_per_day", "per_vehicle", "per_day", "lump_sum"] as const;
export type BudgetBasis = (typeof BUDGET_BASES)[number];

export const TRANSACTION_TYPES = ["expense", "income", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const USER_STATUSES = ["pending", "active", "rejected"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Alasan pegangan dompet berakhir (spec pemegang dompet): dicabut PM, dikeluarkan dari proyek, akun ditolak. */
export const HOLDER_REVOKE_REASONS = ["revoked", "removed", "rejected"] as const;
export type HolderRevokeReason = (typeof HOLDER_REVOKE_REASONS)[number];
