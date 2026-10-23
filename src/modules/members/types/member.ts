import type { UserOption } from "@/modules/users/types/user-list";

export interface ProjectMember {
  userId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

/** Undangan untuk email yang belum pernah login; jadi anggota saat login pertama. */
export interface ProjectInvitation {
  email: string;
  createdAt: string;
}

export interface ProjectMemberList {
  members: ProjectMember[];
  invitations: ProjectInvitation[];
  /** Pool user aktif (lintas divisi) yang belum jadi anggota proyek ini. */
  candidates: UserOption[];
}

export type AddMemberResult = { result: "member" } | { result: "invited" };
