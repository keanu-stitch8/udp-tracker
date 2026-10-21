// Nama ikon lucide (kebab-case) yang bisa dipilih untuk kategori. Disimpan di kolom categories.icon.
export const CATEGORY_ICONS = [
  "sandwich",
  "utensils",
  "coffee",
  "cup-soda",
  "fuel",
  "ticket",
  "square-parking",
  "car",
  "landmark",
  "bed-double",
  "shirt",
  "zap",
  "droplet",
  "wrench",
  "phone",
  "shopping-bag",
  "package",
  "camera",
  "receipt",
  "gift",
  "users",
  "building-2",
  "circle-plus",
  "ellipsis",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];
