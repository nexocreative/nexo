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

export type AiKind = "ticket" | "voice" | "import";

/** Pruebas gratuitas de IA por función, para el plan gratuito, de por vida (no se comparten entre funciones). */
export const FREE_AI_TRIAL_USES: Record<AiKind, number> = {
  ticket: 2,
  voice: 2,
  import: 1,
};

const AI_KIND_LABELS: Record<AiKind, string> = {
  ticket: "escanear tickets",
  voice: "registrar por voz",
  import: "importar extractos",
};

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

/**
 * Pruebas gratuitas de IA que le quedan al usuario, por función.
 * Devuelve `null` si es Plus (sin límite de pruebas, solo cuota mensual).
 */
export async function getFreeAiTrialRemaining(userId: string): Promise<Record<AiKind, number> | null> {
  const plan = await getUserPlan(userId);
  if (plan === "plus") return null;

  const kinds = Object.keys(FREE_AI_TRIAL_USES) as AiKind[];
  const entries = await Promise.all(
    kinds.map(async (kind) => {
      const { count } = await supabaseAdmin()
        .from("ai_usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", `${kind}_success`);
      return [kind, Math.max(0, FREE_AI_TRIAL_USES[kind] - (count ?? 0))] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<AiKind, number>;
}

/** Comprueba que el usuario puede usar una función de IA (Plus con cuota mensual, o gratis con pruebas limitadas por función). */
export async function requirePlusForAi(
  userId: string,
  kind: AiKind,
): Promise<
  | { ok: true }
  | { ok: false; status: 402; error: string; reason: "quota_exceeded" | "trial_exhausted" }
> {
  const plan = await getUserPlan(userId);

  // Solo cuentan los usos que terminaron con éxito (kind "..._success",
  // registrados por recordAiSuccess en lib/rate-limit.ts). Un análisis
  // fallido no debe descontar cupo al usuario.
  if (plan !== "plus") {
    const { count } = await supabaseAdmin()
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", `${kind}_success`);

    if ((count ?? 0) >= FREE_AI_TRIAL_USES[kind]) {
      return {
        ok: false,
        status: 402,
        error: `Has usado tus pruebas gratuitas para ${AI_KIND_LABELS[kind]}. Hazte Nexo Plus para uso ilimitado.`,
        reason: "trial_exhausted",
      };
    }
    return { ok: true };
  }

  const { count } = await supabaseAdmin()
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("kind", "%_success")
    .gte("created_at", startOfCurrentMonthIso());

  if ((count ?? 0) >= AI_MONTHLY_QUOTA) {
    return {
      ok: false,
      status: 402,
      error: "Has alcanzado tu límite mensual de IA. Vuelve a intentarlo el próximo mes.",
      reason: "quota_exceeded",
    };
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
