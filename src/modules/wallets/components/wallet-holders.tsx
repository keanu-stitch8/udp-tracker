"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CARD_TITLE } from "@/components/app/typography";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { useMembers } from "@/modules/members/hooks/use-members";
import { UserPicker } from "@/modules/users/components/user-picker";
import { useSetWalletHolders } from "../hooks/use-wallets";
import type { WalletDetail } from "../queries/wallets";

/** Pemegang dompet (spec pemegang dompet): anggota yang boleh mencatat di dompet ini. Root/PM mengatur, dipilih dari anggota proyek. */
export function WalletHolders({ detail, canManage }: { detail: WalletDetail; canManage: boolean }) {
  const { wallet } = detail;
  const holderIds = wallet.holders.map((h) => h.id);
  const save = useSetWalletHolders(detail.projectId, wallet.id);
  const [picking, setPicking] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const update = (userIds: string[], message: string, after?: () => void) =>
    save.mutate(userIds, {
      onSuccess: () => {
        toast(message);
        after?.();
      },
      onError: (error) => toast.error(error.message),
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>Pemegang</CardTitle>
        <CardDescription>Anggota hanya bisa mencatat di dompet yang dia pegang. Root dan PM bebas di semua dompet.</CardDescription>
        {canManage && (
          <CardAction>
            <Button size="sm" variant="outline" disabled={detail.locked} onClick={() => setPicking(true)}>
              + Pemegang
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {wallet.holders.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pemegang.</p>}
        <ItemGroup className="gap-2">
          {wallet.holders.map((holder) => (
            <Item key={holder.id} variant="outline" size="sm">
              {confirmRemove === holder.id ? (
                <div className="flex w-full items-center gap-2 text-sm">
                  <span className="mr-auto">Cabut {holder.name} dari {wallet.name}?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={save.isPending}
                    onClick={() =>
                      update(
                        holderIds.filter((id) => id !== holder.id),
                        "Pemegang dicabut.",
                        () => setConfirmRemove(null),
                      )
                    }
                  >
                    Ya, cabut
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmRemove(null)}>
                    Batal
                  </Button>
                </div>
              ) : (
                <>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full truncate">{holder.name}</ItemTitle>
                  </ItemContent>
                  {canManage && (
                    <ItemActions>
                      <Button size="sm" variant="ghost" disabled={detail.locked} onClick={() => setConfirmRemove(holder.id)}>
                        Cabut
                      </Button>
                    </ItemActions>
                  )}
                </>
              )}
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
      {canManage && (
        <HolderPicker
          projectId={detail.projectId}
          open={picking}
          walletName={wallet.name}
          holderIds={holderIds}
          onPick={(userId, name) => update([...holderIds, userId], `${name} jadi pemegang ${wallet.name}.`, () => setPicking(false))}
          onClose={() => setPicking(false)}
        />
      )}
    </Card>
  );
}

/** Daftar anggota proyek hanya dimuat untuk Root/PM (route anggota butuh `manage`). */
function HolderPicker({
  projectId,
  open,
  walletName,
  holderIds,
  onPick,
  onClose,
}: {
  projectId: string;
  open: boolean;
  walletName: string;
  holderIds: string[];
  onPick: (userId: string, name: string) => void;
  onClose: () => void;
}) {
  const { data } = useMembers(projectId);
  const options = (data?.members ?? []).filter((m) => !holderIds.includes(m.userId)).map((m) => ({ id: m.userId, email: m.email, name: m.name, imageUrl: m.imageUrl }));
  return (
    <UserPicker
      open={open}
      title={`Tambah pemegang ${walletName}`}
      description="Pilih dari anggota proyek. Tambahkan orangnya di Anggota proyek dulu bila belum ada."
      emptyText="Semua anggota proyek sudah memegang dompet ini."
      options={options}
      onPick={(user) => onPick(user.id, user.name ?? user.email)}
      onClose={onClose}
    />
  );
}
