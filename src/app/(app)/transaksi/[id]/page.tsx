import { EditTransactionModule } from "@/modules/transactions";

export default function EditTransactionPage({ params, searchParams }: PageProps<"/transaksi/[id]">) {
  return <EditTransactionModule searchParams={searchParams} transactionId={params.then((p) => p.id)} />;
}
