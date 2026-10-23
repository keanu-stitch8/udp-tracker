import "server-only";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { can, type Capability, type Role } from "@/modules/users/lib/access";
import { VIEW_AS_READONLY_MESSAGE } from "@/modules/users/lib/view-as";
import { getCurrentUser, getViewAs } from "@/modules/users/queries/current-user";
import { projectRole } from "@/modules/users/services/project-role";
import type { CurrentUser } from "@/modules/users/types/user";
import { ForbiddenError, NotFoundError, toErrorResponse, UnauthorizedError, ValidationError } from "./errors";

/**
 * Pertahanan berlapis (spec akses §5): proxy hanya memeriksa tanda tangan cookie, setiap route memuat user dari DB.
 * Tanpa sesi / user hilang → 401; akun belum aktif → 403. Yang dikembalikan pengguna efektif (lihat sebagai).
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser(getDb());
  if (!user) throw new UnauthorizedError();
  if (user.status !== "active") throw new ForbiddenError("Akun belum aktif. Tunggu konfirmasi admin.");
  return user;
}

/** Mode "Lihat sebagai" hanya membaca: setiap request yang mengubah data ditolak (spec pemegang dompet). */
export async function assertNotViewingAs(): Promise<void> {
  if (await getViewAs(getDb())) throw new ForbiddenError(VIEW_AS_READONLY_MESSAGE);
}

const isRead = (request: Request) => request.method === "GET" || request.method === "HEAD";

/** Untuk route ber-sesi: pengguna efektif, dan tulis diblokir selama lihat sebagai. */
async function requireUserFor(request: Request): Promise<CurrentUser> {
  if (!isRead(request)) await assertNotViewingAs();
  return requireUser();
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError({ _form: ["Body request harus JSON."] }, "Body request harus JSON.");
  }
}

type Handler<C, A> = (request: Request, context: C, auth: A) => Promise<Response>;

function wrap<C, A>(handler: Handler<C, A>, authorize: (request: Request, context: C) => Promise<A>) {
  return async (request: Request, context: C): Promise<Response> => {
    // Tandai dinamis di luar try: penolakan cookies() saat prerender build adalah sinyal Next, jangan diubah jadi respons error.
    await connection();
    try {
      return await handler(request, context, await authorize(request, context));
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Route non-proyek: user aktif wajib, lalu ubah error menjadi respons JSON. */
export function route<C>(handler: Handler<C, { user: CurrentUser }>) {
  return wrap(handler, async (request) => ({ user: await requireUserFor(request) }));
}

/** Tanpa sesi (login, logout, callback OAuth). Handler memeriksa sendiri bila perlu (`requireUser`). */
export function publicRoute<C>(handler: Handler<C, Record<string, never>>) {
  return wrap(handler, async () => ({}));
}

/** Route khusus Root (Pengguna, kelola Divisi). */
export function rootRoute<C>(handler: Handler<C, { user: CurrentUser }>) {
  return wrap(handler, async (request) => {
    const user = await requireUserFor(request);
    if (!user.isRoot) throw new ForbiddenError("Hanya Root yang bisa melakukan ini.");
    return { user };
  });
}

export interface ProjectAccess {
  user: CurrentUser;
  role: Role;
  projectId: string;
}

/** Semua route di `api/projects/[projectId]/`: tanpa akses → 404 (keberadaan proyek tidak bocor), kurang kemampuan → 403. */
export function projectRoute<C extends { params: Promise<{ projectId: string }> }>(capability: Capability, handler: Handler<C, ProjectAccess>) {
  return wrap(handler, async (request, context: C) => {
    const user = await requireUserFor(request);
    const { projectId } = await context.params;
    const role = await projectRole(getDb(), user, projectId);
    if (!role) throw new NotFoundError("Proyek tidak ditemukan.");
    if (!can(role, capability)) throw new ForbiddenError();
    return { user, role, projectId };
  });
}
