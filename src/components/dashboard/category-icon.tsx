import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Music,
  Pill,
  Home,
  Shirt,
  Palmtree,
  Package,
  type LucideIcon,
} from "lucide-react";
import { getCategory } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Music,
  Pill,
  Home,
  Shirt,
  Palmtree,
  Package,
};

/** Icono lucide de una categoría (a partir de su key). */
export function CategoryIcon({
  category,
  className,
}: {
  category: string | null;
  className?: string;
}) {
  const Icon = ICONS[getCategory(category).icon] ?? Package;
  return <Icon className={className} />;
}

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICONS[iconName] ?? Package;
}
