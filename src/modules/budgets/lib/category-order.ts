import type { Category } from "../types/category";

const isOther = (name: string) => /^lain(-lain|nya)$/i.test(name.trim());

/** Urutan pilihan kategori: A–Z, "Lain-lain"/"Lainnya" selalu di akhir. */
export function sortCategoriesForPicker<T extends Pick<Category, "name">>(categories: T[]): T[] {
  return [...categories].sort((a, b) => Number(isOther(a.name)) - Number(isOther(b.name)) || a.name.localeCompare(b.name, "id"));
}
