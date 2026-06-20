import { requireUserId, getVacations } from "@/lib/data/queries";
import { VacationsView } from "@/components/dashboard/vacations-view";

export default async function VacacionesPage() {
  const userId = await requireUserId();
  const v = await getVacations(userId);

  return (
    <VacationsView
      active={
        v.active
          ? {
              id: v.active.id,
              name: v.active.name,
              budget: Number(v.active.budget),
              spent: v.active.spent,
              pct: v.active.pct,
              txCount: v.active.txCount,
              start_date: v.active.start_date,
              end_date: v.active.end_date,
              expenses: v.active.expenses,
            }
          : null
      }
      closed={v.closed.map((c) => ({
        id: c.id,
        name: c.name,
        budget: Number(c.budget),
        spent: c.spent,
        txCount: c.txCount,
        start_date: c.start_date,
        end_date: c.end_date,
        expenses: c.expenses,
      }))}
    />
  );
}
