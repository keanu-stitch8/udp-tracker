"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSelect } from "@/components/app/app-select";
import { CARD_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationGroupKey } from "@/modules/shared/types/enums";
import { useMarkSeen, useNotificationList } from "../hooks/use-notifications";
import { GROUP_LABEL, GROUP_SLUG } from "../lib/notifications";
import { CountBadge, GROUP_ICON, NotificationRow } from "./notification-row";

type Filter = NotificationGroupKey | "all";

/** Halaman Notifikasi. Membuka Semua/Aktivitas menandai aktivitas terbaca (titik di daftar ini tetap sampai dimuat ulang). */
export function NotificationList({ projectId, group, groupKeys }: { projectId: string; group: NotificationGroupKey | null; groupKeys: NotificationGroupKey[] }) {
  const router = useRouter();
  const { data } = useNotificationList(projectId, group);
  const { mutate: markSeen } = useMarkSeen(projectId);

  useEffect(() => {
    if (group === null || group === "activity") markSeen("activity");
  }, [group, markSeen]);

  const filters = [{ value: "all" as Filter, label: "Semua" }, ...groupKeys.map((key) => ({ value: key as Filter, label: GROUP_LABEL[key] }))];

  return (
    <div className="flex flex-col gap-4">
      <AppSelect<Filter>
        label="Grup notifikasi"
        value={group ?? "all"}
        items={filters}
        onChange={(value) => router.replace(value === "all" ? "/notifikasi" : `/notifikasi?grup=${GROUP_SLUG[value]}`)}
      />
      {(data?.groups ?? []).map((g) => {
        const Icon = GROUP_ICON[g.key];
        return (
          <Card key={g.key}>
            <CardHeader>
              <CardTitle className={`${CARD_TITLE} flex items-center gap-2`}>
                <Icon className="size-4" aria-hidden />
                <span className="flex-1">{GROUP_LABEL[g.key]}</span>
                <CountBadge count={g.count} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y-2">
              {g.items.length ? g.items.map((item) => <NotificationRow key={item.id} item={item} />) : <p className="text-sm text-muted-foreground">Belum ada kabar</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
