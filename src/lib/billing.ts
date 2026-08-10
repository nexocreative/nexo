import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type Plan = "free" | "plus";

/** Límites del plan gratuito. Nexo Plus no tiene ninguno de estos topes. */
export const FREE_LIMITS = {
  historyMonths: 3,
  maxGruposCreados: 1,
  maxVacacionesActivas: 1,
  maxCategoriasAhorro: 1,
} as const;

/** Techo del selector de meses para Plus (no es un límite real, solo evita una lista infinita). */
export const PLUS_HISTORY_MONTHS = 24;

/** Máximo de usos de IA (ticket + voz + import combinados) al mes, incluso siendo Plus. */
export const AI_MONTHLY_QUOTA = 60;

/** Plan actual del usuario a partir de `subscriptions.status`. */
export async function getUserPlan(userId: string): Promise<Plan> {
  const { data } = await supabaseAdmin()
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.status === "active" || data?.status === "trialing" ? "plus" : "free";
}

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Comprueba que el usuario puede usar una función de IA (plan Plus + cuota mensual). */
export async function requirePlusForAi(
  userId: string,
): Promise<{ ok: true } | { ok: false; status: 402; error: string }> {
  const plan = await getUserPlan(userId);
  if (plan !== "plus") {
    return { ok: false, status: 402, error: "Esta función es exclusiva de Nexo Plus." };
  }

  const { count } = await supabaseAdmin()
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfCurrentMonthIso());

  if ((count ?? 0) >= AI_MONTHLY_QUOTA) {
    return { ok: false, status: 402, error: "Has alcanzado tu límite mensual de IA. Vuelve a intentarlo el próximo mes." };
  }
  return { ok: true };
}

type LimitKind = "grupos" | "vacaciones" | "ahorro";

const LIMIT_MESSAGES: Record<LimitKind, string> = {
  grupos: `El plan gratuito permite crear ${FREE_LIMITS.maxGruposCreados} grupo. Hazte Plus para crear grupos ilimitados.`,
  vacaciones: `El plan gratuito permite ${FREE_LIMITS.maxVacacionesActivas} viaje activo a la vez. Hazte Plus para más.`,
  ahorro: `El plan gratuito permite ${FREE_LIMITS.maxCategoriasAhorro} categoría de ahorro. Hazte Plus para categorías ilimitadas.`,
};

/** Comprueba que el usuario no ha superado el límite gratuito de grupos/vacaciones activas/categorías de ahorro. */
export async function assertUnderLimit(
  userId: string,
  kind: LimitKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await getUserPlan(userId);
  if (plan === "plus") return { ok: true };

  const admin = supabaseAdmin();
  let count = 0;
  if (kind === "grupos") {
    const { count: c } = await admin
      .from("grupos")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId);
    count = c ?? 0;
  } else if (kind === "vacaciones") {
    const { count: c } = await admin
      .from("vacation_periods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");
    count = c ?? 0;
  } else {
    const { count: c } = await admin
      .from("savings_categories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    count = c ?? 0;
  }

  const limit =
    kind === "grupos" ? FREE_LIMITS.maxGruposCreados
    : kind === "vacaciones" ? FREE_LIMITS.maxVacacionesActivas
    : FREE_LIMITS.maxCategoriasAhorro;

  if (count >= limit) return { ok: false, error: LIMIT_MESSAGES[kind] };
  return { ok: true };
}
