import { History } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CARD_TITLE } from "@/components/app/typography";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/errors";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { ProfileHeader } from "../components/profile-header";
import { ProjectHistoryCard } from "../components/project-history-card";
import { getPersonHistory } from "../queries/history";
import type { PersonHistory } from "../types/history";

/** Tanpa `userId` = riwayat sendiri. */
export async function ProfileSection({ userId }: { userId?: Promise<string> }) {
  await connection();
  const db = getDb();
  const viewer = await requireCurrentUser(db);
  let history: PersonHistory;
  try {
    history = await getPersonHistory(db, viewer, userId ? await userId : viewer.id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const { person, isSelf, projects } = history;
  return (
    <div className="flex flex-col gap-5">
      <ProfileHeader person={person} />
      <h2 className={CARD_TITLE}>Riwayat proyek ({projects.length})</h2>
      {projects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <History className="size-8" />
            </EmptyMedia>
            <EmptyTitle>Belum ada riwayat</EmptyTitle>
            <EmptyDescription>
              {isSelf ? "Riwayat muncul setelah kamu mencatat transaksi atau memegang dompet di proyek." : "Belum ada transaksi atau pegangan dompet yang terlihat olehmu."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((summary) => (
            <li key={summary.project.id}>
              <ProjectHistoryCard summary={summary} href={`/lainnya/profil/${person.id}/${summary.project.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
