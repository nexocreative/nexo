import { requireUserId, getProfile } from "@/lib/data/queries";
import { getUserPlan } from "@/lib/billing";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AjustesView } from "@/components/dashboard/ajustes-view";

export default async function AjustesPage() {
  const userId = await requireUserId();
  const [profile, plan, { data: sub }] = await Promise.all([
    getProfile(userId),
    getUserPlan(userId),
    supabaseAdmin().from("subscriptions").select("current_period_end").eq("user_id", userId).maybeSingle(),
  ]);

  return (
    <AjustesView
      notificationPrefs={
        profile?.notification_prefs ?? { grupo_invite: true, grupo_gasto: true }
      }
      plan={plan}
      currentPeriodEnd={sub?.current_period_end ?? null}
    />
  );
}
