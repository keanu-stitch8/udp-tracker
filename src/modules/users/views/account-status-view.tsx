import { Clock, ShieldX } from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import type { CurrentUser } from "../types/user";

/** Pengganti isi halaman untuk akun yang belum/tidak aktif (spec akses §3). */
export function AccountStatusView({ user }: { user: CurrentUser }) {
  const pending = user.status === "pending";
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>{pending ? <Clock className="size-8" /> : <ShieldX className="size-8" />}</EmptyMedia>
        <EmptyTitle>{pending ? "Menunggu konfirmasi admin" : "Akses ditolak"}</EmptyTitle>
        <EmptyDescription>
          {pending ? (
            <>
              Kamu masuk sebagai <span className="font-medium">{user.email}</span>. Admin akan menyetujui akunmu, lalu buka lagi halaman ini.
            </>
          ) : (
            "Akun ini tidak diberi akses ke UDP Tracker. Hubungi admin bila ini keliru."
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LogoutButton />
      </EmptyContent>
    </Empty>
  );
}
