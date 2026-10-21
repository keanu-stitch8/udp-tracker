import { isRetryableGoogleError } from "./google-errors";

interface GcallOptions {
  attempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Kuota Drive/Sheets per menit (403/429) & error sementara → coba ulang dengan jeda 2–32 detik (pola mkk-dashboard). */
export async function gcall<T>(fn: () => Promise<T>, { attempts = 6, sleep = wait }: GcallOptions = {}): Promise<T> {
  let delay = 2000;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || !isRetryableGoogleError(error)) throw error;
      await sleep(delay + Math.random() * 500);
      delay *= 2;
    }
  }
}
