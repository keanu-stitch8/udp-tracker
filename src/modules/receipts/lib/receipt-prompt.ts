/** Prompt scan bon (spec §6.1). `categoryHint` dibatasi ke kategori pengeluaran proyek lewat enum schema. */
export function receiptPrompt(categoryNames: string[], projectYear: number): string {
  return [
    "Kamu membaca foto/PDF bon, struk, atau kwitansi dari Indonesia. Kembalikan JSON sesuai schema.",
    "- amount: TOTAL YANG DIBAYAR dalam rupiah (bilangan bulat). Bukan subtotal, pajak, diskon, uang tunai yang diserahkan, atau kembalian.",
    "  Format rupiah Indonesia: titik = pemisah ribuan, koma = desimal (\"Rp 125.500,00\" = 125500).",
    "- date: tanggal transaksi format YYYY-MM-DD. Bon biasanya ditulis dd/mm/yy atau dd-mm-yyyy, atau dengan nama bulan Indonesia (Januari … Desember, Agt, Okt, Des).",
    `  Bila tahun tidak tertulis di bon, pakai tahun ${projectYear}.`,
    "- merchant: nama toko/SPBU/gerbang tol/lokasi parkir, singkat.",
    `- categoryHint: pilih satu dari [${categoryNames.join(", ")}] yang paling cocok, atau null.`,
    "  Struk SPBU → BBM/bensin, struk/e-toll gerbang tol → Tol, karcis parkir → Parkir.",
    "- Kwitansi tulisan tangan boleh dibaca, tetapi isi null bila ragu.",
    "- Isi null untuk field yang tidak terbaca jelas. Jangan menebak.",
    "- confident: true hanya bila total dan tanggal terbaca jelas; false bila foto buram, terpotong, atau bukan bon.",
  ].join("\n");
}

export function receiptResponseSchema(categoryNames: string[]) {
  return {
    type: "OBJECT",
    properties: {
      date: { type: "STRING", nullable: true },
      amount: { type: "INTEGER", nullable: true },
      merchant: { type: "STRING", nullable: true },
      categoryHint: { type: "STRING", enum: categoryNames, nullable: true },
      confident: { type: "BOOLEAN" },
    },
    required: ["confident"],
  };
}
