// Peran efektif per proyek dan kemampuannya (spec akses multi-divisi §2).
export type Role = "root" | "pm" | "member";

export const CAPABILITIES = ["view", "transact", "budgetSecret", "manage"] as const;
export type Capability = (typeof CAPABILITIES)[number];

const MEMBER: readonly Capability[] = ["view", "transact"];

/** `null` = tidak punya akses ke proyek itu. */
export function can(role: Role | null, capability: Capability): boolean {
  if (!role) return false;
  return role === "member" ? MEMBER.includes(capability) : true;
}
