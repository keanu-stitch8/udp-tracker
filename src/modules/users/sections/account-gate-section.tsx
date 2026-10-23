import { connection } from "next/server";
import type { ReactNode } from "react";
import { getDb } from "@/db/client";
import { requireCurrentUser } from "../queries/current-user";
import { AccountStatusView } from "../views/account-status-view";

/** Membungkus isi halaman app: akun pending/ditolak hanya melihat layar statusnya. */
export async function AccountGateSection({ children }: { children: ReactNode }) {
  await connection();
  const user = await requireCurrentUser(getDb());
  if (user.status !== "active") return <AccountStatusView user={user} />;
  return children;
}
