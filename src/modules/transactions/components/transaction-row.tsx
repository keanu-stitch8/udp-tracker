import Link from "next/link";
import { CategoryIcon } from "@/components/app/category-icon";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import type { TransactionView } from "../types/transaction";

export function TransactionRow({ view, href }: { view: TransactionView; href?: string }) {
  const isTransfer = view.type === "transfer";
  const title = isTransfer ? `${view.walletName} → ${view.toWalletName}` : (view.categoryName ?? "—");
  const detail = [view.merchant, isTransfer ? "Transfer" : view.walletName, view.vehicleName].filter(Boolean).join(" · ");
  const amount = view.type === "income" ? `+${formatRupiah(view.amount)}` : view.type === "expense" ? `-${formatRupiah(view.amount)}` : formatRupiah(view.amount);

  const content = (
    <div className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center border-2 bg-accent">
        <CategoryIcon name={isTransfer ? "arrow-left-right" : view.categoryIcon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("font-head text-sm tabular-nums", view.type === "income" && "text-green-700", view.type === "expense" && "text-destructive")}>{amount}</p>
        {isTransfer && view.adminFee > 0 && <p className="text-xs text-muted-foreground">admin {formatRupiah(view.adminFee)}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
