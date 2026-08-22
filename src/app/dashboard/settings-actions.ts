"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/data/queries";
import { getStripe } from "@/lib/stripe";
import type { ActionResult } from "./actions";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Introduce tu contraseña actual"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const admin = supabaseAdmin();
  const { data: user } = await admin
    .schema("next_auth")
    .from("users")
    .select("password")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.password) {
    return { ok: false, error: "No se pudo verificar tu contraseña actual" };
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return { ok: false, error: "La contraseña actual no es correcta" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await admin
    .schema("next_auth")
    .from("users")
    // session_version invalida cualquier sesión (JWT) ya emitida, incluida
    // la que se está usando ahora mismo: tras cambiar la contraseña hay que
    // volver a entrar, como en la mayoría de apps.
    .update({ password: passwordHash, session_version: Date.now() })
    .eq("id", userId);

  if (error) return { ok: false, error: "No se pudo actualizar la contraseña" };
  return { ok: true };
}

const notificationPrefsSchema = z.object({
  grupo_invite: z.boolean(),
  grupo_gasto: z.boolean(),
});

export async function updateNotificationPrefs(
  prefs: z.infer<typeof notificationPrefsSchema>,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = notificationPrefsSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ notification_prefs: parsed.data })
    .eq("id", userId);

  if (error) return { ok: false, error: "No se pudieron guardar las preferencias" };
  revalidatePath("/dashboard/ajustes");
  return { ok: true };
}

/**
 * Borra la cuenta y todos los datos personales del usuario (gastos, ingresos,
 * ahorro, viajes, categorías propias, notificaciones...) y cancela su
 * suscripción de Stripe si tenía una activa.
 *
 * La fila de next_auth.users NO se borra, se anonimiza (sin nombre, email ni
 * contraseña): grupo_miembros/grupo_gastos/grupo_gasto_partes/grupo_settlements
 * referencian ese id sin "on delete cascade" a propósito, para no romper el
 * historial de gasto ni los saldos de "En conjunto" de quienes compartían
 * grupo con esta persona. Si el usuario había creado o estaba en algún grupo,
 * ese grupo y su historial de gastos compartidos siguen intactos para el
 * resto de miembros; esta cuenta simplemente deja de tener nombre/email ahí.
 */
export async function deleteAccount(input: { confirmText: string; password?: string }): Promise<ActionResult> {
  const userId = await requireUserId();

  if (input.confirmText.trim().toUpperCase() !== "ELIMINAR") {
    return { ok: false, error: 'Escribe "ELIMINAR" para confirmar' };
  }

  const admin = supabaseAdmin();
  const { data: authUser } = await admin
    .schema("next_auth")
    .from("users")
    .select("password")
    .eq("id", userId)
    .maybeSingle();

  if (authUser?.password) {
    if (!input.password) return { ok: false, error: "Introduce tu contraseña para confirmar" };
    const valid = await bcrypt.compare(input.password, authUser.password);
    if (!valid) return { ok: false, error: "La contraseña no es correcta" };
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (sub?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
    } catch (e) {
      console.error("Error cancelando suscripción de Stripe al borrar la cuenta:", e);
    }
  }

  const { data: files } = await admin.storage.from("receipts").list(userId);
  if (files && files.length > 0) {
    await admin.storage.from("receipts").remove(files.map((f) => `${userId}/${f.name}`));
  }

  await Promise.all([
    admin.from("transactions").delete().eq("user_id", userId),
    admin.from("recurring_rules").delete().eq("user_id", userId),
    admin.from("vacation_periods").delete().eq("user_id", userId),
    admin.from("category_budgets").delete().eq("user_id", userId),
    admin.from("savings_entries").delete().eq("user_id", userId),
    admin.from("savings_categories").delete().eq("user_id", userId),
    admin.from("ai_recommendations").delete().eq("user_id", userId),
    admin.from("ai_usage_events").delete().eq("user_id", userId),
    admin.from("categories").delete().eq("user_id", userId),
    admin.from("notifications").delete().eq("user_id", userId),
    admin.from("subscriptions").delete().eq("user_id", userId),
    admin.from("profiles").delete().eq("id", userId),
  ]);

  await Promise.all([
    admin.schema("next_auth").from("sessions").delete().eq("userId", userId),
    admin.schema("next_auth").from("accounts").delete().eq("userId", userId),
  ]);

  await admin
    .schema("next_auth")
    .from("users")
    .update({ name: null, email: null, image: null, password: null, session_version: Date.now() })
    .eq("id", userId);

  return { ok: true };
}
