"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireUserId, getPartnerState, materializeRecurring, materializeSavingsPlan } from "@/lib/data/queries";
import { monthKey } from "@/lib/format";

/** Rango ISO [primer día, último día] del mes en curso (componentes locales). */
function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${y}-${p(m + 1)}-01`,
    end: `${y}-${p(m + 1)}-${p(new Date(y, m + 1, 0).getDate())}`,
  };
}

const CATEGORY_KEYS = [
  "supermercado", "restaurantes", "transporte", "ocio", "suscripciones",
  "salud", "hogar", "ropa", "vacaciones", "otros",
] as const;

export type ActionResult = { ok: true } | { ok: false; error: string };

// --- Añadir movimiento (gasto o ingreso) -----------------------------------

const txSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive("El importe debe ser mayor que 0"),
  category: z.enum(CATEGORY_KEYS).nullable().optional(),
  merchant: z.string().trim().max(120).optional(),
  description: z.string().trim().max(240).optional(),
  occurred_at: z.string().optional(),
  source: z.enum(["manual", "photo", "voice", "chat"]).default("manual"),
  vacation_id: z.string().uuid().nullable().optional(),
  receipt_url: z.string().max(400).nullable().optional(),
  ai_confidence: z.coerce.number().min(0).max(1).nullable().optional(),
});

export async function createTransaction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = txSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const { error } = await supabaseAdmin().from("transactions").insert({
    user_id: userId,
    type: d.type,
    amount: d.amount,
    category: d.type === "income" ? null : d.category ?? "otros",
    merchant: d.merchant || null,
    description: d.description || null,
    occurred_at: d.occurred_at || new Date().toISOString().slice(0, 10),
    source: d.source,
    vacation_id: d.vacation_id ?? null,
    receipt_url: d.receipt_url ?? null,
    ai_confidence: d.ai_confidence ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// --- Añadir ingreso (con categoría libre: Salario, Otros, o personalizada) --

const incomeSchema = z.object({
  amount: z.coerce.number().positive("El importe debe ser mayor que 0"),
  category: z.string().trim().min(1, "La categoría es obligatoria").max(60),
  description: z.string().trim().max(240).optional(),
  occurred_at: z.string().optional(),
});

export async function createIncome(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const { error } = await supabaseAdmin().from("transactions").insert({
    user_id: userId,
    type: "income",
    amount: d.amount,
    category: d.category,
    // Se guarda también como "merchant" para que se muestre como título del movimiento.
    merchant: d.category,
    description: d.description || null,
    occurred_at: d.occurred_at || new Date().toISOString().slice(0, 10),
    source: "manual",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Elimina un movimiento (gasto o ingreso) del usuario. */
export async function deleteTransaction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!id) return { ok: false, error: "ID no válido" };
  const { error } = await supabaseAdmin()
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// --- Gastos / ingresos fijos (reglas recurrentes) --------------------------

const recurringSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive("El importe debe ser mayor que 0"),
  category: z.enum(CATEGORY_KEYS).nullable().optional(),
  description: z.string().trim().min(1, "El concepto es obligatorio").max(120),
  day_of_month: z.coerce.number().int().min(1).max(28),
  active: z.boolean().optional(),
});

export async function createRecurring(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const { error } = await supabaseAdmin().from("recurring_rules").insert({
    user_id: userId,
    type: d.type,
    amount: d.amount,
    category: d.type === "income" ? null : d.category ?? "otros",
    description: d.description,
    day_of_month: d.day_of_month,
    active: true,
  });
  if (error) return { ok: false, error: error.message };
  // Contabiliza ya el gasto fijo de este mes.
  await materializeRecurring(userId).catch(() => {});
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function updateRecurring(id: string, input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = recurringSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.type !== undefined) patch.type = d.type;
  if (d.amount !== undefined) patch.amount = d.amount;
  if (d.description !== undefined) patch.description = d.description;
  if (d.day_of_month !== undefined) patch.day_of_month = d.day_of_month;
  if (d.active !== undefined) patch.active = d.active;
  if (d.category !== undefined) patch.category = d.type === "income" ? null : d.category;
  const { error } = await supabaseAdmin()
    .from("recurring_rules")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  // Reconcilia el mes en curso: borra la transacción generada y la regenera
  // con los nuevos valores (o la deja fuera si se pausó / pasó a ingreso).
  const { start, end } = currentMonthRange();
  await supabaseAdmin()
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("recurring_rule_id", id)
    .gte("occurred_at", start)
    .lte("occurred_at", end);
  await supabaseAdmin()
    .from("recurring_rules")
    .update({ last_generated_month: null })
    .eq("id", id)
    .eq("user_id", userId);
  await materializeRecurring(userId).catch(() => {});

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  // Quita también el gasto generado de este mes para que el total baje.
  const { start, end } = currentMonthRange();
  await supabaseAdmin()
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("recurring_rule_id", id)
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  const { error } = await supabaseAdmin()
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// --- Confirmación de nómina mensual ----------------------------------------

export async function confirmNomina(input: {
  isUsual: boolean;
  amount?: number;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const { data: rules } = await supabaseAdmin()
    .from("recurring_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "income")
    .eq("active", true)
    .limit(1);
  const rule = rules?.[0];
  if (!rule) return { ok: false, error: "No hay nómina configurada" };

  const amount = input.isUsual ? Number(rule.amount) : Number(input.amount);
  if (!amount || amount <= 0) return { ok: false, error: "Importe no válido" };

  const { error } = await supabaseAdmin().from("transactions").insert({
    user_id: userId,
    type: "income",
    amount,
    category: null,
    description: input.isUsual ? "Nómina mensual" : "Nómina (ajustada)",
    merchant: rule.description ?? "Nómina",
    occurred_at: new Date().toISOString().slice(0, 10),
    source: "recurring",
    recurring_rule_id: rule.id,
  });
  if (error) return { ok: false, error: error.message };

  await supabaseAdmin()
    .from("recurring_rules")
    .update({ last_generated_month: monthKey(new Date()) })
    .eq("id", rule.id);

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// --- Límites ---------------------------------------------------------------

export async function setGlobalBudget(amount: number): Promise<ActionResult> {
  const userId = await requireUserId();
  const value = Number(amount);
  if (!(value >= 0)) return { ok: false, error: "Importe no válido" };
  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ monthly_budget: value })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function upsertCategoryLimit(
  category: string,
  amount: number,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!CATEGORY_KEYS.includes(category as (typeof CATEGORY_KEYS)[number])) {
    return { ok: false, error: "Categoría no válida" };
  }
  const value = Number(amount);
  if (!(value >= 0)) return { ok: false, error: "Importe no válido" };
  const { error } = await supabaseAdmin()
    .from("category_budgets")
    .upsert(
      { user_id: userId, category, monthly_limit: value },
      { onConflict: "user_id,category" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/limites");
  return { ok: true };
}

// --- Ahorro mensual por categorías -----------------------------------------

const savingsCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  monthly_plan: z.coerce.number().min(0, "No puede ser negativo"),
});

/** Crea una categoría de ahorro. */
export async function createSavingsCategory(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = savingsCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  // Coloca la nueva al final.
  const { data: last } = await supabaseAdmin()
    .from("savings_categories")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = (last?.[0]?.sort_order ?? -1) + 1;
  const { error } = await supabaseAdmin().from("savings_categories").insert({
    user_id: userId,
    name: d.name,
    monthly_plan: d.monthly_plan,
    sort_order,
  });
  if (error) return { ok: false, error: error.message };
  await materializeSavingsPlan(userId).catch(() => {});
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Edita una categoría de ahorro (nombre y/o plan mensual). */
export async function updateSavingsCategory(id: string, input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = savingsCategorySchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.name !== undefined) patch.name = d.name;
  if (d.monthly_plan !== undefined) patch.monthly_plan = d.monthly_plan;
  const { error } = await supabaseAdmin()
    .from("savings_categories")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  // Si cambió el plan, actualiza la entrada 'plan' del mes en curso para que
  // el balance refleje el nuevo importe al instante.
  if (d.monthly_plan !== undefined) {
    const mk = monthKey(new Date());
    await supabaseAdmin()
      .from("savings_entries")
      .delete()
      .eq("user_id", userId)
      .eq("category_id", id)
      .eq("month", mk)
      .eq("source", "plan");
    if (d.monthly_plan > 0) {
      await supabaseAdmin().from("savings_entries").insert({
        user_id: userId,
        category_id: id,
        amount: d.monthly_plan,
        month: mk,
        source: "plan",
      });
    }
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Elimina una categoría de ahorro (y sus aportes, por cascada). */
export async function deleteSavingsCategory(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!id) return { ok: false, error: "ID no válido" };
  const { error } = await supabaseAdmin()
    .from("savings_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Añade un aporte/ajuste manual de ahorro a una categoría (mes en curso por defecto). */
export async function addSavingsEntry(input: {
  category_id: string;
  amount: number;
  month?: string;
  note?: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const amount = Number(input.amount);
  if (!amount || Number.isNaN(amount)) return { ok: false, error: "Importe no válido" };
  if (!input.category_id) return { ok: false, error: "Selecciona una categoría" };
  const month = input.month?.match(/^\d{4}-\d{2}$/) ? input.month : monthKey(new Date());

  // Verifica que la categoría es del usuario.
  const { data: cat } = await supabaseAdmin()
    .from("savings_categories")
    .select("id")
    .eq("id", input.category_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!cat) return { ok: false, error: "Categoría no encontrada" };

  const { error } = await supabaseAdmin().from("savings_entries").insert({
    user_id: userId,
    category_id: input.category_id,
    amount,
    month,
    source: "manual",
    note: input.note || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Elimina un aporte de ahorro concreto. */
export async function deleteSavingsEntry(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!id) return { ok: false, error: "ID no válido" };
  const { error } = await supabaseAdmin()
    .from("savings_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// --- Ahorro conjunto -------------------------------------------------------

export async function contributeSavings(amount: number): Promise<ActionResult> {
  const userId = await requireUserId();
  const value = Number(amount);
  if (!(value > 0)) return { ok: false, error: "Importe no válido" };
  const { data: goals } = await supabaseAdmin()
    .from("savings_goals")
    .select("*")
    .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
    .limit(1);
  const goal = goals?.[0];
  if (!goal) return { ok: false, error: "No hay objetivo de ahorro" };
  const { error } = await supabaseAdmin()
    .from("savings_goals")
    .update({ current_amount: Number(goal.current_amount) + value })
    .eq("id", goal.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/juntos");
  return { ok: true };
}

// --- Consentimiento de vista conjunta --------------------------------------

export async function togglePartnerConsent(consent: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const ps = await getPartnerState(userId);
  if (!ps.link) return { ok: false, error: "No hay vínculo de pareja" };
  const isRequester = ps.link.requester_id === userId;
  const patch = isRequester
    ? { requester_consent: consent }
    : { partner_consent: consent };
  const { error } = await supabaseAdmin()
    .from("partner_links")
    .update(patch)
    .eq("id", ps.link.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/juntos");
  return { ok: true };
}

/** Invita a otra usuaria de Nexo a la vista conjunta por email. */
export async function invitePartner(email: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const clean = email?.trim().toLowerCase();
  if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { ok: false, error: "Introduce un email válido" };
  }

  const { data: user } = await supabaseAdmin()
    .schema("next_auth")
    .from("users")
    .select("id")
    .eq("email", clean)
    .maybeSingle();
  if (!user) return { ok: false, error: "No existe ninguna cuenta de Nexo con ese email" };
  if (user.id === userId) return { ok: false, error: "No puedes invitarte a ti misma" };

  const { data: existing } = await supabaseAdmin()
    .from("partner_links")
    .select("id, status")
    .or(
      `and(requester_id.eq.${userId},partner_id.eq.${user.id}),and(requester_id.eq.${user.id},partner_id.eq.${userId})`,
    );
  if ((existing ?? []).some((l) => l.status !== "rejected")) {
    return { ok: false, error: "Ya tienes una invitación o vínculo con esa persona" };
  }

  const { error } = await supabaseAdmin()
    .from("partner_links")
    .upsert(
      {
        requester_id: userId,
        partner_id: user.id,
        status: "pending",
        requester_consent: true,
        partner_consent: false,
      },
      { onConflict: "requester_id,partner_id" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/juntos");
  return { ok: true };
}

/** Acepta o rechaza una invitación de vista conjunta recibida. */
export async function respondToInvite(accept: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const { data: links } = await supabaseAdmin()
    .from("partner_links")
    .select("*")
    .eq("partner_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);
  const link = links?.[0];
  if (!link) return { ok: false, error: "No tienes invitaciones pendientes" };

  if (accept) {
    const { error } = await supabaseAdmin()
      .from("partner_links")
      .update({ status: "accepted", partner_consent: true })
      .eq("id", link.id);
    if (error) return { ok: false, error: error.message };
    await supabaseAdmin().from("profiles").update({ partner_id: link.requester_id }).eq("id", userId);
    await supabaseAdmin().from("profiles").update({ partner_id: userId }).eq("id", link.requester_id);
  } else {
    await supabaseAdmin()
      .from("partner_links")
      .update({ status: "rejected", partner_consent: false })
      .eq("id", link.id);
  }
  revalidatePath("/dashboard/juntos");
  return { ok: true };
}

/** Deshace el vínculo de pareja (ambos dejan de compartir). */
export async function unlinkPartner(): Promise<ActionResult> {
  const userId = await requireUserId();
  const ps = await getPartnerState(userId);
  if (!ps.link) return { ok: false, error: "No hay vínculo que deshacer" };
  await supabaseAdmin().from("partner_links").delete().eq("id", ps.link.id);
  await supabaseAdmin()
    .from("profiles")
    .update({ partner_id: null, share_consent: false })
    .in("id", [ps.link.requester_id, ps.link.partner_id]);
  revalidatePath("/dashboard/juntos");
  return { ok: true };
}

// --- Vacaciones ------------------------------------------------------------

export async function startVacation(input: {
  name: string;
  budget: number;
  start_date?: string;
  end_date?: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio" };
  const { error } = await supabaseAdmin().from("vacation_periods").insert({
    user_id: userId,
    name,
    budget: Number(input.budget) || 0,
    start_date: input.start_date || new Date().toISOString().slice(0, 10),
    end_date: input.end_date || null,
    status: "active",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/vacaciones");
  return { ok: true };
}

/** Añade un gasto interno a un proyecto de vacaciones (no cuenta en la
 *  contabilidad general hasta que se cierra el viaje). */
const vacExpenseSchema = z.object({
  vacation_id: z.string().uuid(),
  concepto: z.string().trim().min(1, "El concepto es obligatorio").max(120),
  amount: z.coerce.number().positive("El importe debe ser mayor que 0"),
  occurred_at: z.string().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  notas: z.string().trim().max(280).optional(),
});

export async function addVacationExpense(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = vacExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  // Verifica que el viaje pertenece al usuario y está activo.
  const { data: vac } = await supabaseAdmin()
    .from("vacation_periods")
    .select("id, status")
    .eq("id", d.vacation_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!vac) return { ok: false, error: "Proyecto de vacaciones no encontrado" };
  if (vac.status !== "active") return { ok: false, error: "El viaje ya está cerrado" };

  const { error } = await supabaseAdmin().from("transactions").insert({
    user_id: userId,
    type: "expense",
    amount: d.amount,
    category: d.category ?? null,
    merchant: d.concepto,
    description: d.notas || null,
    occurred_at: d.occurred_at || new Date().toISOString().slice(0, 10),
    source: "manual",
    vacation_id: d.vacation_id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/vacaciones");
  return { ok: true };
}

export async function closeVacation(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const { data: vac } = await supabaseAdmin()
    .from("vacation_periods")
    .select("id, name, status")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!vac) return { ok: false, error: "Proyecto de vacaciones no encontrado" };
  if (vac.status !== "active") return { ok: false, error: "El viaje ya está cerrado" };

  const { data: vtx } = await supabaseAdmin()
    .from("transactions")
    .select("amount, type")
    .eq("user_id", userId)
    .eq("vacation_id", id);
  const rows = (vtx as { amount: number; type: string }[]) ?? [];
  const expenses = rows.filter((r) => r.type === "expense");
  const spent = expenses.reduce((a, r) => a + Number(r.amount), 0);
  const today = new Date().toISOString().slice(0, 10);

  // Añade el TOTAL como un único movimiento general con etiqueta "Vacaciones"
  // (vacation_id null → sí cuenta en la contabilidad general).
  if (spent > 0) {
    const { error: txErr } = await supabaseAdmin().from("transactions").insert({
      user_id: userId,
      type: "expense",
      amount: spent,
      category: "vacaciones",
      merchant: `Vacaciones · ${vac.name}`,
      description: `Total del viaje "${vac.name}" (${expenses.length} gastos)`,
      occurred_at: today,
      source: "manual",
      vacation_id: null,
    });
    if (txErr) return { ok: false, error: txErr.message };
  }

  const summary = { spent, count: expenses.length, closed_at: new Date().toISOString() };
  const { error } = await supabaseAdmin()
    .from("vacation_periods")
    .update({ status: "closed", end_date: today, summary })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
