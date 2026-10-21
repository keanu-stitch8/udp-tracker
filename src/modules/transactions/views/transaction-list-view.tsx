import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionListSection } from "../sections/transaction-list-section";

export function TransactionListView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-head text-2xl">Transaksi</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TransactionListSection />
      </Suspense>
    </div>
  );
}
