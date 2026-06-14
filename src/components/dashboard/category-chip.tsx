import { getCategory } from "@/lib/constants";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { cn } from "@/lib/utils";

/** Chip de categoría neutro (icono + texto). Mismo estilo para todas. */
export function CategoryChip({
  category,
  className,
}: {
  category: string | null;
  className?: string;
}) {
  const cat = getCategory(category);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground",
        className,
      )}
    >
      <CategoryIcon category={cat.key} className="h-3.5 w-3.5" />
      {cat.label}
    </span>
  );
}
