# Jam Transaksi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap transaksi punya jam wajib (`HH:mm`, 24 jam, WIB) yang diisi di form, dibaca dari scan bon, dan tampil di riwayat.

**Architecture:** Kolom baru `transactions.time` (`time(0) NOT NULL`) di sebelah `date`. Helper jam ada di `shared/lib/date.ts`. Input jam memakai komponen `TimeInput` (teks, bukan `type="time"`) supaya selalu 24 jam. Spec: `docs/superpowers/specs/2026-10-21-jam-transaksi-design.md`.

**Tech Stack:** Next.js 16, Drizzle + Postgres (Neon; PGlite di tes), zod 4, Vitest, Gemini.

**Alur kerja:** commit langsung ke `main` + push per task. Gerbang commit pakai exit code.

---

## Task 1: Helper jam di `date.ts`

**Files:**
- Modify: `src/modules/shared/lib/date.ts`
- Test: `src/modules/shared/lib/date.test.ts`

- [ ] **Step 1: Tes gagal** — tambahkan ke `date.test.ts` (perluas import dengan `formatTimeTyping, isTime, normalizeTime, nowTimeWib, timeSchema`):

```ts
describe("jam", () => {
  it("nowTimeWib: 24 jam di Asia/Jakarta", () => {
    expect(nowTimeWib(new Date("2026-10-21T02:15:40Z"))).toBe("09:15");
    expect(nowTimeWib(new Date("2026-10-21T17:05:00Z"))).toBe("00:05");
    expect(nowTimeWib(new Date("2026-10-21T07:30:00Z"))).toBe("14:30");
  });
  it("isTime / timeSchema: HH:mm 00:00–23:59", () => {
    expect(isTime("00:00")).toBe(true);
    expect(isTime("23:59")).toBe(true);
    for (const bad of ["24:00", "9:30", "12:60", "1230", ""]) expect(isTime(bad)).toBe(false);
    expect(timeSchema.safeParse("14:30").success).toBe(true);
    expect(timeSchema.safeParse("").error?.issues[0].message).toBe("Jam wajib diisi.");
    expect(timeSchema.safeParse("25:00").error?.issues[0].message).toBe("Jam tidak valid.");
  });
  it("formatTimeTyping: hanya angka, titik dua otomatis", () => {
    expect(formatTimeTyping("1")).toBe("1");
    expect(formatTimeTyping("14")).toBe("14");
    expect(formatTimeTyping("143")).toBe("14:3");
    expect(formatTimeTyping("14:30")).toBe("14:30");
    expect(formatTimeTyping("14.305")).toBe("14:30");
  });
  it("normalizeTime: 3–4 digit jadi HH:mm, selain itu apa adanya", () => {
    expect(normalizeTime("930")).toBe("09:30");
    expect(normalizeTime("9.30")).toBe("09:30");
    expect(normalizeTime("93:0")).toBe("09:30");
    expect(normalizeTime("14:30")).toBe("14:30");
    expect(normalizeTime("2560")).toBe("2560");
    expect(normalizeTime("14")).toBe("14");
  });
});
```

- [ ] **Step 2:** `npx vitest run src/modules/shared/lib/date.test.ts` → FAIL (fungsi belum ada).

- [ ] **Step 3: Implementasi** — tambahkan ke `date.ts` setelah `todayWib`:

```ts
// Jam transaksi = string "HH:mm" 24 jam dalam WIB (spec jam transaksi).
const wibTime = new Intl.DateTimeFormat("en-GB", { timeZone: WIB, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Jam sekarang di WIB, format HH:mm (24 jam). */
export function nowTimeWib(now: Date = new Date()): string {
  return wibTime.format(now);
}

export function isTime(value: string): boolean {
  return TIME.test(value);
}

export const timeSchema = z.string({ error: "Jam wajib diisi." }).min(1, "Jam wajib diisi.").refine(isTime, "Jam tidak valid.");

/** Saat mengetik: buang selain angka, maks 4 digit, sisipkan ":" setelah 2 digit. */
export function formatTimeTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Saat selesai (blur/scan): "930" / "9.30" → "09:30". Yang tidak bisa dinormalkan dikembalikan apa adanya. */
export function normalizeTime(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 4) return value;
  const padded = digits.padStart(4, "0");
  const time = `${padded.slice(0, 2)}:${padded.slice(2)}`;
  return isTime(time) ? time : value;
}
```

