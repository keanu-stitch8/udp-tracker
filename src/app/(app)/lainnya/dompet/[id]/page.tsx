import { WalletDetailModule } from "@/modules/wallets";

export default function WalletDetailPage({ params }: PageProps<"/lainnya/dompet/[id]">) {
  return <WalletDetailModule walletId={params.then((p) => p.id)} />;
}
