/** Prompt scan bon (spec §6.1). `categoryHint` dibatasi ke kategori pengeluaran proyek lewat enum schema. */
export function receiptPrompt(categoryNames: string[], projectYear: number): string {
  return [
    "Kamu membaca foto/PDF bon, struk, atau kwitansi dari Indonesia. Kembalikan JSON sesuai schema.",
    "- amount: TOTAL YANG DIBAYAR dalam rupiah (bilangan bulat). Bukan subtotal, pajak, diskon, uang tunai yang diserahkan, atau kembalian.",
    "  Format rupiah Indonesia: titik = pemisah ribuan, koma = desimal (\"Rp 125.500,00\" = 125500).",
    "- date: tanggal transaksi format YYYY-MM-DD. Bon biasanya ditulis dd/mm/yy atau dd-mm-yyyy, atau dengan nama bulan Indonesia (Januari … Desember, Agt, Okt, Des).",
    "  Tanggal angka selalu urutan hari/bulan/tahun (format Indonesia): \"08/10/2026\" = 2026-10-08 (8 Oktober), bukan 10 Agustus.",
    `  Bila tahun tidak tertulis di bon, pakai tahun ${projectYear}.`,
    "- time: jam transaksi format 24 jam HH:mm tanpa detik (\"14.30\", \"14:30:15\", atau \"2:30 PM\" → \"14:30\"). Bon/struk/kwitansi sering mencetak jam di dekat tanggal. Isi null bila tidak ada jam.",
    "- merchant: nama toko/SPBU/gerbang tol/lokasi parkir, singkat.",
    `- categoryHint: pilih satu dari [${categoryNames.join(", ")}] yang paling cocok, atau null.`,
    "  Struk SPBU → BBM/bensin, struk/e-toll gerbang tol → Tol, karcis parkir → Parkir.",
    "- Bukti transfer atau pembayaran QRIS (m-banking/internet banking/ATM/e-wallet): amount = NOMINAL TRANSFER/PEMBAYARAN yang diterima penerima, bukan \"Total Transfer\"/\"Total Bayar\" yang sudah termasuk biaya (format bank sering \"8,000,000.00\" = 8000000), date & time = waktu transaksi, merchant = nama penerima (bukan nama bank), categoryHint = null.",
    "- adminFee: biaya admin/transfer/fee persis sesuai angka yang tertulis (\"BIAYA Rp 2,500.00\" = 2500, \"Fee: Rp2.000,00\" = 2000). Bila bukti menyebut layanan BI FAST tetapi angka biayanya tidak tertulis, adminFee = 2500. Null untuk bon belanja atau bila tidak ada biaya.",
    "- Kwitansi tulisan tangan boleh dibaca, tetapi isi null bila ragu.",
    "- Isi null untuk field yang tidak terbaca jelas. Jangan menebak.",
    "- confident: true hanya bila total dan tanggal terbaca jelas; false bila foto buram, terpotong, atau bukan bon.",
    "- kind: \"toll_history\" bila gambar adalah riwayat/info transaksi kartu e-toll/e-money (Flazz, e-Toll/e-money Mandiri, Brizzi, TapCash) berisi daftar banyak transaksi; selain itu \"receipt\".",
    "- tolls: hanya untuk toll_history, satu item per baris PEMBAYARAN (\"Tol\", \"Transaksi Sale\", debit), urut seperti di gambar. Abaikan Top Up / isi saldo / kredit.",
    "  date YYYY-MM-DD (\"16/10/26\" = 2026-10-16, \"09 Okt 2026\" = 2026-10-09), time HH:mm 24 jam (detik boleh ditulis), amount bilangan bulat rupiah (\"IDR 19,000.00\" = 19000, \"Rp 23.500\" = 23500).",
    "  Untuk toll_history, field date/time/amount/merchant di luar tolls diisi null. Untuk receipt, tolls = [].",
  ].join("\n");
}

export function receiptResponseSchema(categoryNames: string[]) {
  return {
    type: "OBJECT",
    properties: {
      date: { type: "STRING", nullable: true },
      time: { type: "STRING", nullable: true },
      amount: { type: "INTEGER", nullable: true },
      adminFee: { type: "INTEGER", nullable: true },
      merchant: { type: "STRING", nullable: true },
      categoryHint: { type: "STRING", enum: categoryNames, nullable: true },
      confident: { type: "BOOLEAN" },
      kind: { type: "STRING", enum: ["receipt", "toll_history"] },
      tolls: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { date: { type: "STRING" }, time: { type: "STRING" }, amount: { type: "INTEGER" } },
          required: ["date", "time", "amount"],
        },
      },
    },
    required: ["confident"],
  };
}
