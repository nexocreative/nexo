import "server-only";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getServerAuthSession } from "@/lib/auth";
import type {
  Transaction,
  RecurringRule,
  CategoryBudget,
  SavingsGoal,
  SavingsCategory,
  SavingsEntry,
  VacationPeriod,
  Profile,
  PartnerLink,
} from "@/types/database";
import {
  CATEGORIES,
  getCategory,
  budgetState,
  chartColor,
  type CategoryDef,
  type BudgetState,
} from "@/lib/constants";
import { monthShort, monthKey } from "@/lib/format";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function requireUserId(): Promise<string> {
  const session = await getServerAuthSession();
  const id = session?.user?.id;
  if (!id) throw new Error("No autenticado");
  return id;
}

function isoDate(d: Date): string {
  // Componentes locales (no UTC) para no desplazar el límite de mes.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sum(rows: { amount: number }[]): number {
  return rows.reduce((acc, r) => acc + Number(r.amount), 0);
}

export type TxView = Transaction & { cat: CategoryDef };

function withCategory(t: Transaction): TxView {
  return { ...t, cat: getCategory(t.category) };
}

// ---------------------------------------------------------------------------
// Perfil + pareja
// ---------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export interface PartnerState {
  link: PartnerLink | null;
  partner: { id: string; name: string | null } | null;
  /** Vista conjunta activa: ambos han dado consentimiento. */
  sharingActive: boolean;
}

export async function getPartnerState(userId: string): Promise<PartnerState> {
  const { data: rawLinks } = await supabaseAdmin()
    .from("partner_links")
    .select("*")
    .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  const links = (rawLinks as PartnerLink[]) ?? [];
  // Prioriza un vínculo aceptado; si no, una invitación pendiente.
  const link =
    links.find((l) => l.status === "accepted") ??
    links.find((l) => l.status === "pending") ??
    null;
  if (!link) return { link: null, partner: null, sharingActive: false };

  const partnerId = link.requester_id === userId ? link.partner_id : link.requester_id;
  const { data: partnerUser } = await supabaseAdmin()
    .schema("next_auth")
    .from("users")
    .select("id, name")
    .eq("id", partnerId)
    .maybeSingle();

  const sharingActive =
    link.status === "accepted" && link.requester_consent && link.partner_consent;

  return {
    link,
    partner: partnerUser ? { id: partnerUser.id, name: partnerUser.name } : null,
    sharingActive,
  };
}

// ---------------------------------------------------------------------------
// Gastos fijos: materialización automática
// ---------------------------------------------------------------------------

/**
 * Garantiza que cada GASTO fijo activo tenga su transacción del mes en curso
 * (se contabiliza automáticamente). Idempotente: solo crea las que falten.
 * Los INGRESOS fijos (nómina) NO se materializan: requieren confirmación manual.
 */
