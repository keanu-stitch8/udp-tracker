import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionListSection } from "../sections/transaction-list-section";

export function TransactionListView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Transaksi</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TransactionListSection />
      </Suspense>
    </div>
  );
}
