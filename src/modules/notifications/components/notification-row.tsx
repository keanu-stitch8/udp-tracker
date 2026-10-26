import { ChevronRight, CircleAlert, History, UserCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NotificationGroupKey } from "@/modules/shared/types/enums";
import type { NotificationItem } from "../lib/notifications";

export const GROUP_ICON: Record<NotificationGroupKey, LucideIcon> = { followup: CircleAlert, activity: History, access: UserCheck };

/** Satu notifikasi: titik unread, teks, waktu; bisa di-tap bila punya tujuan. `onNavigate` menutup popover sebelum pindah halaman. */
export function NotificationRow({ item, onNavigate }: { item: NotificationItem; onNavigate?: () => void }) {
  const body = (
    <>
      <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.unread ? "bg-destructive" : "bg-transparent")} />
      <span className="min-w-0 flex-1">
        {item.unread && <span className="sr-only">Baru: </span>}
        {item.text}
      </span>
      {item.when && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{item.when}</span>}
    </>
  );
  const className = "flex min-h-11 items-start gap-2 py-2 text-sm";
  return item.href ? (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {body}
      <ChevronRight className="mt-0.5 size-4 shrink-0" aria-hidden />
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="min-w-5 shrink-0 bg-secondary px-1.5 text-center text-xs leading-5 font-bold text-secondary-foreground tabular-nums">{count > 99 ? "99+" : count}</span>;
}
