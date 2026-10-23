import { connection } from "next/server";
import type { ReactNode } from "react";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { WalletScopeProvider } from "../components/wallet-scope-provider";

export async function WalletScopeSection({ children }: { children: ReactNode }) {
  await connection();
  const project = await getActiveProject(getDb());
  return <WalletScopeProvider scope={project?.walletScope ?? null}>{children}</WalletScopeProvider>;
}
