/**
 * Neon memberi `sslmode=require`. pg v8 memperlakukannya sebagai verify-full, tapi pg v9 akan melemahkannya
 * ke semantik libpq (tanpa verifikasi sertifikat) — kunci ke verify-full agar tetap memverifikasi sertifikat.
 */
export function withVerifiedSsl(url: string): string {
  return url.replace(/([?&])sslmode=require(?=&|$)/, "$1sslmode=verify-full");
}
