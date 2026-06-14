import { requireUserId, getJuntos } from "@/lib/data/queries";
import { JuntosView } from "@/components/dashboard/juntos-view";

export default async function JuntosPage() {
  const userId = await requireUserId();
  const j = await getJuntos(userId);

  return (
    <JuntosView
      status={j.status}
      sharingActive={j.sharingActive}
      partnerName={j.partnerName}
      myConsent={j.myConsent}
      partnerConsent={j.partnerConsent}
      goal={
        j.goal
          ? {
              name: j.goal.name,
              target_amount: Number(j.goal.target_amount),
              current_amount: Number(j.goal.current_amount),
              target_date: j.goal.target_date,
              pct: j.goal.pct,
              daysLeft: j.goal.daysLeft,
              monthlyNeeded: j.goal.monthlyNeeded,
              onTrack: j.goal.onTrack,
            }
          : null
      }
      consolidated={j.consolidated}
    />
  );
}
