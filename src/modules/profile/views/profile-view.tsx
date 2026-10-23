import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileProjectSection } from "../sections/profile-project-section";
import { ProfileSection } from "../sections/profile-section";

export function ProfileView({ userId }: { userId?: Promise<string> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProfileSection userId={userId} />
    </Suspense>
  );
}

export function ProfileProjectView({ userId, projectId }: { userId: Promise<string>; projectId: Promise<string> }) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ProfileProjectSection userId={userId} projectId={projectId} />
    </Suspense>
  );
}
