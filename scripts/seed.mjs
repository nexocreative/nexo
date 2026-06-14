import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- Cargar entorno --------------------------------------------------------
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// --- Usuarios --------------------------------------------------------------
const { data: users } = await admin.schema("next_auth").from("users").select("id, name, email");
const A = users.find((u) => u.email === "ncaychocuya@gmail.com"); // Nati (usuaria actual)
const B = users.find((u) => u.email === "prueba@nexo.test"); // Prueba Nexo (pareja)
if (!A || !B) {
  console.error("No encuentro los dos usuarios esperados.", users);
  process.exit(1);
}
console.log(`Usuario A: ${A.name} · Usuario B: ${B.name}`);

// --- Limpieza idempotente (datos public de A y B) --------------------------
const ids = [A.id, B.id];
await admin.from("transactions").delete().in("user_id", ids);
await admin.from("recurring_rules").delete().in("user_id", ids);
await admin.from("category_budgets").delete().in("user_id", ids);
await admin.from("savings_goals").delete().in("owner_id", ids);
await admin.from("vacation_periods").delete().in("user_id", ids);
await admin.from("partner_links").delete().or(`requester_id.in.(${ids.join(",")}),partner_id.in.(${ids.join(",")})`);
console.log("Limpieza previa hecha.");

// --- Helpers de fecha ------------------------------------------------------
const today = new Date();
const Y = today.getFullYear();
const M = today.getMonth();
function dateOf(monthOffset, day) {
  const d = new Date(Y, M - monthOffset, Math.min(day, 28));
  // Componentes locales para no desplazar el día al mes anterior (UTC).
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthKeyOf(monthOffset) {
  const d = new Date(Y, M - monthOffset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// --- Perfiles --------------------------------------------------------------
await admin.from("profiles").upsert([
  { id: A.id, display_name: A.name, currency: "EUR", monthly_budget: 2500, partner_id: B.id, share_consent: true },
  { id: B.id, display_name: B.name, currency: "EUR", monthly_budget: 2200, partner_id: A.id, share_consent: true },
]);

// --- Reglas recurrentes de A (gastos fijos + nómina) -----------------------
const rulesA = [
  { user_id: A.id, type: "income", amount: 2200, category: null, description: "Nómina", day_of_month: 1, active: true, last_generated_month: monthKeyOf(1) },
  { user_id: A.id, type: "expense", amount: 850, category: "hogar", description: "Alquiler piso", day_of_month: 1, active: true },
  { user_id: A.id, type: "expense", amount: 10.99, category: "suscripciones", description: "Spotify", day_of_month: 5, active: true },
  { user_id: A.id, type: "expense", amount: 20, category: "suscripciones", description: "Claude Pro", day_of_month: 8, active: true },
  { user_id: A.id, type: "expense", amount: 39.99, category: "salud", description: "Gimnasio", day_of_month: 3, active: true },
  { user_id: A.id, type: "expense", amount: 45, category: "hogar", description: "Internet + Móvil", day_of_month: 12, active: true },
];
const { data: insertedRules } = await admin.from("recurring_rules").insert(rulesA).select("id, type, description, amount, category, day_of_month");
const nomina = insertedRules.find((r) => r.type === "income");
const recurringExpenses = insertedRules.filter((r) => r.type === "expense");
console.log(`Reglas recurrentes A: ${insertedRules.length}`);

// --- Presupuestos por categoría de A ---------------------------------------
await admin.from("category_budgets").insert([
  { user_id: A.id, category: "supermercado", monthly_limit: 400 },
  { user_id: A.id, category: "restaurantes", monthly_limit: 200 },
  { user_id: A.id, category: "transporte", monthly_limit: 120 },
  { user_id: A.id, category: "ocio", monthly_limit: 150 },
  { user_id: A.id, category: "suscripciones", monthly_limit: 90 },
  { user_id: A.id, category: "salud", monthly_limit: 90 },
  { user_id: A.id, category: "hogar", monthly_limit: 1000 },
  { user_id: A.id, category: "ropa", monthly_limit: 120 },
]);

// --- Generador de transacciones --------------------------------------------
const tx = [];
function expense(monthOffset, day, merchant, category, amount, source = "manual", extra = {}) {
  tx.push({ user_id: A.id, type: "expense", amount, category, merchant, occurred_at: dateOf(monthOffset, day), source, ...extra });
}
function income(userId, monthOffset, day, merchant, amount, source = "manual", extra = {}) {
  tx.push({ user_id: userId, type: "income", amount, category: null, merchant, description: merchant, occurred_at: dateOf(monthOffset, day), source, ...extra });
}

// Cesta variada por mes (últimos 5 meses cerrados + mes actual)
const basket = [
  ["Mercadona", "supermercado", 64.4], ["Carrefour", "supermercado", 41.2], ["Lidl", "supermercado", 33.8],
  ["La Tagliatella", "restaurantes", 38.5], ["Burger King", "restaurantes", 16.9],
  ["Metro", "transporte", 21.5], ["Cabify", "transporte", 13.2], ["Repsol", "transporte", 50.0],
  ["Cines Yelmo", "ocio", 24.0], ["Steam", "ocio", 19.99],
  ["Farmacia", "salud", 12.4], ["Zara", "ropa", 39.95], ["Amazon", "otros", 27.3],
];

for (let m = 5; m >= 1; m--) {
  // Nómina (meses cerrados) ligada a la regla
  income(A.id, m, 1, "Nómina", 2200, "recurring", { recurring_rule_id: nomina.id, description: "Nómina mensual" });
  // Gastos fijos como transacciones recurrentes
  for (const r of recurringExpenses) {
    expense(m, r.day_of_month, r.description, r.category, Number(r.amount), "recurring", { recurring_rule_id: r.id, description: r.description });
  }
  // Cesta variable (subconjunto desplazado por mes)
  basket.forEach(([merchant, cat, amount], i) => {
    if ((i + m) % 2 === 0) expense(m, ((i * 3 + 4) % 26) + 1, merchant, cat, Number((amount * (0.85 + ((i % 4) * 0.1))).toFixed(2)));
  });
}

// --- Mes actual: estados de límites controlados ----------------------------
// (Nómina del mes actual NO se inserta → aparece la card de confirmación.)
income(A.id, 0, 2, "Freelance diseño", 480, "chat", { description: "Ingreso extra freelance" });
// Gastos fijos del mes actual
for (const r of recurringExpenses) {
  expense(0, r.day_of_month, r.description, r.category, Number(r.amount), "recurring", { recurring_rule_id: r.id, description: r.description });
}
// Ocio al 93% del límite (150) → card de alerta rosa
expense(0, 4, "Cines Yelmo", "ocio", 28, "manual");
expense(0, 9, "Spotify Concierto", "ocio", 65, "manual");
expense(0, 14, "Steam", "ocio", 47, "manual"); // total ocio ~140/150
// Supermercado ~78%
expense(0, 3, "Mercadona", "supermercado", 72.4, "photo", { ai_confidence: 0.96 });
expense(0, 11, "Carrefour", "supermercado", 95.1, "photo", { ai_confidence: 0.91 });
expense(0, 18, "Lidl", "supermercado", 145.0, "manual");
// Restaurantes ~60%
expense(0, 6, "La Tagliatella", "restaurantes", 52.0, "voice");
expense(0, 16, "Sushi Bar", "restaurantes", 68.5, "manual");
// Transporte, salud, ropa, otros
expense(0, 5, "Repsol", "transporte", 55.0, "manual");
expense(0, 8, "Metro", "transporte", 21.5, "manual");
expense(0, 7, "Farmacia", "salud", 18.9, "manual");
expense(0, 20, "Zara", "ropa", 49.95, "manual");

// Algunas transacciones de B para la vista consolidada (Juntos)
for (let m = 5; m >= 0; m--) {
  income(B.id, m, 1, "Nómina", 1900, "recurring");
  tx.push({ user_id: B.id, type: "expense", amount: 700, category: "hogar", merchant: "Alquiler (parte)", occurred_at: dateOf(m, 1), source: "recurring" });
  tx.push({ user_id: B.id, type: "expense", amount: Number((180 + m * 12).toFixed(2)), category: "supermercado", merchant: "Compra mensual", occurred_at: dateOf(m, 10), source: "manual" });
  tx.push({ user_id: B.id, type: "expense", amount: 90, category: "ocio", merchant: "Ocio", occurred_at: dateOf(m, 15), source: "manual" });
}

// --- Vacaciones ------------------------------------------------------------
const { data: vacs } = await admin.from("vacation_periods").insert([
  { user_id: A.id, name: "Verano en la costa", budget: 1200, start_date: dateOf(0, 1), status: "active" },
  { user_id: A.id, name: "Escapada a Lisboa", budget: 600, start_date: dateOf(3, 2), end_date: dateOf(3, 6), status: "closed", summary: { spent: 540, count: 6, closed_at: dateOf(3, 6) } },
]).select("id, name, status");
const vacActive = vacs.find((v) => v.status === "active");
const vacClosed = vacs.find((v) => v.status === "closed");

// Gastos del viaje activo
expense(0, 2, "Hotel Marina", "hogar", 320, "manual", { vacation_id: vacActive.id, description: "Hotel 2 noches" });
expense(0, 3, "Chiringuito El Faro", "restaurantes", 84.5, "voice", { vacation_id: vacActive.id });
expense(0, 4, "Alquiler sombrilla", "ocio", 25, "manual", { vacation_id: vacActive.id });
// Gastos del viaje cerrado
expense(3, 2, "Vuelo TAP", "transporte", 180, "manual", { vacation_id: vacClosed.id });
expense(3, 3, "Hostel Alfama", "hogar", 210, "manual", { vacation_id: vacClosed.id });
expense(3, 4, "Pastéis de Belém", "restaurantes", 35, "manual", { vacation_id: vacClosed.id });
expense(3, 5, "Tranvía 28", "transporte", 15, "manual", { vacation_id: vacClosed.id });

// --- Insertar transacciones ------------------------------------------------
const { error: txErr, count } = await admin.from("transactions").insert(tx, { count: "exact" });
if (txErr) { console.error("Error insertando transacciones:", txErr); process.exit(1); }
console.log(`Transacciones insertadas: ${tx.length}`);

// --- Objetivo de ahorro conjunto -------------------------------------------
await admin.from("savings_goals").insert({
  owner_id: A.id, partner_id: B.id, name: "Viaje a Japón 2026",
  target_amount: 8000, current_amount: 3200, target_date: `${Y + 1}-06-30`,
});

// --- Vínculo de pareja (vista conjunta activa) -----------------------------
await admin.from("partner_links").insert({
  requester_id: A.id, partner_id: B.id, status: "accepted",
  requester_consent: true, partner_consent: true,
});

console.log("✅ Seed completado.");