export async function materializeRecurring(userId: string): Promise<void> {
  const now = new Date();
  const mk = monthKey(now);

  const { data: rawRules } = await supabaseAdmin()
    .from("recurring_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("active", true);
  const rules = (rawRules as RecurringRule[]) ?? [];
  const due = rules.filter((r) => r.last_generated_month !== mk);
  if (due.length === 0) return;

  const start = isoDate(startOfMonth(now));
  const end = isoDate(endOfMonth(now));
  const dueIds = due.map((r) => r.id);
  const { data: existing } = await supabaseAdmin()
    .from("transactions")
    .select("recurring_rule_id")
    .eq("user_id", userId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .in("recurring_rule_id", dueIds);
  const already = new Set((existing ?? []).map((e) => e.recurring_rule_id));

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const toInsert = due
    .filter((r) => !already.has(r.id))
    .map((r) => ({
      user_id: userId,
      type: "expense" as const,
      amount: r.amount,
      category: r.category ?? "otros",
      description: r.description,
      merchant: r.description,
      occurred_at: `${y}-${m}-${String(Math.min(r.day_of_month, 28)).padStart(2, "0")}`,
      source: "recurring" as const,
      recurring_rule_id: r.id,
    }));
  if (toInsert.length > 0) {
    await supabaseAdmin().from("transactions").insert(toInsert);
  }
  await supabaseAdmin()
    .from("recurring_rules")
    .update({ last_generated_month: mk })
    .in("id", dueIds);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardData {
  monthIncome: number;
  monthExpense: number;
  monthBalance: number;
  savingsRate: number; // 0..100
  monthlyBudget: number | null;
  budgetSpentPct: number; // 0..100
  budgetState: BudgetState;
  topAlert: { cat: CategoryDef; spent: number; limit: number; pct: number } | null;
  recent: TxView[];
  nomina: { needsConfirmation: boolean; expected: number } | null;
  bars: { month: string; income: number; expense: number }[];
  savings: { thisMonth: number; monthlyPlan: number; total: number };
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const now = new Date();
  const start = isoDate(startOfMonth(now));
  const end = isoDate(endOfMonth(now));
  const barsFrom = isoDate(startOfMonth(subMonths(now, 5)));

  const [{ data: monthTx }, { data: recentTx }, profile, { data: budgets }, { data: rules }, { data: barsTx }, { data: savingsEntries }, { data: savingsCats }] =
    await Promise.all([
      supabaseAdmin()
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .is("vacation_id", null)
        .gte("occurred_at", start)
        .lte("occurred_at", end),
      supabaseAdmin()
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .is("vacation_id", null)
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      getProfile(userId),
      supabaseAdmin().from("category_budgets").select("*").eq("user_id", userId),
      supabaseAdmin()
        .from("recurring_rules")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "income")
        .eq("active", true),
      supabaseAdmin()
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .is("vacation_id", null)
        .gte("occurred_at", barsFrom),
      supabaseAdmin().from("savings_entries").select("*").eq("user_id", userId),
      supabaseAdmin().from("savings_categories").select("monthly_plan").eq("user_id", userId),
    ]);

  // Ahorro: total del mes en curso, plan mensual y acumulado histórico.
  const mk = monthKey(now);
  const sEntries = (savingsEntries as SavingsEntry[]) ?? [];
  const monthSavings = sum(sEntries.filter((e) => e.month === mk));
  const savings = {
    thisMonth: monthSavings,
    monthlyPlan: ((savingsCats as { monthly_plan: number }[]) ?? []).reduce(
      (a, c) => a + Number(c.monthly_plan),
      0,
    ),
    total: sum(sEntries),
  };

  // Barras ingresos vs gastos de los últimos 6 meses.
  const barsAll = (barsTx as Transaction[]) ?? [];
  const bars = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(startOfMonth(now), 5 - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inM = barsAll.filter((t) => t.occurred_at.slice(0, 7) === key);
    return {
      month: monthShort(d),
      income: sum(inM.filter((t) => t.type === "income")),
      expense: sum(inM.filter((t) => t.type === "expense")),
    };
  });

  const tx = (monthTx as Transaction[]) ?? [];
  const expenses = tx.filter((t) => t.type === "expense");
  const incomes = tx.filter((t) => t.type === "income");
  const monthIncome = sum(incomes);
  const monthExpense = sum(expenses);
  // El ahorro del mes se aparta: balance = ingresos - gastos - ahorro.
  const monthBalance = monthIncome - monthExpense - monthSavings;
  const savingsRate =
    monthIncome > 0 ? Math.max(0, Math.round((monthSavings / monthIncome) * 100)) : 0;

  const monthlyBudget = profile?.monthly_budget ? Number(profile.monthly_budget) : null;
  const budgetSpentPct = monthlyBudget ? Math.round((monthExpense / monthlyBudget) * 100) : 0;

  // Alerta por categoría: la categoría con mayor % sobre su límite.
  const cbs = (budgets as CategoryBudget[]) ?? [];
  let topAlert: DashboardData["topAlert"] = null;
  for (const cb of cbs) {
    const spent = sum(expenses.filter((e) => e.category === cb.category));
    const limit = Number(cb.monthly_limit);
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    if (pct >= 75 && (!topAlert || pct > topAlert.pct)) {
      topAlert = { cat: getCategory(cb.category), spent, limit, pct };
    }
  }

  // Nómina: ¿hay regla de ingreso recurrente sin generar este mes?
  const nominaRule = (rules as RecurringRule[])?.[0] ?? null;
  let nomina: DashboardData["nomina"] = null;
  if (nominaRule) {
    const already = incomes.some((i) => i.recurring_rule_id === nominaRule.id);
    nomina = { needsConfirmation: !already, expected: Number(nominaRule.amount) };
  }

  return {
    monthIncome,
    monthExpense,
    monthBalance,
    savingsRate,
    monthlyBudget,
    budgetSpentPct,
    budgetState: monthlyBudget ? budgetState(monthExpense, monthlyBudget) : "ok",
    topAlert,
    recent: ((recentTx as Transaction[]) ?? []).map(withCategory),
    nomina,
    bars,
    savings,
  };
}

// ---------------------------------------------------------------------------
// Movimientos (Gastos & Ingresos + Gastos fijos)
// ---------------------------------------------------------------------------

export interface SavingsMovement {
  id: string;
  amount: number;
  categoryName: string;
  note: string | null;
  source: string; // 'plan' | 'manual'
  date: string; // ISO date (created_at)
}

export interface MovementsData {
  month: string; // "YYYY-MM"
  monthOptions: { value: string; label: string }[];
  income: number;
  expense: number;
  savings: number;
  transactions: TxView[];
  savingsMovements: SavingsMovement[];
  recurring: (RecurringRule & { cat: CategoryDef })[];
}

export async function getMovements(
  userId: string,
  opts?: { month?: string; type?: "all" | "expense" | "income"; category?: string },
): Promise<MovementsData> {
  const now = new Date();
  const monthDate = opts?.month
    ? new Date(`${opts.month}-01T00:00:00`)
    : startOfMonth(now);
  const start = isoDate(startOfMonth(monthDate));
  const end = isoDate(endOfMonth(monthDate));

  let query = supabaseAdmin()
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .is("vacation_id", null)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.type && opts.type !== "all") query = query.eq("type", opts.type);
  if (opts?.category) query = query.eq("category", opts.category);

  const mk = monthKey(monthDate);
  const [{ data: tx }, { data: rules }, { data: sEntries }, { data: sCats }] = await Promise.all([
    query,
    supabaseAdmin()
      .from("recurring_rules")
      .select("*")
      .eq("user_id", userId)
      .order("amount", { ascending: false }),
    supabaseAdmin()
      .from("savings_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("month", mk)
      .order("created_at", { ascending: false }),
    supabaseAdmin().from("savings_categories").select("id, name").eq("user_id", userId),
  ]);

  const transactions = ((tx as Transaction[]) ?? []).map(withCategory);
  const income = sum(transactions.filter((t) => t.type === "income"));
  const expense = sum(transactions.filter((t) => t.type === "expense"));

  // Aportes de ahorro del mes (se muestran junto al resto de movimientos).
  const catName = new Map(((sCats as { id: string; name: string }[]) ?? []).map((c) => [c.id, c.name]));
  const savingsEntries = (sEntries as SavingsEntry[]) ?? [];
  const savings = sum(savingsEntries);
  const savingsMovements: SavingsMovement[] = savingsEntries.map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    categoryName: (e.category_id && catName.get(e.category_id)) || "Ahorro",
    note: e.note,
    source: e.source,
    date: (e.created_at ?? `${e.month}-01`).slice(0, 10),
  }));

  // Firma las rutas de los tickets guardados en Storage (bucket privado) para
  // poder mostrarlos en el detalle del movimiento.
  const receiptPaths = transactions
    .map((t) => t.receipt_url)
    .filter((u): u is string => !!u && !u.startsWith("http"));
  if (receiptPaths.length > 0) {
    const { data: signed } = await supabaseAdmin()
      .storage.from("receipts")
      .createSignedUrls(receiptPaths, 3600);
    const map = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    for (const t of transactions) {
      if (t.receipt_url && map.has(t.receipt_url)) t.receipt_url = map.get(t.receipt_url) ?? null;
    }
  }

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(startOfMonth(now), i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: `${monthShort(d)} ${d.getFullYear()}` };
  });

  return {
    month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
    monthOptions,
    income,
    expense,
    savings,
    transactions,
    savingsMovements,
    recurring: ((rules as RecurringRule[]) ?? []).map((r) => ({
      ...r,
      cat: getCategory(r.category),
    })),
  };
}

