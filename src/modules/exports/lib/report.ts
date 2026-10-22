// Isi laporan ekspor (spec §6.2 + addendum 2026-10-22). Murni: dari data buku kas → baris 4 tab, tanpa Google.
import { budgetContextOf, budgetUsage, dailyBudgetUsage, totalBudgetUsage } from "@/modules/budgets/lib/budget";
import { limitFormula } from "@/modules/budgets/lib/basis";
import { groupCategories } from "@/modules/budgets/lib/category-groups";
import { addDays, daysInclusive, formatDateLong, nowTimeWib, todayWib } from "@/modules/shared/lib/date";
import { sum } from "@/modules/shared/lib/money";
import { compareNewestFirst, expenseEntries, ledgerTotals, sumBy } from "@/modules/transactions/lib/ledger";
import type { Transaction } from "@/modules/transactions/types/transaction";
import { walletBalances } from "@/modules/wallets/lib/balances";
import type { ReportCell, ReportInput, ReportTab } from "../types/report";

const text = (value: string | number | null): ReportCell => ({ value });
const money = (value: number | null): ReportCell => (value === null ? { value: null } : { value, money: true });
const bold = (value: string): ReportCell => ({ value, bold: true });
const header = (...titles: string[]): ReportCell[] => titles.map(bold);
const TYPE_LABELS: Record<Transaction["type"], string> = { income: "Masuk", expense: "Keluar", transfer: "Transfer" };

export function buildReport(input: ReportInput): ReportTab[] {
  return [recapTab(input), detailTab(input), dailyTab(input), budgetTab(input)];
}

function recapTab({ project, wallets, categories, groups, transactions, exportedAt }: ReportInput): ReportTab {
  const totals = ledgerTotals(wallets, categories, transactions);
  const walletName = new Map(wallets.map((w) => [w.id, w.name]));
  const officeFunding = new Set(categories.filter((c) => c.isOfficeFunding).map((c) => c.id));
  const udp = transactions.filter((t) => t.type === "income" && t.categoryId && officeFunding.has(t.categoryId)).sort((a, b) => compareNewestFirst(b, a));
  const byCategory = sumBy(expenseEntries(transactions, categories), (e) => e.categoryId, (e) => e.amount);
  const balances = walletBalances(wallets, transactions);

  const rows: ReportCell[][] = [
    [bold("Laporan UDP")],
    [text("Proyek"), text(project.name)],
    [text("Lokasi"), text(project.location || "-")],
    [text("Periode"), text(`${formatDateLong(project.startDate)} – ${formatDateLong(project.endDate)}`)],
    [text("Pax"), text(project.pax)],
    [text("Mobil"), text(project.vehicles.map((v) => v.name).join(", ") || "-")],
    [text("Diekspor"), text(`${formatDateLong(todayWib(exportedAt))} ${nowTimeWib(exportedAt)}`)],
    [],
    [bold("UDP masuk")],
    header("Tanggal", "Jam", "Dompet", "Nominal"),
    ...udp.map((t) => [text(formatDateLong(t.date)), text(t.time), text(walletName.get(t.walletId) ?? "-"), money(t.amount)]),
    [bold("Total UDP masuk"), text(null), text(null), money(totals.udpReceived)],
    [],
    [text("Saldo awal semua dompet"), money(totals.openingTotal)],
    [text("Total pemasukan"), money(totals.totalIncome)],
    [],
    // Struktur RAB: baris grup (tebal, subtotal) lalu kategorinya menjorok.
    [bold("Pengeluaran per grup")],
    header("Grup / kategori", "Total"),
    ...groupCategories(
      groups,
      categories.filter((c) => byCategory.has(c.id)),
    ).flatMap(({ group, categories: items }) => [
      [bold(group.name), money(sum(items.map((c) => byCategory.get(c.id)!)))],
      ...items.map((c) => [text(`  ${c.name}`), money(byCategory.get(c.id)!)]),
    ]),
    ...(byCategory.has(null) ? [[text("Tanpa kategori"), money(byCategory.get(null)!)]] : []),
    [bold("Total pengeluaran"), money(totals.totalExpense)],
    [],
    [bold("Saldo akhir per dompet")],
    header("Dompet", "Saldo"),
    ...wallets.filter((w) => !w.archived || balances.get(w.id)).map((w) => [text(w.name), money(balances.get(w.id) ?? w.openingBalance)]),
    [],
    [bold(totals.remaining >= 0 ? "Sisa (dikembalikan ke kantor)" : "Kurang (perlu reimburse)"), money(Math.abs(totals.remaining))],
  ];
  return { title: "Rekap", rows, freezeRows: 0 };
}

