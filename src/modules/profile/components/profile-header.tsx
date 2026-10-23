import { UserAvatar } from "@/modules/users/components/user-avatar";
import type { ProfilePerson } from "../types/history";

export function ProfileHeader({ person }: { person: ProfilePerson }) {
  return (
    <div className="flex items-center gap-3 border-2 bg-card p-3 shadow-md">
      <UserAvatar name={person.name} email={person.email} imageUrl={person.imageUrl} />
      <div className="min-w-0">
        <p className="truncate font-medium">{person.name ?? person.email}</p>
        <p className="truncate text-xs text-muted-foreground">{person.email}</p>
      </div>
    </div>
  );
}