// ---------------------------------------------------------------------------
// Límites y alertas
// ---------------------------------------------------------------------------

export interface LimitRow {
  cat: CategoryDef;
  limit: number;
  spent: number;
  pct: number;
  state: BudgetState;
}
export interface LimitsData {
  global: { limit: number | null; spent: number; pct: number; state: BudgetState };
  categories: LimitRow[];
  unconfigured: CategoryDef[];
}

export async function getLimits(userId: string): Promise<LimitsData> {
  const now = new Date();
  const start = isoDate(startOfMonth(now));
  const end = isoDate(endOfMonth(now));

  const [{ data: tx }, profile, { data: budgets }] = await Promise.all([
    supabaseAdmin()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "expense")
      .is("vacation_id", null)
      .gte("occurred_at", start)
      .lte("occurred_at", end),
    getProfile(userId),
    supabaseAdmin().from("category_budgets").select("*").eq("user_id", userId),
  ]);

  const expenses = (tx as Transaction[]) ?? [];
  const totalSpent = sum(expenses);
  const globalLimit = profile?.monthly_budget ? Number(profile.monthly_budget) : null;

  const cbs = (budgets as CategoryBudget[]) ?? [];
  const configured = new Set(cbs.map((c) => c.category));
  const categories: LimitRow[] = cbs
    .map((cb) => {
      const spent = sum(expenses.filter((e) => e.category === cb.category));
      const limit = Number(cb.monthly_limit);
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { cat: getCategory(cb.category), limit, spent, pct, state: budgetState(spent, limit) };
    })
    .sort((a, b) => b.pct - a.pct);

  return {
    global: {
      limit: globalLimit,
      spent: totalSpent,
      pct: globalLimit ? Math.round((totalSpent / globalLimit) * 100) : 0,
      state: globalLimit ? budgetState(totalSpent, globalLimit) : "ok",
    },
    categories,
    unconfigured: CATEGORIES.filter((c) => !configured.has(c.key)),
  };
}