function detailTab({ wallets, categories, groups, transactions, project, receipts }: ReportInput): ReportTab {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const groupOf = new Map(categories.map((c) => [c.id, c.groupId ? (groupName.get(c.groupId) ?? null) : null]));
  const walletName = new Map(wallets.map((w) => [w.id, w.name]));
  const vehicleName = new Map(project.vehicles.map((v) => [v.id, v.name]));
  const receiptsOf = new Map<string, (string | null)[]>();
  for (const r of receipts) receiptsOf.set(r.transactionId, [...(receiptsOf.get(r.transactionId) ?? []), r.driveUrl]);
  const maxReceipts = Math.max(0, ...[...receiptsOf.values()].map((list) => list.length));

  let running = ledgerTotals(wallets, categories, []).openingTotal;
  const chronological = [...transactions].sort((a, b) => compareNewestFirst(b, a));
  const rows = chronological.map((t, index) => {
    const isTransfer = t.type === "transfer";
    const income = t.type === "income" ? t.amount : null;
    const expense = t.type === "expense" ? t.amount : null;
    const adminFee = t.type !== "income" && t.adminFee > 0 ? t.adminFee : null;
    running += (income ?? 0) - (expense ?? 0) - (adminFee ?? 0);
    const receiptCells = Array.from({ length: maxReceipts }, (_, i) => {
      const list = receiptsOf.get(t.id) ?? [];
      if (i >= list.length) return text(null);
      const url = list[i];
      return url ? { value: `Bon ${i + 1}`, link: url } : text(`Bon ${i + 1}`);
    });
    return [
      text(index + 1),
      text(formatDateLong(t.date)),
      text(t.time),
      text(TYPE_LABELS[t.type]),
      text(groupOf.get(t.categoryId ?? "") ?? "-"),
      text(isTransfer ? "Transfer" : (categoryName.get(t.categoryId ?? "") ?? "-")),
      text([t.merchant, t.note].filter(Boolean).join(" · ") || null),
      text(isTransfer ? `${walletName.get(t.walletId)} → ${walletName.get(t.toWalletId ?? "")}` : (walletName.get(t.walletId) ?? "-")),
      text(t.vehicleId ? (vehicleName.get(t.vehicleId) ?? null) : null),
      money(income),
      money(expense),
      money(adminFee),
      money(running),
      ...receiptCells,
    ];
  });
  const receiptHeaders = Array.from({ length: maxReceipts }, (_, i) => `Bon ${i + 1}`);
  return {
    title: "Detail",
    rows: [header("No", "Tanggal", "Jam", "Jenis", "Grup", "Kategori", "Berita", "Dompet", "Mobil", "Masuk", "Keluar", "Biaya admin", "Saldo berjalan", ...receiptHeaders), ...rows],
    freezeRows: 1,
  };
}

function dailyTab({ categories, groups, transactions }: ReportInput): ReportTab {
  const entries = expenseEntries(transactions, categories);
  const used = groupCategories(
    groups,
    categories.filter((c) => c.kind === "expense" && entries.some((e) => e.categoryId === c.id)),
  ).flatMap((section) => section.categories);
  const dates = [...new Set(entries.map((e) => e.date))].sort();
  const amount = (date: string | null, categoryId: string | null) =>
    entries.filter((e) => (date === null || e.date === date) && (categoryId === null || e.categoryId === categoryId)).reduce((total, e) => total + e.amount, 0);
  const row = (label: string, date: string | null, isTotal = false) => [
    isTotal ? bold(label) : text(label),
    ...used.map((c) => money(amount(date, c.id) || null)),
    money(amount(date, null)),
  ];
  return {
    title: "Harian",
    rows: [header("Tanggal", ...used.map((c) => c.name), "Total"), ...dates.map((d) => row(formatDateLong(d), d)), row("Total", null, true)],
    freezeRows: 1,
  };
}

function budgetTab({ project, budgets, categories, transactions }: ReportInput): ReportTab {
  const ctx = budgetContextOf(project);
  const entries = expenseEntries(transactions, categories);
  const total = totalBudgetUsage(budgets, ctx, entries);
  const rows: ReportCell[][] = [
    header("Pagu", "Rumus", "Nilai pagu", "Realisasi", "Sisa", "Lebih pagu"),
    ...budgets.map((b) => {
      const u = budgetUsage(b, ctx, entries);
      return [text(b.name), text(limitFormula(b, ctx)), money(u.limit), money(u.used), money(u.remaining), money(u.overBy)];
    }),
    [bold("Total pagu"), text(null), money(total.limit), money(total.used), money(total.remaining), money(total.overBy)],
  ];
  const days = Array.from({ length: daysInclusive(project.startDate, project.endDate) }, (_, i) => addDays(project.startDate, i));
  for (const b of budgets) {
    if (!dailyBudgetUsage(b, ctx, entries, project.startDate)) continue;
    rows.push([], [bold(`Rincian harian: ${b.name}`)], header("Tanggal", "Batas harian", "Realisasi", "Selisih"));
    for (const date of days) {
      const u = dailyBudgetUsage(b, ctx, entries, date)!;
      rows.push([text(formatDateLong(date)), money(u.limit), money(u.used), money(u.limit - u.used)]);
    }
  }
  return { title: "Pagu", rows, freezeRows: 1 };
}
