import { TrendingDown, TrendingUp, Target } from "lucide-react";
import { requireUserId, getCharts } from "@/lib/data/queries";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { CategoryDonut } from "@/components/charts/category-donut";
import { TrendLine } from "@/components/charts/trend-line";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

export default async function GraficasPage() {
  const userId = await requireUserId();
  const c = await getCharts(userId);

  const donutTotal = c.donut.reduce((a, d) => a + d.value, 0);
  const overBudget = c.projection.budget !== null && c.projection.projected > c.projection.budget;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Barras ingresos vs gastos */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Ingresos vs Gastos</h3>
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETTE.lila }} /> Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETTE.mint }} /> Gastos
              </span>
            </div>
          </div>
          <div className="mt-4">
            <IncomeExpenseBars data={c.bars} />
          </div>
        </section>

        {/* Proyección fin de mes */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
              <Target className="h-[18px] w-[18px]" />
            </span>
            <h3 className="text-base font-bold text-foreground">Proyección fin de mes</h3>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gasto estimado a fin de mes
          </p>
          <p
            className="mt-1 text-3xl font-extrabold"
            style={{ color: overBudget ? PALETTE.peachInk : "inherit" }}
          >
            {formatEUR(c.projection.projected)}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Llevas gastado</span>
              <span className="font-semibold text-foreground">{formatEUR(c.projection.current)}</span>
            </div>
            {c.projection.budget !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Presupuesto</span>
                <span className="font-semibold text-foreground">{formatEUR(c.projection.budget)}</span>
              </div>
            )}
          </div>
          {c.projection.budget !== null && (
            <div
              className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold"
              style={{
                backgroundColor: overBudget ? PALETTE.peachSoft : PALETTE.mintSoft,
                color: overBudget ? PALETTE.peachInk : PALETTE.mintInk,
              }}
            >
              {overBudget ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {overBudget
                ? `Te pasarías ${formatEUR(c.projection.projected - c.projection.budget)} del presupuesto`
                : "Vas dentro del presupuesto"}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donut por categorías */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Gasto por categoría</h3>
          <p className="text-xs text-muted-foreground">Este mes</p>
          <CategoryDonut data={c.donut} />
          <ul className="mt-2 space-y-2">
            {c.donut
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground">{formatEUR(d.value)}</span>
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0}%
                  </span>
                </li>
              ))}
          </ul>
        </section>

        {/* Tendencia 12 meses */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-foreground">Tendencia 12 meses</h3>
          <p className="text-xs text-muted-foreground">Balance neto (ingresos − gastos)</p>
          <div className="mt-4">
            <TrendLine data={c.trend} />
          </div>
        </section>
      </div>
    </div>
  );
}
