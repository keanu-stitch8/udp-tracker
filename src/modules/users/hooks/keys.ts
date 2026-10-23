// Query key factory — dipakai hooks (browser) dan section (prefetch server). Tanpa impor server-only.
export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};
