// Mode "Lihat sebagai" (spec pemegang dompet): Root/PM melihat app sebagai anggota tertentu, tanpa bisa mengubah data.
export const VIEW_AS_COOKIE = "udp_view_as";

export const VIEW_AS_READONLY_MESSAGE = "Mode lihat sebagai: data tidak bisa diubah. Keluar dulu dari mode ini.";

export function encodeViewAs(value: { projectId: string; userId: string }): string {
  return `${value.projectId}.${value.userId}`;
}

export function readViewAs(raw: string | undefined): { projectId: string; userId: string } | null {
  const [projectId, userId, ...rest] = raw?.split(".") ?? [];
  return projectId && userId && !rest.length ? { projectId, userId } : null;
}
