"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LABEL } from "@/components/app/typography";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { UserAvatar } from "@/modules/users/components/user-avatar";
import { UserPicker } from "@/modules/users/components/user-picker";
import { useSetDivisionPms, useUsers } from "@/modules/users/hooks/use-users";
import type { Division } from "../types/division";

/** PM satu divisi: tambah dari pool user aktif (Root boleh ikut jadi PM), hapus dengan konfirmasi. */
export function DivisionPms({ division }: { division: Division }) {
  const { data: users = [] } = useUsers();
  const save = useSetDivisionPms();
  const [picking, setPicking] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const pmIds = division.pms.map((pm) => pm.id);
  const userById = new Map(users.map((u) => [u.id, u]));
  const candidates = users.filter((u) => u.status === "active" && !pmIds.includes(u.id));

  const update = (userIds: string[], message: string, after?: () => void) =>
    save.mutate(
      { divisionId: division.id, userIds },
      {
        onSuccess: () => {
          toast(message);
          after?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className={LABEL}>PM</p>
        <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
          + PM
        </Button>
      </div>
      {division.pms.length === 0 && <p className="text-sm text-muted-foreground">Belum ada PM.</p>}
      <ItemGroup className="gap-2">
        {division.pms.map((pm) => (
          <Item key={pm.id} variant="outline" size="sm">
            {confirmRemove === pm.id ? (
              <div className="flex w-full items-center gap-2 text-sm">
                <span className="mr-auto">Hapus {pm.name ?? pm.email} dari PM {division.name}?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={save.isPending}
                  onClick={() =>
                    update(
                      pmIds.filter((id) => id !== pm.id),
                      "PM dihapus.",
                      () => setConfirmRemove(null),
                    )
                  }
                >
                  Ya, hapus
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmRemove(null)}>
                  Batal
                </Button>
              </div>
            ) : (
              <>
                <ItemMedia>
                  <UserAvatar name={pm.name} email={pm.email} imageUrl={userById.get(pm.id)?.imageUrl ?? null} className="size-8" />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full truncate">{pm.name ?? pm.email}</ItemTitle>
                  {pm.name && <ItemDescription className="truncate">{pm.email}</ItemDescription>}
                </ItemContent>
                <ItemActions>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(pm.id)}>
                    Hapus
                  </Button>
                </ItemActions>
              </>
            )}
          </Item>
        ))}
      </ItemGroup>
      <UserPicker
        open={picking}
        title={`Tambah PM ${division.name}`}
        description="PM mengelola semua proyek di divisi ini: pengaturan, anggota, ekspor."
        options={candidates}
        onPick={(user) => update([...pmIds, user.id], `${user.name ?? user.email} jadi PM ${division.name}.`, () => setPicking(false))}
        onClose={() => setPicking(false)}
      />
    </div>
  );
}
