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
  | "vacaciones"
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
  { key: "vacaciones", label: "Vacaciones", icon: "Palmtree" },
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
 *
 * `lila`/`mint`/`peach` son colores saturados fijos: se leen bien tanto en
 * claro como en oscuro (p.ej. un icono blanco sobre un círculo de color), así
 * que quedan en hex tal cual. `xxxSoft`/`xxxInk` en cambio se usan como fondo
 * de tarjeta + texto encima: en hex fijo, el fondo pastel casi blanco se
 * queda igual en modo oscuro mientras el resto del texto de la tarjeta (que
 * sí seguía el tema) se volvía blanco sobre blanco. Por eso son referencias a
 * variables CSS (ver globals.css) con una versión clara y otra oscura.
 */
export const PALETTE = {
  lila: "#A89FE8",
  lilaSoft: "hsl(var(--lila-soft))",
  lilaInk: "hsl(var(--lila-ink))",
  mint: "#A8E6CF",
  mintSoft: "hsl(var(--mint-soft))",
  mintInk: "hsl(var(--mint-ink))",
  peach: "#FFD3B6",
  peachSoft: "hsl(var(--peach-soft))",
  peachInk: "hsl(var(--peach-ink))",
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

/** Orden de severidad de los estados, para detectar cuándo se acaba de cruzar un umbral. */
const STATE_SEVERITY: Record<BudgetState, number> = { ok: 0, warning: 1, alert: 2, blocked: 3 };

/** true si `after` representa un cruce de umbral hacia arriba respecto a `before`. */
export function crossedThreshold(before: BudgetState, after: BudgetState): boolean {
  return STATE_SEVERITY[after] > STATE_SEVERITY[before];
}

/** Color (familia melocotón/lila) según el estado del presupuesto. */
export const STATE_COLOR: Record<BudgetState, string> = {
  ok: PALETTE.lila,
  warning: PALETTE.peach,
  alert: "#F4B58E",
  blocked: "#E3935E",
};

export const APP_NAME = "Nexo";
