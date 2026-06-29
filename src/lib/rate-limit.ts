import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Rate limit por usuario y tipo, respaldado en base de datos (robusto en
 * entornos serverless). Cuenta los eventos recientes y, si no se ha superado
 * el máximo, registra uno nuevo.
 *
 * @returns ok=true si la petición está permitida; ok=false si se superó el límite.
 */
export async function checkAndRecordRateLimit(
  userId: string,
  kind: string,
  max = 3,
  windowSec = 60,
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const since = new Date(Date.now() - windowSec * 1000).toISOString();

  const { count, error } = await supabaseAdmin()
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since);

  // Si la comprobación falla, no bloqueamos al usuario (fail-open).
  if (error) return { ok: true, retryAfterSec: 0 };

  if ((count ?? 0) >= max) {
    return { ok: false, retryAfterSec: windowSec };
  }

  await supabaseAdmin().from("ai_usage_events").insert({ user_id: userId, kind });
  return { ok: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// Protección anti-fuerza bruta en el login.
// Tras varios intentos fallidos seguidos para un mismo email, se bloquea
// temporalmente. Los intentos correctos limpian el contador.
// ---------------------------------------------------------------------------

const LOGIN_MAX_FAILED = 5;
const LOGIN_WINDOW_SEC = 600; // 10 minutos

/** True si el email superó el máximo de intentos fallidos recientes. */
export async function isLoginThrottled(email: string): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_SEC * 1000).toISOString();

  const { count, error } = await supabaseAdmin()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("ok", false)
    .gte("created_at", since);

  // Si la comprobación falla, no bloqueamos al usuario (fail-open).
  if (error) return false;

  return (count ?? 0) >= LOGIN_MAX_FAILED;
}

/** Registra un intento de login. Si fue correcto, limpia los fallos previos. */
export async function recordLoginAttempt(email: string, ok: boolean): Promise<void> {
  try {
    await supabaseAdmin().from("login_attempts").insert({ email, ok });
    if (ok) {
      await supabaseAdmin()
        .from("login_attempts")
        .delete()
        .eq("email", email)
        .eq("ok", false);
    }
  } catch {
    // No bloqueamos el login si el registro falla.
  }
}
