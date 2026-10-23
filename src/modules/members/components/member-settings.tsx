"use client";

import { Eye, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CARD_TITLE } from "@/components/app/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { ApiError } from "@/lib/api-client";
import { UserAvatar } from "@/modules/users/components/user-avatar";
import { UserPicker } from "@/modules/users/components/user-picker";
import { useAddMember, useCancelInvitation, useMembers, useRemoveMember, useStartViewAs } from "../hooks/use-members";

type Confirm = { kind: "member"; id: string } | { kind: "invitation"; id: string } | null;

export function MemberSettings({ projectId, projectName }: { projectId: string; projectName: string }) {
  const { data } = useMembers(projectId);
  const add = useAddMember(projectId);
  const remove = useRemoveMember(projectId);
  const viewAs = useStartViewAs(projectId);
  const router = useRouter();
  const cancel = useCancelInvitation(projectId);
  const [email, setEmail] = useState("");
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const emailError = add.error instanceof ApiError ? (add.error.fieldErrors.email?.[0] ?? add.error.message) : null;
  if (!data) return null;

  const confirmRow = (label: string, onYes: () => void, pending: boolean) => (
    <div className="flex w-full items-center gap-2 text-sm">
      <span className="mr-auto">{label}</span>
      <Button size="sm" variant="destructive" disabled={pending} onClick={onYes}>
        Ya, hapus
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>
        Batal
      </Button>
    </div>
  );
  const done = (message: string) => ({
    onSuccess: () => {
      toast(message);
      setConfirm(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Tambah anggota</CardTitle>
          <CardDescription>Anggota bisa mencatat transaksi dan cek saldo di {projectName}, tanpa pengaturan, pagu, dan ekspor.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => setPicking(true)}>Pilih dari pengguna</Button>
          <form
            className="flex flex-col gap-3 border-t-2 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              add.mutate(email, {
                onSuccess: (result) => {
                  toast(result.result === "invited" ? "Undangan disimpan. Ia jadi anggota saat pertama kali login." : "Anggota ditambahkan.");
                  setEmail("");
                },
              });
            }}
          >
            <Field data-invalid={emailError ? true : undefined}>
              <FieldLabel htmlFor="member-email">Belum pernah login? Undang lewat email Google</FieldLabel>
              <Input id="member-email" type="email" inputMode="email" autoComplete="off" className="h-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              {emailError && <FieldError>{emailError}</FieldError>}
            </Field>
            <Button type="submit" variant="outline" disabled={!email.trim() || add.isPending}>
              {add.isPending ? "Menambahkan…" : "Undang"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <UserPicker
        open={picking}
        title="Tambah anggota"
        description="Semua pengguna aktif, termasuk dari divisi lain."
        options={data.candidates}
        onPick={(user) =>
          add.mutate(user.email, {
            onSuccess: () => {
              toast(`${user.name ?? user.email} ditambahkan.`);
              setPicking(false);
            },
            onError: (error) => toast.error(error.message),
          })
        }
        onClose={() => setPicking(false)}
      />

      <section className="flex flex-col gap-2">
        <h2 className={CARD_TITLE}>Anggota ({data.members.length})</h2>
        {data.members.length === 0 && <p className="text-sm text-muted-foreground">Belum ada anggota. PM divisi dan Root sudah otomatis punya akses.</p>}
        <ItemGroup className="gap-2">
          {data.members.map((member) => (
            <Item key={member.userId} variant="outline" className="bg-card">
              {confirm?.kind === "member" && confirm.id === member.userId ? (
                confirmRow(`Hapus ${member.name ?? member.email} dari proyek?`, () => remove.mutate(member.userId, done("Anggota dihapus.")), remove.isPending)
              ) : (
                <>
                  <ItemMedia>
                    <UserAvatar name={member.name} email={member.email} imageUrl={member.imageUrl} />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full truncate">{member.name ?? member.email}</ItemTitle>
                    <ItemDescription className="truncate">{member.email}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Lihat sebagai ${member.name ?? member.email}`}
                      disabled={viewAs.isPending}
                      onClick={() =>
                        viewAs.mutate(member.userId, {
                          onSuccess: () => {
                            router.push("/");
                            router.refresh();
                          },
                          onError: (error) => toast.error(error.message),
                        })
                      }
                    >
                      <Eye /> Lihat
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: "member", id: member.userId })}>
                      Hapus
                    </Button>
                  </ItemActions>
                </>
              )}
            </Item>
          ))}
        </ItemGroup>
      </section>

      {data.invitations.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className={CARD_TITLE}>Undangan menunggu ({data.invitations.length})</h2>
          <ItemGroup className="gap-2">
            {data.invitations.map((invitation) => (
              <Item key={invitation.email} variant="outline" className="bg-card">
                {confirm?.kind === "invitation" && confirm.id === invitation.email ? (
                  confirmRow(`Batalkan undangan ${invitation.email}?`, () => cancel.mutate(invitation.email, done("Undangan dibatalkan.")), cancel.isPending)
                ) : (
                  <>
                    <ItemMedia variant="icon">
                      <Mail />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="w-full truncate">{invitation.email}</ItemTitle>
                      <ItemDescription>Belum pernah login</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: "invitation", id: invitation.email })}>
                        Batalkan
                      </Button>
                    </ItemActions>
                  </>
                )}
              </Item>
            ))}
          </ItemGroup>
        </section>
      )}
    </div>
  );
}
