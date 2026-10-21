import {
  ArrowLeftRight,
  Building2,
  Circle,
  CirclePlus,
  Coffee,
  CupSoda,
  Ellipsis,
  Fuel,
  Landmark,
  Sandwich,
  SquareParking,
  Ticket,
  Utensils,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Nama ikon disimpan di kategori (kebab-case lucide). Tambah di sini saat kategori baru memakai ikon lain.
const ICONS: Record<string, LucideIcon> = {
  "arrow-left-right": ArrowLeftRight,
  "building-2": Building2,
  "circle-plus": CirclePlus,
  coffee: Coffee,
  "cup-soda": CupSoda,
  ellipsis: Ellipsis,
  fuel: Fuel,
  landmark: Landmark,
  sandwich: Sandwich,
  "square-parking": SquareParking,
  ticket: Ticket,
  utensils: Utensils,
};

export function CategoryIcon({ name, ...props }: { name: string | null } & Omit<LucideProps, "name">) {
  const Icon = (name && ICONS[name]) || Circle;
  return <Icon aria-hidden {...props} />;
}
