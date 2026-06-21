import { requireUserId, getSavings } from "@/lib/data/queries";
import { SavingsManager } from "@/components/dashboard/savings-manager";

export default async function AhorroPage() {
  const userId = await requireUserId();
  const data = await getSavings(userId);

  return <SavingsManager data={data} />;
}
