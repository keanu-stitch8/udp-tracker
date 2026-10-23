import type { UserStatus } from "@/modules/shared/types/enums";

/** User yang sedang login. Status dan peran dibaca dari DB setiap request (pencabutan berlaku seketika). */
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  status: UserStatus;
  isRoot: boolean;
}

/** Siapa yang melakukan aksi: cukup untuk cek izin. */
export type Actor = Pick<CurrentUser, "id" | "isRoot">;
