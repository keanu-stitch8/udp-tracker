// Query key factory — dipakai hooks (browser) dan section (prefetch server). Tanpa impor server-only.
export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};
