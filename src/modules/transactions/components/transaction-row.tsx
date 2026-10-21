import { Paperclip } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/app/category-icon";
import { AMOUNT } from "@/components/app/typography";
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
        <p className="flex items-center gap-1.5 font-medium">
          <span className="truncate">{title}</span>
          {view.attachments.length > 0 && <Paperclip className="size-3.5 shrink-0" aria-label={`${view.attachments.length} bon`} />}
          {view.type === "expense" && view.attachments.length === 0 && (
            <span className="shrink-0 border px-1 text-[10px] leading-4 font-normal text-muted-foreground">tanpa bon</span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn(AMOUNT, "text-sm", view.type === "income" && "text-green-700", view.type === "expense" && "text-destructive")}>{amount}</p>
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