- [ ] **Step 4:** tes yang sama → PASS.
- [ ] **Step 5:** commit `feat: WIB time helpers` + push.

---

## Task 2: Kolom `time`, migrasi, dan alur data transaksi

**Files:**
- Modify: `src/db/schema.ts`, `src/modules/transactions/types/transaction.ts`, `…/mappers/transaction.ts`, `…/api/transactions-repo.ts`, `…/types/transaction-input.ts`, `…/services/transaction-rules.ts`, `src/modules/wallets/lib/balance-check.ts`
- Create: `src/db/migrations/0004_jam_transaksi.sql` (via drizzle-kit, lalu diedit)
- Test: `tests/db-schema.test.ts`, `src/modules/transactions/transactions.test.ts`, `src/modules/wallets/lib/balance-check.test.ts`, plus fixture tes transaksi lain

- [ ] **Step 1: Tes gagal**

`tests/db-schema.test.ts`, tambah di dalam `describe("skema DB")`:

```ts
  it("kolom time wajib; backfill WIB dari created_at", async () => {
    const db = await createTestDb();
    const [project] = await db.insert(projects).values({ name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25" }).returning();
    const [wallet] = await db.insert(wallets).values({ projectId: project.id, kind: "cash", name: "Cash" }).returning();
    await expect(
      db.execute(sql`insert into transactions (project_id, type, date, amount, wallet_id) values (${project.id}, 'income', '2026-10-20', 1000, ${wallet.id})`),
    ).rejects.toThrow();
    const result = await db.execute(sql`select date_trunc('minute', timestamptz '2026-10-21T02:15:40Z' at time zone 'Asia/Jakarta')::time as t`);
    expect(result.rows[0]).toEqual({ t: "09:15:00" });
  });
```

(import `sql` dari `drizzle-orm`; tambahkan `time: "09:00"` pada insert transaksi di tes pertama agar tetap menguji constraint nominal.)

`src/modules/transactions/transactions.test.ts`, tambah:

```ts
describe("jam transaksi", () => {
  it("disimpan HH:mm dan mengurutkan transaksi dalam satu tanggal", async () => {
    const base = { type: "expense" as const, date: "2026-10-20", amount: 10_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Snack") };
    await createTransaction(db, projectId, { ...base, time: "08:15", merchant: "pagi" });
    await createTransaction(db, projectId, { ...base, time: "19:40", merchant: "malam" });
    await createTransaction(db, projectId, { ...base, time: "12:05", merchant: "siang" });
    const views = await listTransactionViews(db, projectId);
    expect(views.map((v) => [v.time, v.merchant])).toEqual([["19:40", "malam"], ["12:05", "siang"], ["08:15", "pagi"]]);
  });

  it("jam wajib dan harus valid", async () => {
    const input = { type: "expense" as const, date: "2026-10-20", amount: 10_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Snack") };
    await expect(createTransaction(db, projectId, input)).rejects.toBeInstanceOf(ValidationError);
    await expect(createTransaction(db, projectId, { ...input, time: "25:00" })).rejects.toBeInstanceOf(ValidationError);
  });
});
```

`balance-check.test.ts`: di objek `toEqual` pertama tambah `time: "23:59",`.

- [ ] **Step 2:** `npx vitest run tests/db-schema.test.ts src/modules/transactions/transactions.test.ts src/modules/wallets/lib/balance-check.test.ts` → FAIL.

- [ ] **Step 3: Skema + migrasi**

`src/db/schema.ts`: tambah `time` ke import `drizzle-orm/pg-core`, lalu di `transactions` setelah `date`:

```ts
    /** Jam transaksi WIB, 24 jam (spec jam transaksi). Postgres mengembalikan "HH:mm:ss". */
    time: time({ precision: 0 }).notNull(),
```

Jalankan `npx drizzle-kit generate --name jam_transaksi`. Ganti isi `src/db/migrations/0004_jam_transaksi.sql` menjadi:

```sql
ALTER TABLE "transactions" ADD COLUMN "time" time(0);--> statement-breakpoint
UPDATE "transactions" SET "time" = date_trunc('minute', "created_at" AT TIME ZONE 'Asia/Jakarta')::time;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "time" SET NOT NULL;
```

- [ ] **Step 4: Alur data**

`types/transaction.ts` — di `Transaction` setelah `date: string;`:

