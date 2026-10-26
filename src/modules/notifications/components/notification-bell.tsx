"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LABEL } from "@/components/app/typography";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotificationSummary } from "../hooks/use-notifications";
import { badgeLabel, GROUP_LABEL, GROUP_SLUG, totalCount } from "../lib/notifications";
import { CountBadge, GROUP_ICON, NotificationRow } from "./notification-row";

/** Lonceng header: badge total, popover per grup (maks 5 item), "Lihat semua" → /notifikasi. */
export function NotificationBell({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useNotificationSummary(projectId);
  const groups = data?.groups ?? [];
  const badge = badgeLabel(totalCount(groups));
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" aria-label={badge ? `Notifikasi, ${badge} perlu dilihat` : "Notifikasi"} className="relative flex size-10 shrink-0 items-center justify-center" />}
      >
        <Bell className="size-6" aria-hidden />
        {badge && (
          <span aria-hidden className="absolute top-0.5 right-0 min-w-5 border-2 border-primary bg-secondary px-1 text-center text-[11px] leading-4 font-bold text-secondary-foreground tabular-nums">
            {badge}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="max-h-[70dvh] w-[min(calc(100vw-2rem),448px)] gap-3 overflow-y-auto p-3">
        <div className="flex items-center justify-between gap-2">
          <p className={LABEL}>Notifikasi</p>
          <Link href="/notifikasi" onClick={close} className="flex min-h-11 items-center gap-0.5 text-sm font-medium">
            Lihat semua <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        {groups.map((group, index) => {
          const Icon = GROUP_ICON[group.key];
          return (
            <section key={group.key} className={cn("flex flex-col", index > 0 && "border-t-2 pt-2")}>
              <Link href={`/notifikasi?grup=${GROUP_SLUG[group.key]}`} onClick={close} className="flex min-h-11 items-center gap-2">
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className={cn(LABEL, "flex-1")}>{GROUP_LABEL[group.key]}</span>
                <CountBadge count={group.count} />
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </Link>
              {group.items.length ? (
                group.items.map((item) => <NotificationRow key={item.id} item={item} onNavigate={close} />)
              ) : (
                <p className="py-2 pl-4 text-sm text-muted-foreground">Belum ada kabar</p>
              )}
            </section>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
