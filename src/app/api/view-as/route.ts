import { publicRoute } from "@/lib/http";
import { stopViewAs } from "@/modules/members/commands/view-as";

/** Keluar dari "Lihat sebagai": satu-satunya tulis yang boleh selama mode itu (publicRoute = tanpa blokir). */
export const DELETE = publicRoute(async () => {
  await stopViewAs();
  return new Response(null, { status: 204 });
});