```ts
  /** "HH:mm" 24 jam, WIB. */
  time: string;
```

`mappers/transaction.ts` — setelah `date: row.date,`:

```ts
    time: row.time.slice(0, 5),
```

`api/transactions-repo.ts` — urutan dan komentar:

```ts
/** Transaksi aktif (belum dihapus) proyek, terbaru dulu (tanggal, lalu jam). */
…
    .orderBy(desc(transactions.date), desc(transactions.time), desc(transactions.createdAt));
```

`types/transaction-input.ts` — import `timeSchema` dari `@/modules/shared/lib/date`, dan setelah `date: isoDateSchema,`:

```ts
    time: timeSchema,
```

`services/transaction-rules.ts` — di `TransactionValues` setelah `date: string;`: `time: string;`

`wallets/lib/balance-check.ts` — di `adjustmentInput` setelah `date: check.date,`:

```ts
    // Penyesuaian mewakili saldo di akhir hari cek saldo.
    time: "23:59",
```

- [ ] **Step 5: Fixture tes** — tambahkan `time: "09:00"` ke setiap input/objek transaksi di tes. Skrip (simpan di scratchpad, jalankan dari root repo):

```python
import re, sys
for path in sys.argv[1:]:
    lines = open(path).read().split("\n")
    out = []
    for i, line in enumerate(lines):
        prev = lines[i - 1] if i else ""
        if re.search(r'type: "(income|expense|transfer)"', line) and re.search(r'date: "\d{4}-\d{2}-\d{2}",', line) and "time:" not in line:
            line = re.sub(r'(date: "\d{4}-\d{2}-\d{2}",)', r'\1 time: "09:00",', line, count=1)
        elif re.fullmatch(r'\s+date: "\d{4}-\d{2}-\d{2}",', line) and re.search(r'type: "(income|expense|transfer)"', prev):
            line += "\n" + re.match(r"\s+", line).group(0) + 'time: "09:00",'
        out.append(line)
    open(path, "w").write("\n".join(out))
```

Jalankan pada `grep -rlE 'type: "(income|expense|transfer)"' src tests --include='*.test.ts'`. Lalu `npm run typecheck` dan tambahkan `time` secara manual di sisa fixture yang masih error (mis. objek `Transaction` di `ledger.test.ts`, `balances.test.ts`, `filter.test.ts`).

- [ ] **Step 6:** `npm run typecheck && npm test` → semua PASS (exit 0).
- [ ] **Step 7:** commit `feat: required transaction time column (WIB)` + push. **Jangan** `db:migrate` ke Neon di task ini (lihat Task 5).

---

## Task 3: Scan membaca jam

**Files:**
- Modify: `src/modules/receipts/lib/receipt-prompt.ts`, `…/types/receipt.ts`, `…/mappers/receipt-scan.ts`, `…/types/attachment.ts`
- Test: `src/modules/receipts/mappers/receipt-scan.test.ts`

- [ ] **Step 1: Tes gagal** — di `receipt-scan.test.ts`:

```ts
  it("jam dinormalkan ke HH:mm 24 jam; selain itu null", () => {
    expect(scan({ time: "14:30" }).time).toBe("14:30");
    expect(scan({ time: "14.30" }).time).toBe("14:30");
    expect(scan({ time: "9:05" }).time).toBe("09:05");
    for (const time of ["25:00", "2:30 PM", "jam dua", 1430, null]) expect(scan({ time }).time).toBeNull();
  });
```

- [ ] **Step 2:** `npx vitest run src/modules/receipts` → FAIL.

- [ ] **Step 3: Implementasi**

`types/receipt.ts` — `ReceiptScan` setelah `date`: `time: string | null;`

`mappers/receipt-scan.ts` — import `isTime, normalizeTime`; tambah:

```ts
/** Gemini diminta 24 jam; yang ada huruf (AM/PM, teks) ditolak, bukan ditebak. */
function toTime(value: unknown): string | null {
  if (typeof value !== "string" || /[a-z]/i.test(value)) return null;
  const time = normalizeTime(value.trim());
  return isTime(time) ? time : null;
}
```

dan di objek hasil setelah `date`: `time: toTime(r.time),`

`lib/receipt-prompt.ts` — setelah baris tahun:

```ts
    "- time: jam transaksi format 24 jam HH:mm (\"14.30\" atau \"2:30 PM\" → \"14:30\"). Bon/struk/kwitansi sering mencetak jam di dekat tanggal. Isi null bila tidak ada jam.",
```

