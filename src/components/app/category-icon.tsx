import {
  ArrowLeftRight,
  BedDouble,
  Building2,
  Camera,
  Car,
  Circle,
  CirclePlus,
  Coffee,
  CupSoda,
  Droplet,
  Ellipsis,
  Fuel,
  Gift,
  Landmark,
  Package,
  Phone,
  Receipt,
  Sandwich,
  Shirt,
  ShoppingBag,
  SquareParking,
  Ticket,
  Users,
  Utensils,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { CategoryIconName } from "@/modules/shared/types/category-icons";

// Nama ikon disimpan di kategori (kebab-case lucide). "arrow-left-right" khusus baris transfer.
const ICONS: Record<CategoryIconName | "arrow-left-right", LucideIcon> = {
  "arrow-left-right": ArrowLeftRight,
  "bed-double": BedDouble,
  "building-2": Building2,
  camera: Camera,
  car: Car,
  "circle-plus": CirclePlus,
  coffee: Coffee,
  "cup-soda": CupSoda,
  droplet: Droplet,
  ellipsis: Ellipsis,
  fuel: Fuel,
  gift: Gift,
  landmark: Landmark,
  package: Package,
  phone: Phone,
  receipt: Receipt,
  sandwich: Sandwich,
  shirt: Shirt,
  "shopping-bag": ShoppingBag,
  "square-parking": SquareParking,
  ticket: Ticket,
  users: Users,
  utensils: Utensils,
  wrench: Wrench,
  zap: Zap,
};

const iconOf = (name: string | null): LucideIcon | undefined => (name ? ICONS[name as keyof typeof ICONS] : undefined);

export function hasCategoryIcon(name: string): boolean {
  return iconOf(name) !== undefined;
}

export function CategoryIcon({ name, ...props }: { name: string | null } & Omit<LucideProps, "name">) {
  const Icon = (name && ICONS[name as keyof typeof ICONS]) || Circle;
  return <Icon aria-hidden {...props} />;
}
