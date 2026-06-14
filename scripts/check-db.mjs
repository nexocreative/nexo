import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Carga .env.local manualmente
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const tables = [
  "profiles",
  "transactions",
  "category_budgets",
  "recurring_rules",
  "vacation_periods",
  "savings_goals",
  "ai_recommendations",
  "partner_links",
];

for (const t of tables) {
  const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`❌ ${t}: ${error.message} (code ${error.code})`);
  } else {
    console.log(`✅ ${t}: existe, ${count} filas`);
  }
}

// Usuarios en next_auth
const { data: users, error: uErr } = await admin
  .schema("next_auth")
  .from("users")
  .select("id, name, email");
if (uErr) console.log(`next_auth.users: ${uErr.message}`);
else console.log(`\n👥 Usuarios (${users.length}):`, users.map((u) => `${u.name || "?"} <${u.email}>`).join(", "));
