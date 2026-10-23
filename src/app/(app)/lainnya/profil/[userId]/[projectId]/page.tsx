import { ProfileProjectModule } from "@/modules/profile";

export default function PersonProjectHistoryPage({ params }: PageProps<"/lainnya/profil/[userId]/[projectId]">) {
  return <ProfileProjectModule userId={params.then((p) => p.userId)} projectId={params.then((p) => p.projectId)} />;
}
