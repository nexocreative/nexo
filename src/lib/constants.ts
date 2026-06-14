/**
 * Categorías de gasto de Nexo y paleta de color de la marca.
 * `key` se almacena en la base de datos. Las categorías NO tienen color propio:
 * se distinguen por icono (lucide) + texto, para mantener una paleta consistente.
 */
export type CategoryKey =
  | "supermercado"
  | "restaurantes"
  | "transporte"
  | "ocio"
  | "suscripciones"
  | "salud"
  | "hogar"
  | "ropa"
  | "otros";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  /** Nombre del icono de lucide-react asociado (ver CategoryIcon). */
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "supermercado", label: "Supermercado", icon: "ShoppingCart" },
  { key: "restaurantes", label: "Restaurantes", icon: "UtensilsCrossed" },
  { key: "transporte", label: "Transporte", icon: "Car" },
  { key: "ocio", label: "Ocio", icon: "Gamepad2" },
  { key: "suscripciones", label: "Suscripciones", icon: "Music" },
  { key: "salud", label: "Salud", icon: "Pill" },
  { key: "hogar", label: "Hogar", icon: "Home" },
  { key: "ropa", label: "Ropa", icon: "Shirt" },
  { key: "otros", label: "Otros", icon: "Package" },
];

export const CATEGORY_MAP: Record<CategoryKey, CategoryDef> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<CategoryKey, CategoryDef>,
);

export function getCategory(key: string | null | undefined): CategoryDef {
  return CATEGORY_MAP[(key ?? "otros") as CategoryKey] ?? CATEGORY_MAP.otros;
}

/**
 * Paleta de marca: tres bases pastel y sus variantes suaves (soft = fondo,
 * ink = texto/acento legible). NO usar colores fuera de estas familias.
 */
export const PALETTE = {
  lila: "#A89FE8",
  lilaSoft: "#ECE9FB",
  lilaInk: "#5F54AE",
  mint: "#A8E6CF",
  mintSoft: "#E6F7EF",
  mintInk: "#3E9E7E",
  peach: "#FFD3B6",
  peachSoft: "#FFEEE1",
  peachInk: "#C47C45",
} as const;

/** Tintes pastel (familias lila/menta/melocotón) para los sectores del donut. */
export const CHART_PALETTE = [
  "#A89FE8", "#A8E6CF", "#FFD3B6",
  "#8E84D8", "#7FCFAD", "#F4B58E",
  "#C3BCF0", "#CDEFE0", "#FFE6D4",
];

export function chartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Umbrales de las alertas progresivas de presupuesto. */
export const BUDGET_THRESHOLDS = {
  warning: 0.75, // toast suave
  alert: 0.9, // card destacada
  blocked: 1.0, // bloqueo visual
} as const;

export type BudgetState = "ok" | "warning" | "alert" | "blocked";

export function budgetState(spent: number, limit: number): BudgetState {
  if (!limit || limit <= 0) return "ok";
  const ratio = spent / limit;
  if (ratio >= BUDGET_THRESHOLDS.blocked) return "blocked";
  if (ratio >= BUDGET_THRESHOLDS.alert) return "alert";
  if (ratio >= BUDGET_THRESHOLDS.warning) return "warning";
  return "ok";
}

/** Color (familia melocotón/lila) según el estado del presupuesto. */
export const STATE_COLOR: Record<BudgetState, string> = {
  ok: PALETTE.lila,
  warning: PALETTE.peach,
  alert: "#F4B58E",
  blocked: "#E3935E",
};

export const APP_NAME = "Nexo";
