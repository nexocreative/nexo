import { requireUserId, getProfile } from "@/lib/data/queries";
import { AjustesView } from "@/components/dashboard/ajustes-view";

export default async function AjustesPage() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);

  return (
    <AjustesView
      notificationPrefs={
        profile?.notification_prefs ?? { grupo_invite: true, grupo_gasto: true }
      }
    />
  );
}
