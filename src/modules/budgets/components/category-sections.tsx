import type { ReactNode } from "react";
import { LABEL } from "@/components/app/typography";
import { groupCategories } from "../lib/category-groups";
import type { Category } from "../types/category";
import type { CategoryGroup } from "../types/category-group";

/** Pilihan kategori dikelompokkan per grup (judul kecil per grup). `grouped=false` (pemasukan) → satu daftar tanpa judul. */
export function CategorySections<T extends Pick<Category, "id" | "name" | "groupId">>({
  groups,
  categories,
  grouped,
  listClassName,
  children,
}: {
  groups: CategoryGroup[];
  categories: T[];
  grouped: boolean;
  listClassName: string;
  children: (category: T) => ReactNode;
}) {
  if (!grouped) return <div className={listClassName}>{categories.map(children)}</div>;
  return (
    <div className="flex flex-col gap-3">
      {groupCategories(groups, categories).map(({ group, categories: items }) => (
        <div key={group.id} className="flex flex-col gap-1.5">
          <p className={`${LABEL} text-muted-foreground`}>{group.name}</p>
          <div className={listClassName}>{items.map(children)}</div>
        </div>
      ))}
    </div>
  );
}
