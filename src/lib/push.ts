import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Envía una notificación push a un usuario si tiene un token de dispositivo
 * guardado (ver profiles.push_token, registrado por la app móvil en
 * /api/mobile/push-token). No falla el flujo que la llama si algo sale mal:
 * las notificaciones son un "extra", nunca deben tumbar la acción principal.
 */
export async function sendPushNotification(
  userId: string,
  { title, body, data }: { title: string; body: string; data?: Record<string, unknown> },
): Promise<void> {
  try {
    const { data: profile } = await supabaseAdmin().from("profiles").select("push_token").eq("id", userId).maybeSingle();
    const token = profile?.push_token;
    if (!token) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, title, body, data, sound: "default" }),
    });
  } catch (e) {
    console.error("Error enviando push:", e);
  }
}
