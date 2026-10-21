import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionFormSection } from "../sections/transaction-form-section";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function TransactionFormView({ title, searchParams, transactionId }: { title: string; searchParams: SearchParams; transactionId?: Promise<string> }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>{title}</h1>
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <TransactionFormSection searchParams={searchParams} transactionId={transactionId} />
      </Suspense>
    </div>
  );
}
