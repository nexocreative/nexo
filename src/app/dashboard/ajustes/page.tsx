import { requireUserId, getProfile } from "@/lib/data/queries";
import { getUserPlan } from "@/lib/billing";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AjustesView } from "@/components/dashboard/ajustes-view";

export default async function AjustesPage() {
  const userId = await requireUserId();
  const [profile, plan, { data: sub }, { data: authUser }] = await Promise.all([
    getProfile(userId),
    getUserPlan(userId),
    supabaseAdmin().from("subscriptions").select("current_period_end").eq("user_id", userId).maybeSingle(),
    supabaseAdmin().schema("next_auth").from("users").select("password").eq("id", userId).maybeSingle(),
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
    />
  );
}
