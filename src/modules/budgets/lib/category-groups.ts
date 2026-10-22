import type { Category } from "../types/category";
import type { CategoryGroup } from "../types/category-group";
import { sortCategoriesForPicker } from "./category-order";

export interface CategorySection<T> {
  group: CategoryGroup;
  categories: T[];
}

/** Kategori per grup untuk tampilan: grup A–Z ("Lain-lain" terakhir), kategori urut picker. Kategori tanpa grup (pemasukan) tidak ikut. */
export function groupCategories<T extends Pick<Category, "name" | "groupId">>(groups: CategoryGroup[], categories: T[], options: { keepEmpty?: boolean } = {}): CategorySection<T>[] {
  return sortCategoriesForPicker(groups)
    .map((group) => ({ group, categories: sortCategoriesForPicker(categories.filter((c) => c.groupId === group.id)) }))
    .filter((section) => options.keepEmpty || section.categories.length > 0);
}
