import { NewTransactionModule } from "@/modules/transactions";

export default function NewTransactionPage({ searchParams }: PageProps<"/transaksi/baru">) {
  return <NewTransactionModule searchParams={searchParams} />;
}