// ---------------------------------------------------------------------------
// Gráficas
// ---------------------------------------------------------------------------

export interface ChartsData {
  bars: { month: string; income: number; expense: number }[];
  donut: { name: string; value: number; color: string }[];
  trend: { month: string; net: number }[];
  projection: { current: number; projected: number; budget: number | null };
}

export async function getCharts(userId: string): Promise<ChartsData> {
  const now = new Date();
  const from = isoDate(startOfMonth(subMonths(now, 11)));

  const [{ data: tx }, profile] = await Promise.all([
    supabaseAdmin()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .is("vacation_id", null)
      .gte("occurred_at", from),
    getProfile(userId),
  ]);
  const all = (tx as Transaction[]) ?? [];

  const monthBuckets: { date: Date; key: string }[] = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(now), 11 - i);
    return { date: d, key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
  });

  const keyOf = (iso: string) => iso.slice(0, 7);

  const bars = monthBuckets.slice(6).map(({ date, key }) => {
    const inM = all.filter((t) => keyOf(t.occurred_at) === key);
    return {
      month: monthShort(date),
      income: sum(inM.filter((t) => t.type === "income")),
      expense: sum(inM.filter((t) => t.type === "expense")),
    };
  });

  const trend = monthBuckets.map(({ date, key }) => {
    const inM = all.filter((t) => keyOf(t.occurred_at) === key);
    return {
      month: monthShort(date),
      net: sum(inM.filter((t) => t.type === "income")) - sum(inM.filter((t) => t.type === "expense")),
    };
  });

  // Donut: gasto del mes actual por categoría
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const curExpenses = all.filter((t) => keyOf(t.occurred_at) === curKey && t.type === "expense");
  const donut = CATEGORIES.map((c, i) => ({
    name: c.label,
    value: sum(curExpenses.filter((e) => e.category === c.key)),
    color: chartColor(i),
  })).filter((d) => d.value > 0);

  // Proyección fin de mes (run-rate sobre días transcurridos)
  const curExpenseTotal = sum(curExpenses);
  const dayOfMonth = now.getDate();
  const daysInMonth = endOfMonth(now).getDate();
  const projected = dayOfMonth > 0 ? Math.round((curExpenseTotal / dayOfMonth) * daysInMonth) : 0;

  return {
    bars,
    donut,
    trend,
    projection: {
      current: curExpenseTotal,
      projected,
      budget: profile?.monthly_budget ? Number(profile.monthly_budget) : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Ahorro mensual por categorías
// ---------------------------------------------------------------------------

const DEFAULT_SAVINGS_CATEGORIES = ["Emergencia", "Vacaciones", "General"];

/** Crea las categorías de ahorro por defecto si el usuario aún no tiene ninguna. */
export async function ensureSavingsCategories(userId: string): Promise<void> {
  const { count } = await supabaseAdmin()
    .from("savings_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0) return;
  await supabaseAdmin()
    .from("savings_categories")
    .insert(
      DEFAULT_SAVINGS_CATEGORIES.map((name, i) => ({
        user_id: userId,
        name,
        monthly_plan: 0,
        sort_order: i,
      })),
    );
}

/**
 * Contabiliza el plan mensual de ahorro del mes en curso: por cada categoría
 * con plan > 0 que no tenga ya su entrada 'plan' del mes, la crea. Idempotente.
 */
export async function materializeSavingsPlan(userId: string): Promise<void> {
  const mk = monthKey(new Date());
  const { data: cats } = await supabaseAdmin()
    .from("savings_categories")
    .select("*")
    .eq("user_id", userId)
    .gt("monthly_plan", 0);
  const categories = (cats as SavingsCategory[]) ?? [];
  if (categories.length === 0) return;

  const { data: existing } = await supabaseAdmin()
    .from("savings_entries")
    .select("category_id")
    .eq("user_id", userId)
    .eq("month", mk)
    .eq("source", "plan");
  const done = new Set((existing ?? []).map((e) => e.category_id));

  const toInsert = categories
    .filter((c) => !done.has(c.id))
    .map((c) => ({
      user_id: userId,
      category_id: c.id,
      amount: Number(c.monthly_plan),
      month: mk,
      source: "plan" as const,
    }));
  if (toInsert.length > 0) {
    await supabaseAdmin().from("savings_entries").insert(toInsert);
  }
}

export interface SavingsCategoryView {
  id: string;
  name: string;
  monthlyPlan: number;
  thisMonth: number; // ahorrado este mes en la categoría
  accumulated: number; // acumulado histórico
  byMonth: Record<string, number>; // "YYYY-MM" -> ahorrado ese mes
}

export interface SavingsData {
  thisMonth: number; // total ahorrado este mes
  monthlyPlan: number; // suma de planes mensuales
  yearTotal: number; // acumulado del año en curso
  total: number; // acumulado histórico total
  currentMonth: string; // "YYYY-MM" del mes en curso
  categories: SavingsCategoryView[];
  monthly: { month: string; amount: number }[]; // últimos 12 meses
  months: { value: string; label: string }[]; // selector (12 meses, recientes primero)
}

export async function getSavings(userId: string): Promise<SavingsData> {
  await ensureSavingsCategories(userId);
  await materializeSavingsPlan(userId);

  const now = new Date();
  const mk = monthKey(now);
  const year = String(now.getFullYear());

  const [{ data: cats }, { data: entriesRaw }] = await Promise.all([
    supabaseAdmin()
      .from("savings_categories")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabaseAdmin().from("savings_entries").select("*").eq("user_id", userId),
  ]);

  const categories = (cats as SavingsCategory[]) ?? [];
  const entries = (entriesRaw as SavingsEntry[]) ?? [];

  // Claves de los últimos 12 meses (antiguo -> reciente).
  const monthKeys = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(now), 11 - i);
    return { key: monthKey(d), date: d };
  });

  const byCat = (id: string) => entries.filter((e) => e.category_id === id);
  const catViews: SavingsCategoryView[] = categories.map((c) => {
    const mine = byCat(c.id);
    const byMonth: Record<string, number> = {};
    for (const { key } of monthKeys) byMonth[key] = sum(mine.filter((e) => e.month === key));
    return {
      id: c.id,
      name: c.name,
      monthlyPlan: Number(c.monthly_plan),
      thisMonth: sum(mine.filter((e) => e.month === mk)),
      accumulated: sum(mine),
      byMonth,
    };
  });

  const thisMonth = sum(entries.filter((e) => e.month === mk));
  const yearTotal = sum(entries.filter((e) => e.month.startsWith(year)));
  const total = sum(entries);
  const monthlyPlan = categories.reduce((a, c) => a + Number(c.monthly_plan), 0);

  // Serie de los últimos 12 meses (para la gráfica).
  const monthly = monthKeys.map(({ key, date }) => ({
    month: monthShort(date),
    amount: sum(entries.filter((e) => e.month === key)),
  }));

  // Opciones del selector de mes (recientes primero).
  const months = [...monthKeys].reverse().map(({ key, date }) => ({
    value: key,
    label: `${monthShort(date)} ${date.getFullYear()}`,
  }));

  return {
    thisMonth,
    monthlyPlan,
    yearTotal,
    total,
    currentMonth: mk,
    categories: catViews,
    monthly,
    months,
  };
}

