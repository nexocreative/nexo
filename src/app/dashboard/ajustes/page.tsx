import { requireUserId, getProfile, getCategories } from "@/lib/data/queries";
import { getUserPlan } from "@/lib/billing";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AjustesView } from "@/components/dashboard/ajustes-view";

export default async function AjustesPage() {
  const userId = await requireUserId();
  const [profile, plan, { data: sub }, { data: authUser }, categories] = await Promise.all([
    getProfile(userId),
    getUserPlan(userId),
    supabaseAdmin().from("subscriptions").select("current_period_end").eq("user_id", userId).maybeSingle(),
    supabaseAdmin().schema("next_auth").from("users").select("password").eq("id", userId).maybeSingle(),
    getCategories(userId),
  ]);

  return (
    <AjustesView
      notificationPrefs={{
        grupo_invite: true,
        grupo_gasto: true,
        ...profile?.notification_prefs,
      }}
      plan={plan}
      currentPeriodEnd={sub?.current_period_end ?? null}
      hasPassword={!!authUser?.password}
      customCategories={categories.filter((c) => c.custom)}
    />
  );
}
