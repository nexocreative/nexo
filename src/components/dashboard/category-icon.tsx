import {
  ShoppingCart,
  ShoppingBag,
  UtensilsCrossed,
  Coffee,
  Car,
  Bus,
  Fuel,
  Plane,
  Gamepad2,
  Music,
  Film,
  Pill,
  Stethoscope,
  Home,
  Wrench,
  Shirt,
  Palmtree,
  Gift,
  Heart,
  PawPrint,
  Baby,
  GraduationCap,
  Briefcase,
  Smartphone,
  Laptop,
  Book,
  Dumbbell,
  Wallet,
  Sparkles,
  Package,
  type LucideIcon,
} from "lucide-react";
import { getCategory, type CategoryDef } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  ShoppingCart,
  ShoppingBag,
  UtensilsCrossed,
  Coffee,
  Car,
  Bus,
  Fuel,
  Plane,
  Gamepad2,
  Music,
  Film,
  Pill,
  Stethoscope,
  Home,
  Wrench,
  Shirt,
  Palmtree,
  Gift,
  Heart,
  PawPrint,
  Baby,
  GraduationCap,
  Briefcase,
  Smartphone,
  Laptop,
  Book,
  Dumbbell,
  Wallet,
  Sparkles,
  Package,
};

/**
 * Icono lucide de una categoría (a partir de su key). Si se pasa `categories`
 * (lista combinada por defecto + personalizadas, ver `useCategories`)
 * también resuelve el icono de categorías propias del usuario.
 */
export function CategoryIcon({
  category,
  categories,
  className,
}: {
  category: string | null;
  categories?: CategoryDef[];
  className?: string;
}) {
  const Icon = ICONS[getCategory(category, categories).icon] ?? Package;
  return <Icon className={className} />;
}

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICONS[iconName] ?? Package;
}
