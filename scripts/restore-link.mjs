import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: users } = await admin.schema("next_auth").from("users").select("id, email");
const A = users.find((u) => u.email === "ncaychocuya@gmail.com");
const B = users.find((u) => u.email === "prueba@nexo.test");

await admin.from("partner_links").delete().or(`requester_id.in.(${A.id},${B.id}),partner_id.in.(${A.id},${B.id})`);
await admin.from("partner_links").insert({
  requester_id: A.id, partner_id: B.id, status: "accepted",
  requester_consent: true, partner_consent: true,
});
await admin.from("profiles").update({ partner_id: B.id }).eq("id", A.id);
await admin.from("profiles").update({ partner_id: A.id }).eq("id", B.id);
console.log("✅ Vínculo Nati ↔ Prueba Nexo restaurado (aceptado).");
