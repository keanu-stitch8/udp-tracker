import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { UserAvatar } from "../components/user-avatar";
import { getCurrentUser } from "../queries/current-user";

/** Avatar kanan atas → profil sendiri. Saat "Lihat sebagai", yang tampil orang yang dilihat. */
export async function HeaderAvatarSection() {
  await connection();
  const user = await getCurrentUser(getDb());
  if (!user) return null;
  return (
    <Link href="/lainnya/profil" aria-label="Profil" className="shrink-0">
      <UserAvatar name={user.name} email={user.email} imageUrl={user.imageUrl} />
    </Link>
  );
}
