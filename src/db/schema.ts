// Skema lengkap (spec §3.1). Kolom TS camelCase → kolom DB snake_case (casing: "snake_case").
import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, time, timestamp, uniqueIndex, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
// Import relatif (bukan "@/"): drizzle-kit memuat file ini di luar resolver tsconfig paths.
import { BUDGET_BASES, CATEGORY_KINDS, HOLDER_REVOKE_REASONS, PROJECT_STATUSES, TRANSACTION_TYPES, USER_STATUSES, WALLET_KINDS } from "../modules/shared/types/enums";

export const projectStatus = pgEnum("project_status", PROJECT_STATUSES);
export const walletKind = pgEnum("wallet_kind", WALLET_KINDS);
export const categoryKind = pgEnum("category_kind", CATEGORY_KINDS);
export const budgetBasis = pgEnum("budget_basis", BUDGET_BASES);
export const transactionType = pgEnum("transaction_type", TRANSACTION_TYPES);
export const userStatus = pgEnum("user_status", USER_STATUSES);
export const holderRevokeReason = pgEnum("holder_revoke_reason", HOLDER_REVOKE_REASONS);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// Divisi (mis. MKK, MLSC): wadah proyek. Nama diatur di UI; migrasi 0007 membuat "Umum" untuk proyek lama.
export const divisions = pgTable("divisions", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  ...timestamps,
});

export const projects = pgTable(
  "projects",
  {
    id: uuid().primaryKey().defaultRandom(),
    divisionId: uuid()
      .notNull()
      .references(() => divisions.id, { onDelete: "restrict" }),
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
  },
  (t) => [index("projects_division_idx").on(t.divisionId)],
);

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

// Grup kategori pengeluaran, mengikuti judul RAB (spec grup kategori). Urutan tampil A–Z, "Lain-lain" terakhir.
export const categoryGroups = pgTable(
  "category_groups",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [index("category_groups_project_idx").on(t.projectId)],
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
    // Wajib untuk pengeluaran, kosong untuk pemasukan. Tanpa onDelete: hapus grup berisi ditolak (NO ACTION, dicek di akhir
    // statement sehingga hapus proyek yang meng-cascade grup + kategori tetap jalan).
    groupId: uuid().references(() => categoryGroups.id),
    ...timestamps,
  },
  (t) => [
    index("categories_project_idx").on(t.projectId),
    check("categories_group_by_kind", sql`(${t.kind} = 'expense') = (${t.groupId} is not null)`),
  ],
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
    /** Jam transaksi WIB, 24 jam (spec jam transaksi). Postgres mengembalikan "HH:mm:ss". */
    time: time({ precision: 0 }).notNull(),
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
    /** Jejak penginput (spec akses §7). Data lama kosong. */
    createdBy: uuid().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    updatedBy: uuid().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
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

// Akun login Google (spec akses multi-divisi §1). Email disimpan huruf kecil; status & peran dibaca tiap request.
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text(),
  imageUrl: text(),
  status: userStatus().notNull().default("pending"),
  isRoot: boolean().notNull().default(false),
  lastLoginAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const divisionPms = pgTable(
  "division_pms",
  {
    divisionId: uuid()
      .notNull()
      .references(() => divisions.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.divisionId, t.userId] }), index("division_pms_user_idx").on(t.userId)],
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] }), index("project_members_user_idx").on(t.userId)],
);

// Undangan PM untuk email yang belum pernah login; berubah jadi project_members saat login pertama.
// Pemegang dompet (spec pemegang dompet): anggota hanya bisa mencatat di dompet yang dia pegang.
// Satu baris = satu periode pegangan; tidak pernah dihapus, hanya dicabut (`revoked_at`) agar pertanggungjawaban tetap tercatat.
export const walletHolders = pgTable(
  "wallet_holders",
  {
    id: uuid().primaryKey().defaultRandom(),
    walletId: uuid()
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Ditugaskan pada. */
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    assignedBy: uuid().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    revokedAt: timestamp({ withTimezone: true }),
    revokedBy: uuid().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    revokeReason: holderRevokeReason(),
  },
  (t) => [
    uniqueIndex("wallet_holders_active_idx").on(t.walletId, t.userId).where(sql`${t.revokedAt} is null`),
    index("wallet_holders_user_idx").on(t.userId),
  ],
);

export const projectInvitations = pgTable(
  "project_invitations",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    email: text().notNull(),
    invitedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.email] }), index("project_invitations_email_idx").on(t.email)],
);

// Koneksi Google untuk ekspor, satu per user (file masuk ke Drive orang yang mengekspor).
export const googleCredentials = pgTable("google_credentials", {
  userId: uuid()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  data: text().notNull(),
  account: text(),
  ...timestamps,
});
