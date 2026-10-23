"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDivisions } from "@/modules/divisions/hooks/use-divisions";
import type { UserStatus } from "@/modules/shared/types/enums";
import { useApproveUser, useRejectUser, useSetUserRoot, useUsers } from "../hooks/use-users";
import type { UserListItem } from "../types/user-list";
import { UserAvatar } from "./user-avatar";

const TABS: { value: UserStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "active", label: "Aktif" },
  { value: "rejected", label: "Ditolak" },
];

const EMPTY: Record<UserStatus, string> = {
  pending: "Tidak ada akun yang menunggu persetujuan.",
  active: "Belum ada akun aktif.",
  rejected: "Tidak ada akun yang ditolak.",
};

/** Status akun + Root. Penugasan PM diatur di Divisi, anggota di Anggota proyek. */
export function UserAdmin() {
  const { data: users = [] } = useUsers();
  const { data: divisions = [] } = useDivisions();
  const approve = useApproveUser();
  const setRoot = useSetUserRoot();
  const reject = useRejectUser();
  const [tab, setTab] = useState<UserStatus>(() => (users.some((u) => u.status === "pending") ? "pending" : "active"));
  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const divisionName = new Map(divisions.map((d) => [d.id, d.name]));
  const shown = users.filter((u) => u.status === tab);
  const notify = (message: string) => ({ onSuccess: () => toast(message), onError: (error: Error) => toast.error(error.message) });

  /** Mis. "Root · PM MKK, MLSC", "PM MKK", atau "Anggota". */
  const roleText = (user: UserListItem) => {
    const parts = [user.isRoot ? "Root" : null, user.pmDivisionIds.length ? `PM ${user.pmDivisionIds.map((id) => divisionName.get(id) ?? "?").join(", ")}` : null].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Anggota";
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as UserStatus)}>
        <TabsList aria-label="Status akun" className="w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-0">
              {t.label} ({users.filter((u) => u.status === t.value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "active" && <p className="text-sm text-muted-foreground">PM diatur di Lainnya → Divisi, anggota proyek di Lainnya → Anggota proyek.</p>}
      {shown.length === 0 && <p className="text-sm text-muted-foreground">{EMPTY[tab]}</p>}
      <ItemGroup className="gap-2">
        {shown.map((user) => (
          <Item key={user.id} variant="outline" className="bg-card">
            <ItemMedia>
              <UserAvatar name={user.name} email={user.email} imageUrl={user.imageUrl} />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="w-full truncate">{user.name ?? user.email}</ItemTitle>
              <ItemDescription className="truncate">{user.email}</ItemDescription>
            </ItemContent>
            {user.status === "active" && (
              <ItemActions>
                <Badge variant="outline">{roleText(user)}</Badge>
              </ItemActions>
            )}
            <ItemFooter className="flex-wrap justify-end gap-2">
              {confirmReject === user.id ? (
                <>
                  <span className="mr-auto text-sm">{user.status === "active" ? "Cabut akses akun ini?" : "Tolak akun ini?"}</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reject.isPending}
                    onClick={() =>
                      reject.mutate(user.id, {
                        onSuccess: () => {
                          toast(user.status === "active" ? "Akses dicabut." : "Akun ditolak.");
                          setConfirmReject(null);
                        },
                        onError: (error) => toast.error(error.message),
                      })
                    }
                  >
                    Ya, {user.status === "active" ? "cabut" : "tolak"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmReject(null)}>
                    Batal
                  </Button>
                </>
              ) : (
                <>
                  {user.status !== "rejected" && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmReject(user.id)}>
                      {user.status === "active" ? "Cabut akses" : "Tolak"}
                    </Button>
                  )}
                  {user.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={setRoot.isPending}
                      onClick={() => setRoot.mutate({ userId: user.id, isRoot: !user.isRoot }, notify(user.isRoot ? "Root dicabut." : "Dijadikan Root."))}
                    >
                      {user.isRoot ? "Cabut Root" : "Jadikan Root"}
                    </Button>
                  ) : (
                    <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(user.id, notify(`${user.name ?? user.email} disetujui. Tambahkan ke divisi atau proyek.`))}>
                      Setujui
                    </Button>
                  )}
                </>
              )}
            </ItemFooter>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
