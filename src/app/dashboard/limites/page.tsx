import { requireUserId, getLimits } from "@/lib/data/queries";
import { LimitsManager } from "@/components/dashboard/limits-manager";

export default async function LimitesPage() {
  const userId = await requireUserId();
  const data = await getLimits(userId);

  return (
    <LimitsManager
      global={data.global}
      categories={data.categories.map((r) => ({
        cat: { key: r.cat.key, label: r.cat.label },
        limit: r.limit,
        spent: r.spent,
        pct: r.pct,
        state: r.state,
      }))}
      unconfigured={data.unconfigured.map((c) => ({
        key: c.key,
        label: c.label,
      }))}
    />
  );
}
