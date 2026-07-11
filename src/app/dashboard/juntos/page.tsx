import { requireUserId, getGrupos } from "@/lib/data/queries";
import { JuntosView } from "@/components/dashboard/juntos-view";

export default async function JuntosPage() {
  const userId = await requireUserId();
  const data = await getGrupos(userId);

  return <JuntosView data={data} currentUserId={userId} />;
}
