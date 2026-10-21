import { TransactionFormView } from "./views/transaction-form-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function NewTransactionModule({ searchParams }: { searchParams: SearchParams }) {
  return <TransactionFormView title="Catat transaksi" searchParams={searchParams} />;
}

export function EditTransactionModule({ searchParams, transactionId }: { searchParams: SearchParams; transactionId: Promise<string> }) {
  return <TransactionFormView title="Ubah transaksi" searchParams={searchParams} transactionId={transactionId} />;
}
