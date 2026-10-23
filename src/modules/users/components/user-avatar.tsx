import { cn } from "@/lib/utils";

/** Foto profil Google, atau inisial bila tidak ada. */
export function UserAvatar({ name, email, imageUrl, className }: { name: string | null; email: string; imageUrl: string | null; className?: string }) {
  const initial = (name ?? email).trim().charAt(0).toUpperCase();
  return imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- foto Google eksternal kecil; next/image butuh remotePatterns + optimasi yang tidak perlu
    <img src={imageUrl} alt="" referrerPolicy="no-referrer" className={cn("size-10 shrink-0 rounded-full border-2 object-cover", className)} />
  ) : (
    <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-secondary font-head font-bold", className)}>
      {initial}
    </span>
  );
}
