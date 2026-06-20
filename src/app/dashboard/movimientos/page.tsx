import Link from "next/link";
import { Plus, Repeat, ArrowDownRight, ArrowUpRight, Banknote } from "lucide-react";
import { requireUserId, getMovements } from "@/lib/data/queries";
import { MovementsFilters } from "@/components/dashboard/movements-filters";
import { MovementsList, type MovementRow } from "@/components/dashboard/movements-list";
import { CategoryIcon } from "@/components/dashboard/category-icon";
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

  const rows: MovementRow[] = data.transactions.map((t) => ({
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

  const fixedMonthly = data.recurring
    .filter((r) => r.type === "expense" && r.active)
    .reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/dashboard/anadir"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Añadir gasto
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Resumen del mes */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Filtros + lista */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <MovementsFilters monthOptions={data.monthOptions} />
          <div className="mt-5">
            <MovementsList rows={rows} />
          </div>
        </section>
      </div>

      {/* Gastos fijos */}
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
              <Repeat className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Gastos fijos</h3>
              <p className="text-xs text-muted-foreground">Recurrentes cada mes</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-muted/60 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total mensual fijo
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-foreground">{formatEUR(fixedMonthly)}</p>
          </div>

          <ul className="mt-4 space-y-3">
            {data.recurring
              .filter((r) => r.type === "expense")
              .map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <CategoryIcon category={r.cat.key} className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">Día {r.day_of_month} de cada mes</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatEUR(Number(r.amount))}</span>
                </li>
              ))}
          </ul>

          {data.recurring.filter((r) => r.type === "income").length > 0 && (
            <>
              <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ingresos fijos
              </h4>
              <ul className="mt-3 space-y-3">
                {data.recurring
                  .filter((r) => r.type === "income")
                  .map((r) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}>
                        <Banknote className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{r.description}</p>
                        <p className="text-xs text-muted-foreground">Día {r.day_of_month} · confirmación mensual</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: PALETTE.mintInk }}>{formatEUR(Number(r.amount))}</span>
                    </li>
                  ))}
              </ul>
            </>
          )}

          <Link
            href="/dashboard/anadir"
            className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Añadir movimiento
          </Link>
        </section>
      </div>
      </div>
    </div>
  );
}
