import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { createTransactions } from "@/modules/transactions/commands/save-transaction";
import { ledgerActor } from "@/modules/wallets/services/wallet-scope";

/** Impor riwayat tol: banyak pengeluaran sekaligus (semua atau tidak sama sekali). */
export const POST = projectRoute("transact", async (request, ctx: RouteContext<"/api/projects/[projectId]/transactions/batch">, access) => {
  const { projectId } = await ctx.params;
  return Response.json(await createTransactions(getDb(), projectId, await readJson(request), await ledgerActor(getDb(), access)), { status: 201 });
});
