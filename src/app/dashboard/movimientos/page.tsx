import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { requireUserId, getMovements } from "@/lib/data/queries";
import { MovementsFilters } from "@/components/dashboard/movements-filters";
import { MovementsList, type MovementRow } from "@/components/dashboard/movements-list";
import { RecurringManager, type RecItem } from "@/components/dashboard/recurring-manager";
import { AddMovementMenu } from "@/components/dashboard/add-movement-menu";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: { month?: string; type?: string; category?: string };
}) {
  const userId = await requireUserId();
  const data = await getMovements(userId, {
    month: searchParams.month,
    type: (searchParams.type as "all" | "expense" | "income") ?? "all",
    category: searchParams.category,
  });

  const txRows: MovementRow[] = data.transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    category: t.category,
    merchant: t.merchant,
    description: t.description,
    occurred_at: t.occurred_at,
    source: t.source,
    receipt_url: t.receipt_url,
    ai_confidence: t.ai_confidence,
    cat: { key: t.cat.key, label: t.cat.label },
  }));

  // Los aportes de ahorro solo se listan en la vista "Todos" (sin filtro de tipo/categoría).
  const showSavings = (searchParams.type ?? "all") === "all" && !searchParams.category;
  const savingsRows: MovementRow[] = showSavings
    ? data.savingsMovements.map((s) => ({
        id: s.id,
        type: "savings" as const,
        amount: s.amount,
        category: null,
        merchant: `Ahorro · ${s.categoryName}`,
        description: s.note,
        occurred_at: s.date,
        source: s.source,
        receipt_url: null,
        ai_confidence: null,
        cat: { key: "ahorro", label: s.categoryName },
      }))
    : [];

  const rows: MovementRow[] = [...txRows, ...savingsRows].sort((a, b) =>
    a.occurred_at < b.occurred_at ? 1 : a.occurred_at > b.occurred_at ? -1 : 0,
  );

  const recItems: RecItem[] = data.recurring.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    category: r.category,
    description: r.description,
    day_of_month: r.day_of_month,
    active: r.active,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddMovementMenu incomeCategories={data.incomeCategories} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          {/* Resumen del mes */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: PALETTE.mintInk }}>
                <ArrowUpRight className="h-4 w-4" /> Ingresos
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-foreground">{formatEUR(data.income)}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: PALETTE.peachInk }}>
                <ArrowDownRight className="h-4 w-4" /> Gastos
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-foreground">{formatEUR(data.expense)}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:col-span-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: PALETTE.lilaInk }}>
                <PiggyBank className="h-4 w-4" /> Ahorro
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-foreground">{formatEUR(data.savings)}</p>
            </div>
          </div>

          {/* Filtros + lista */}
          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <MovementsFilters monthOptions={data.monthOptions} />
            <div className="mt-5">
              <MovementsList rows={rows} />
            </div>
          </section>
        </div>

        {/* Gastos fijos (gestionables) */}
        <div className="flex min-w-0 flex-col gap-6">
          <RecurringManager items={recItems} />
        </div>
      </div>
    </div>
  );
}
