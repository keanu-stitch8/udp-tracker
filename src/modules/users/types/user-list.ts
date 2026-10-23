import type { UserStatus } from "@/modules/shared/types/enums";

/** Pilihan di pemilih pengguna (pool user aktif). */
export interface UserOption {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

/** Baris halaman Pengguna (Root). */
export interface UserListItem extends UserOption {
  status: UserStatus;
  isRoot: boolean;
  pmDivisionIds: string[];
  lastLoginAt: string | null;
}
