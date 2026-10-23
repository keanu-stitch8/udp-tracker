// Query key factory — dipakai hooks (browser) dan section (prefetch server). Tanpa impor server-only.
export const divisionKeys = {
  all: ["divisions"] as const,
  list: () => [...divisionKeys.all, "list"] as const,
};