/** Total ahorrado en un mes concreto ("YYYY-MM"). */
export async function getMonthSavings(userId: string, mk: string): Promise<number> {
  const { data } = await supabaseAdmin()
    .from("savings_entries")
    .select("amount")
    .eq("user_id", userId)
    .eq("month", mk);
  return sum((data as { amount: number }[]) ?? []);
}

// ---------------------------------------------------------------------------
// Juntos (vista conjunta)
// ---------------------------------------------------------------------------

export type LinkStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export interface JuntosData {
  status: LinkStatus;
  sharingActive: boolean;
  partnerName: string | null;
  myConsent: boolean;
  partnerConsent: boolean;
  goal:
    | (SavingsGoal & {
        pct: number;
        daysLeft: number;
        onTrack: boolean;
        monthlyNeeded: number;
      })
    | null;
  consolidated: { month: string; income: number; expense: number }[] | null;
}

export async function getJuntos(userId: string): Promise<JuntosData> {
  const ps = await getPartnerState(userId);
  const now = new Date();

  const { data: goals } = await supabaseAdmin()
    .from("savings_goals")
    .select("*")
    .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(1);
  const rawGoal = (goals?.[0] as SavingsGoal) ?? null;

  let goal: JuntosData["goal"] = null;
  if (rawGoal) {
    const pct = Math.min(
      100,
      Math.round((Number(rawGoal.current_amount) / Number(rawGoal.target_amount)) * 100),
    );
    const target = new Date(rawGoal.target_date);
    const daysLeft = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
    const monthsLeft = Math.max(1, daysLeft / 30);
    const remaining = Number(rawGoal.target_amount) - Number(rawGoal.current_amount);
    const monthlyNeeded = Math.max(0, Math.round(remaining / monthsLeft));
    const elapsedRatio = pct / 100;
    const timeRatio =
      1 -
      daysLeft /
        Math.max(
          1,
          Math.ceil((target.getTime() - new Date(rawGoal.created_at).getTime()) / 86400000),
        );
    goal = { ...rawGoal, pct, daysLeft, monthlyNeeded, onTrack: elapsedRatio >= timeRatio - 0.05 };
  }

  let consolidated: JuntosData["consolidated"] = null;
  if (ps.sharingActive && ps.partner) {
    const from = isoDate(startOfMonth(subMonths(now, 5)));
    const { data: tx } = await supabaseAdmin()
      .from("transactions")
      .select("*")
      .in("user_id", [userId, ps.partner.id])
      .is("vacation_id", null)
      .gte("occurred_at", from);
    const all = (tx as Transaction[]) ?? [];
    consolidated = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(startOfMonth(now), 5 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inM = all.filter((t) => t.occurred_at.slice(0, 7) === key);
      return {
        month: monthShort(d),
        income: sum(inM.filter((t) => t.type === "income")),
        expense: sum(inM.filter((t) => t.type === "expense")),
      };
    });
  }

  const myConsent = ps.link
    ? ps.link.requester_id === userId
      ? ps.link.requester_consent
      : ps.link.partner_consent
    : false;
  const partnerConsent = ps.link
    ? ps.link.requester_id === userId
      ? ps.link.partner_consent
      : ps.link.requester_consent
    : false;

  let status: LinkStatus = "none";
  if (ps.link) {
    if (ps.link.status === "accepted") status = "accepted";
    else if (ps.link.status === "pending")
      status = ps.link.requester_id === userId ? "pending_sent" : "pending_received";
  }

  return {
    status,
    sharingActive: ps.sharingActive,
    partnerName: ps.partner?.name ?? null,
    myConsent,
    partnerConsent,
    goal,
    consolidated,
  };
}

