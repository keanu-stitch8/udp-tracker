import { WalletDetailView } from "./views/wallet-detail-view";
import { WalletListView } from "./views/wallet-list-view";

export { WalletScopeSection } from "./sections/wallet-scope-section";

export function WalletListModule() {
  return <WalletListView />;
}

export function WalletDetailModule({ walletId }: { walletId: Promise<string> }) {
  return <WalletDetailView walletId={walletId} />;
}
