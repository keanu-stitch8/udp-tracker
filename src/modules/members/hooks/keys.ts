// Query key factory — dipakai hooks (browser) dan section (prefetch server). Tanpa impor server-only.
export const memberKeys = {
  all: ["members"] as const,
  list: (projectId: string) => [...memberKeys.all, projectId] as const,
};
