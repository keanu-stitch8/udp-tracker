import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionFormSection } from "../sections/transaction-form-section";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function TransactionFormView({ searchParams, transactionId }: { searchParams: SearchParams; transactionId?: Promise<string> }) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <TransactionFormSection searchParams={searchParams} transactionId={transactionId} />
      </Suspense>
    </div>
  );
}