// ---------------------------------------------------------------------------
// Vacaciones
// ---------------------------------------------------------------------------

export interface VacationExpenseView {
  id: string;
  concepto: string | null;
  notas: string | null;
  category: string | null;
  amount: number;
  occurred_at: string;
}
export interface VacationView extends VacationPeriod {
  spent: number;
  pct: number;
  txCount: number;
  expenses: VacationExpenseView[];
}
export interface VacationsData {
  active: VacationView | null;
  closed: VacationView[];
}

interface VacTx {
  id: string;
  vacation_id: string;
  type: string;
  amount: number;
  merchant: string | null;
  description: string | null;
  category: string | null;
  occurred_at: string;
}

export async function getVacations(userId: string): Promise<VacationsData> {
  const { data: periods } = await supabaseAdmin()
    .from("vacation_periods")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  const list = (periods as VacationPeriod[]) ?? [];
  if (list.length === 0) return { active: null, closed: [] };

  const { data: tx } = await supabaseAdmin()
    .from("transactions")
    .select("id, vacation_id, type, amount, merchant, description, category, occurred_at")
    .eq("user_id", userId)
    .in(
      "vacation_id",
      list.map((v) => v.id),
    )
    .order("occurred_at", { ascending: false });
  const vtx = (tx as VacTx[]) ?? [];

  const enrich = (v: VacationPeriod): VacationView => {
    const rows = vtx.filter((t) => t.vacation_id === v.id && t.type === "expense");
    const spent = sum(rows);
    const budget = Number(v.budget);
    return {
      ...v,
      spent,
      pct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      txCount: rows.length,
      expenses: rows.map((r) => ({
        id: r.id,
        concepto: r.merchant,
        notas: r.description,
        category: r.category,
        amount: Number(r.amount),
        occurred_at: r.occurred_at,
      })),
    };
  };

  return {
    active: list.filter((v) => v.status === "active").map(enrich)[0] ?? null,
    closed: list.filter((v) => v.status === "closed").map(enrich),
  };
}
