import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ALL = "00000000-0000-0000-0000-000000000000"; // filtro "todo" (id != dummy)

// Vacía todas las tablas de datos (se conservan next_auth.users).
const tables = [
  "transactions",
  "recurring_rules",
  "category_budgets",
  "savings_goals",
  "vacation_periods",
  "ai_recommendations",
  "partner_links",
];
for (const t of tables) {
  const { error } = await admin.from(t).delete().neq("id", ALL);
  console.log(error ? `❌ ${t}: ${error.message}` : `🧹 ${t} vaciada`);
}

// Conserva los perfiles (= cuentas) pero limpia sus datos financieros.
const { error: pErr } = await admin
  .from("profiles")
  .update({ monthly_budget: null, partner_id: null, share_consent: false })
  .neq("id", ALL);
console.log(pErr ? `❌ profiles: ${pErr.message}` : "🧼 profiles reseteados (sin borrar)");

// Recuento final
for (const t of [...tables, "profiles"]) {
  const { count } = await admin.from(t).select("*", { count: "exact", head: true });
  console.log(`   ${t}: ${count} filas`);
}
console.log("✅ Datos borrados. Usuarios conservados.");