dan di schema respons: `time: { type: "STRING", nullable: true },`

`types/attachment.ts` — `scanSchema` setelah `date`: hasil scan lama tersimpan tanpa `time`:

```ts
  time: z.string().nullish().transform((value) => value ?? null),
```

Perbarui ekspektasi `toEqual` hasil scan di `receipts.test.ts`/`attachments.test.ts` bila ada (tambah `time: null`).

- [ ] **Step 4:** `npm run typecheck && npx vitest run src/modules/receipts` → PASS.
- [ ] **Step 5:** commit `feat: read time from receipts` + push.

---

## Task 4: UI — TimeInput, form, riwayat

**Files:**
- Create: `src/components/app/time-input.tsx`
- Modify: `src/modules/transactions/components/transaction-form.tsx`, `…/sections/transaction-form-section.tsx`, `…/components/transaction-row.tsx`

- [ ] **Step 1: `time-input.tsx`**

```tsx
"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatTimeTyping, normalizeTime } from "@/modules/shared/lib/date";

type TimeInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode"> & {
  value: string;
  onChange: (value: string) => void;
};

/** Jam "HH:mm" selalu 24 jam: input teks, karena `type="time"` tampil AM/PM bila HP disetel 12 jam. */
export function TimeInput({ value, onChange, onBlur, ...props }: TimeInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="14:30"
      maxLength={5}
      value={value}
      onChange={(event) => onChange(formatTimeTyping(event.target.value))}
      onBlur={(event) => {
        onChange(normalizeTime(value));
        onBlur?.(event);
      }}
    />
  );
}
```

- [ ] **Step 2: Section** — `transaction-form-section.tsx`: import `nowTimeWib`, tambah prop `defaultTime={nowTimeWib()}`.

- [ ] **Step 3: Form** — `transaction-form.tsx`:
  - `type OcrField = "amount" | "date" | "time" | "categoryId" | "merchant";`
  - `TransactionFormProps`: `defaultTime: string;`; `TransactionFormFields` ikut destrukturisasi `defaultTime`.
  - state: `const [time, setTime] = useState(initial?.time ?? defaultTime);`
  - `applyScan` setelah blok tanggal:

```ts
    if (scan.time && !initial && time === defaultTime) {
      setTime(scan.time);
      filled.add("time");
    }
```

  - `submit`: `date, time,`
  - Markup: bungkus Field Tanggal dan Field Jam baru dalam `<div className="grid grid-cols-2 gap-3">`. Field Jam:

```tsx
          <Field data-invalid={errorOf("time") ? true : undefined}>
            <FieldLabel htmlFor="time">
              Jam <CheckAgain show={ocrFields.has("time")} />
            </FieldLabel>
            <TimeInput
              id="time"
              value={time}
              onChange={(value) => {
                setTime(value);
                touched("time");
              }}
            />
            {errorOf("time") && <FieldError>{errorOf("time")}</FieldError>}
          </Field>
```

  Pesan "Di luar periode proyek" dipindah ke bawah grid (lebar penuh) supaya tidak menyempitkan kolom tanggal.

- [ ] **Step 4: Riwayat** — `transaction-row.tsx`: `const detail = [view.time, view.merchant, isTransfer ? "Transfer" : view.walletName, view.vehicleName].filter(Boolean).join(" · ");`

- [ ] **Step 5:** `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build` → semua exit 0.
- [ ] **Step 6:** commit `feat: time field in transaction form and history` + push.

---

## Task 5: Migrasi Neon + verifikasi

- [ ] **Step 1:** Minta konfirmasi pengguna, lalu `npm run db:migrate` (mengubah data asli: tambah kolom + isi jam dari `created_at`).
- [ ] **Step 2:** Cek backfill: `select created_at, time from transactions order by created_at desc limit 5` (skrip tsx dengan `pg`). Jam = `created_at` + 7 jam, menit dibulatkan ke bawah.
- [ ] **Step 3:** Cek visual sekali di dev server pengguna (`localhost:3051`): riwayat menampilkan `HH:mm · …`; form baru terisi jam sekarang; ketik `930` → blur → `09:30`.
- [ ] **Step 4:** Update `docs/superpowers/HANDOFF.md` (status + migrasi 0004 sudah di Neon), commit + push.
