"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/data/queries";
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
    .update({ password: passwordHash })
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
