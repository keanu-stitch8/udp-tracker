import { TransactionFormView } from "./views/transaction-form-view";
import { TransactionListView } from "./views/transaction-list-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function NewTransactionModule({ searchParams }: { searchParams: SearchParams }) {
  return <TransactionFormView searchParams={searchParams} />;
}

export function EditTransactionModule({ searchParams, transactionId }: { searchParams: SearchParams; transactionId: Promise<string> }) {
  return <TransactionFormView searchParams={searchParams} transactionId={transactionId} />;
}

export function TransactionListModule() {
  return <TransactionListView />;
}
