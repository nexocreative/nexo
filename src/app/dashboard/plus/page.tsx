import { requireUserId } from "@/lib/data/queries";
import { getUserPlan } from "@/lib/billing";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PlusView } from "@/components/dashboard/plus-view";

export default async function PlusPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const userId = await requireUserId();
  const plan = await getUserPlan(userId);
  const { data: sub } = await supabaseAdmin()
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    <PlusView
      plan={plan}
      currentPeriodEnd={sub?.current_period_end ?? null}
      justSubscribed={searchParams.checkout === "success"}
    />
  );
}
