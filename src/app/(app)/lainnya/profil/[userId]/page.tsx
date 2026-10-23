import { ProfileModule } from "@/modules/profile";

export default function PersonHistoryPage({ params }: PageProps<"/lainnya/profil/[userId]">) {
  return <ProfileModule userId={params.then((p) => p.userId)} />;
}
