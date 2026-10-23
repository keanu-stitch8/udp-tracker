import { ProfileProjectView, ProfileView } from "./views/profile-view";

export function ProfileModule({ userId }: { userId?: Promise<string> }) {
  return <ProfileView userId={userId} />;
}

export function ProfileProjectModule({ userId, projectId }: { userId: Promise<string>; projectId: Promise<string> }) {
  return <ProfileProjectView userId={userId} projectId={projectId} />;
}
