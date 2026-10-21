// Error Google API (googleapis/REST) → pesan Bahasa Indonesia yang bisa ditindaklanjuti. Diadaptasi dari mkk-dashboard.

function parts(error: unknown): { code?: number | string; status?: number; message: string } {
  const e = error as { code?: number | string; status?: number; response?: { status?: number }; message?: string };
  return { code: e?.code, status: e?.status ?? e?.response?.status, message: e?.message || String(error) };
}

const RATE_LIMIT = /rate ?limit|quota|resource_exhausted/i;

/** Error sementara yang layak dicoba ulang (kuota per menit, server Google, koneksi putus). */
export function isRetryableGoogleError(error: unknown): boolean {
  const { status, message } = parts(error);
  if (status === 429 || (typeof status === "number" && status >= 500)) return true;
  return RATE_LIMIT.test(message) || /ECONNRESET|ETIMEDOUT|socket hang up/i.test(message);
}

export function googleErrorMessage(error: unknown): string {
  const { code, status, message } = parts(error);
  const m = message.toLowerCase();
  if (m.includes("has not been used in project") || m.includes("service_disabled") || m.includes("is disabled")) {
    return "Google Drive API / Google Sheets API belum aktif di Google Cloud. Aktifkan keduanya, tunggu beberapa menit, lalu coba lagi.";
  }
  if (code === "ENOTFOUND" || code === "ECONNREFUSED" || m.includes("getaddrinfo")) {
    return "Tidak bisa terhubung ke server Google. Cek koneksi internet lalu coba lagi.";
  }
  if (m.includes("invalid_client") || m.includes("unauthorized_client")) {
    return "OAuth client Google ditolak: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET salah, atau client-nya dihapus di Google Cloud.";
  }
  if (status === 401 || m.includes("invalid_grant") || m.includes("invalid credentials")) {
    return "Akses akun Google kedaluwarsa atau dicabut. Hubungkan ulang akun Google di Lainnya → Ekspor laporan.";
  }
  if (status === 429 || RATE_LIMIT.test(message)) return "Kuota Google sedang habis. Coba lagi beberapa menit lagi.";
  if (status === 403) return "Izin Google Drive ditolak. Hubungkan ulang akun Google dan centang semua izin yang diminta.";
  if (status === 404) return "File atau folder di Google Drive tidak ditemukan (mungkin sudah dihapus).";
  if (typeof status === "number" && status >= 500) return "Server Google sedang bermasalah. Coba lagi nanti.";
  return `Google menolak permintaan: ${message}`;
}
