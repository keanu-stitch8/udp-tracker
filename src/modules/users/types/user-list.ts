import type { UserStatus } from "@/modules/shared/types/enums";

/** Pilihan di pemilih pengguna (pool user aktif). */
export interface UserOption {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

/** Nama orang untuk jejak penginput: nama Google, fallback email. */
export interface Person {
  id: string;
  name: string;
}

/** Baris halaman Pengguna (Root). */
export interface UserListItem extends UserOption {
  status: UserStatus;
  isRoot: boolean;
  pmDivisionIds: string[];
  lastLoginAt: string | null;
}
