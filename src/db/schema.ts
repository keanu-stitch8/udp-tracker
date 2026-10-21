// Skema lengkap (spec §3.1). Kolom TS camelCase → kolom DB snake_case (casing: "snake_case").
import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
// Import relatif (bukan "@/"): drizzle-kit memuat file ini di luar resolver tsconfig paths.
import { BUDGET_BASES, CATEGORY_KINDS, PROJECT_STATUSES, TRANSACTION_TYPES, WALLET_KINDS } from "../modules/shared/types/enums";

export const projectStatus = pgEnum("project_status", PROJECT_STATUSES);
export const walletKind = pgEnum("wallet_kind", WALLET_KINDS);
export const categoryKind = pgEnum("category_kind", CATEGORY_KINDS);
export const budgetBasis = pgEnum("budget_basis", BUDGET_BASES);
export const transactionType = pgEnum("transaction_type", TRANSACTION_TYPES);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  location: text().notNull().default(""),
  startDate: date({ mode: "string" }).notNull(),
  endDate: date({ mode: "string" }).notNull(),
  pax: integer().notNull().default(9),
  status: projectStatus().notNull().default("active"),
  driveFolderId: text(),
  sheetId: text(),
  sheetUrl: text(),
  ...timestamps,
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text().notNull(),
    plate: text(),
    sortOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index("vehicles_project_idx").on(t.projectId)],
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: walletKind().notNull(),
    name: text().notNull(),
    holder: text(),
    vehicleId: uuid().references(() => vehicles.id, { onDelete: "set null" }),
    openingBalance: integer().notNull().default(0),
    sortOrder: integer().notNull().default(0),
    archived: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index("wallets_project_idx").on(t.projectId)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: categoryKind().notNull(),
    name: text().notNull(),
    icon: text().notNull(),
    isVehicleRelated: boolean().notNull().default(false),
    isAdminFee: boolean().notNull().default(false),
    // Pemasukan dari kantor (UDP). "UDP diterima" = Σ pemasukan berkategori ini (spec §3.3).
    isOfficeFunding: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    archived: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index("categories_project_idx").on(t.projectId)],
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text().notNull(),
    rate: integer().notNull(),
    basis: budgetBasis().notNull(),
    // Jumlah hari khusus pagu (mis. 6 hari kerja); null = ikut periode proyek.
    days: integer(),
    note: text(),
    ...timestamps,
  },
  (t) => [index("budgets_project_idx").on(t.projectId), check("budgets_rate_nonnegative", sql`${t.rate} >= 0`), check("budgets_days_positive", sql`${t.days} >= 1`)],
);

export const budgetCategories = pgTable(
  "budget_categories",
  {
    budgetId: uuid()
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.budgetId, t.categoryId] })],
);

export const balanceChecks = pgTable(
  "balance_checks",
  {
    id: uuid().primaryKey().defaultRandom(),
    walletId: uuid()
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(),
    actualBalance: integer().notNull(),
    computedBalance: integer().notNull(),
    note: text(),
    ...timestamps,
  },
  (t) => [index("balance_checks_wallet_idx").on(t.walletId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: transactionType().notNull(),
    date: date({ mode: "string" }).notNull(),
    amount: integer().notNull(),
    categoryId: uuid().references(() => categories.id, { onDelete: "restrict" }),
    walletId: uuid()
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    toWalletId: uuid().references((): AnyPgColumn => wallets.id, { onDelete: "restrict" }),
    adminFee: integer().notNull().default(0),
    vehicleId: uuid().references(() => vehicles.id, { onDelete: "set null" }),
    merchant: text(),
    note: text(),
    balanceCheckId: uuid().references(() => balanceChecks.id, { onDelete: "set null" }),
    deletedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("transactions_project_date_idx").on(t.projectId, t.date),
    check("transactions_amount_positive", sql`${t.amount} > 0`),
    check("transactions_admin_fee_nonnegative", sql`${t.adminFee} >= 0`),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid().primaryKey().defaultRandom(),
    transactionId: uuid()
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    blobUrl: text().notNull(),
    blobPathname: text().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    ocrJson: jsonb(),
    driveFileId: text(),
    driveUrl: text(),
    ...timestamps,
  },
  (t) => [index("attachments_transaction_idx").on(t.transactionId)],
);

export const googleCredentials = pgTable("google_credentials", {
  id: text().primaryKey().default("default"),
  data: text().notNull(),
  account: text(),
  ...timestamps,
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid().primaryKey().defaultRandom(),
    ip: text().notNull(),
    success: boolean().notNull(),
    attemptedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_ip_time_idx").on(t.ip, t.attemptedAt)],
);
