import Link from "next/link";
import { Plus, TrendingUp, AlertTriangle, ShieldCheck, Banknote, PiggyBank } from "lucide-react";
import { requireUserId, getDashboard } from "@/lib/data/queries";
import { NominaCard } from "@/components/dashboard/nomina-card";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const d = await getDashboard(userId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      {/* Balance del mes (móvil: 1) */}
      <section className="order-1 rounded-3xl border border-border/60 bg-card p-7 shadow-sm lg:order-none lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Balance del mes
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">
              {formatEUR(d.monthBalance)}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: PALETTE.mintInk }}>
              <TrendingUp className="h-4 w-4" />
              {d.savingsRate}% de ahorro este mes
            </p>
          </div>
          {/* Botón en la cabecera (solo escritorio) */}
          <Link
            href="/dashboard/anadir"
            className="hidden shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            <Plus className="h-4 w-4" /> Registrar movimiento
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <Stat label="Ingresos" value={formatEUR(d.monthIncome)} positive />
          <Stat label="Gastos" value={formatEUR(d.monthExpense)} />
        </div>

        {/* Botón debajo de Ingresos/Gastos (solo móvil) */}
        <Link
          href="/dashboard/anadir"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Registrar movimiento
        </Link>
      </section>

      {/* Nómina + Todo bajo control (móvil: 4) */}
      <div className="order-4 flex flex-col gap-6 lg:order-none lg:self-stretch">
        {d.nomina?.needsConfirmation && <NominaCard expected={d.nomina.expected} />}
        <AlertCard d={d} />
      </div>

      {/* Últimos movimientos (móvil: 2) */}
      <section className="order-2 rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:order-none lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Últimos movimientos</h3>
          <Link href="/dashboard/movimientos" className="text-sm font-semibold text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Aún no hay movimientos. Añade tu primer gasto.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {d.recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={
                    t.type === "income"
                      ? { backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }
                      : t.type === "savings"
                        ? { backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }
                        : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {t.type === "income" ? (
                    <Banknote className="h-[18px] w-[18px]" />
                  ) : t.type === "savings" ? (
                    <PiggyBank className="h-[18px] w-[18px]" />
                  ) : (
                    <CategoryIcon category={t.categoryKey} className="h-[18px] w-[18px]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    {` · ${t.subtitle}`}
                  </p>
                </div>
                <p
                  className="text-sm font-bold"
                  style={{ color: t.type === "income" ? PALETTE.mintInk : t.type === "savings" ? PALETTE.lilaInk : "hsl(var(--foreground))" }}
                >
                  {formatEUR(t.type === "income" ? t.amount : -t.amount, { sign: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ahorro del mes (móvil: 3) */}
      <div className="order-3 lg:order-none">
        <SavingsCard savings={d.savings} />
      </div>

      {/* Ingresos vs Gastos (móvil: 5) */}
      <section className="order-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:order-none lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Ingresos vs Gastos</h3>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETTE.lila }} />
              Ingresos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETTE.mint }} />
              Gastos
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Últimos 6 meses</p>
        <div className="mt-4">
          <IncomeExpenseBars data={d.bars} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-2xl bg-muted/70 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-bold" style={{ color: positive ? PALETTE.mintInk : "hsl(var(--foreground))" }}>
        {value}
      </p>
    </div>
  );
}

function SavingsCard({ savings }: { savings: Awaited<ReturnType<typeof getDashboard>>["savings"] }) {
  const pct = savings.monthlyPlan > 0 ? Math.min(100, Math.round((savings.thisMonth / savings.monthlyPlan) * 100)) : 0;
  return (
    <section
      className="rounded-3xl border border-border/60 p-6 shadow-sm"
      style={{ background: `linear-gradient(135deg, ${PALETTE.lilaSoft}, hsl(var(--card)))` }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Ahorro del mes</h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.lila, color: "#fff" }}>
          <PiggyBank className="h-[18px] w-[18px]" />
        </span>
      </div>

      <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
        {formatEUR(savings.thisMonth)}
        {savings.monthlyPlan > 0 && (
          <span className="text-sm font-semibold text-muted-foreground"> / {formatEUR(savings.monthlyPlan)}</span>
        )}
      </p>

      {savings.monthlyPlan > 0 && (
        <>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PALETTE.lila }} />
          </div>
          <p className="mt-2 text-xs font-semibold" style={{ color: PALETTE.lilaInk }}>{pct}% de tu plan mensual</p>
        </>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        Acumulado total: <span className="font-semibold text-foreground">{formatEUR(savings.total)}</span>
      </p>
      <Link href="/dashboard/ahorro" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Gestionar ahorro
      </Link>
    </section>
  );
}

function AlertCard({ d }: { d: Awaited<ReturnType<typeof getDashboard>> }) {
  const alert = d.topAlert;
  if (alert && alert.pct >= 75) {
    const critical = alert.pct >= 90;
    return (
      <section
        className="flex h-full flex-col rounded-3xl border p-6 shadow-sm"
        style={{
          borderColor: PALETTE.peach,
          background: `linear-gradient(135deg, ${PALETTE.peachSoft}, ${PALETTE.lilaSoft})`,
        }}
      >
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.peach, color: PALETTE.peachInk }}>
            <AlertTriangle className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: PALETTE.peachInk }}>
            {alert.pct}%
          </span>
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">Alerta de límites</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Has alcanzado el {alert.pct}% de tu presupuesto en{" "}
          <span className="font-semibold text-foreground">{alert.cat.label}</span>.
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/70">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, alert.pct)}%`, backgroundColor: critical ? PALETTE.peachInk : PALETTE.peach }} />
        </div>
        <Link
          href="/dashboard/limites"
          className="mt-5 block rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-white/80"
        >
          Ajustar presupuesto
        </Link>
      </section>
    );
  }
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/60 p-6 shadow-sm" style={{ background: `linear-gradient(135deg, ${PALETTE.mintSoft}, hsl(var(--card)))` }}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.mint, color: PALETTE.mintInk }}>
        <ShieldCheck className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-foreground">Todo bajo control</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Ninguna categoría supera el 75% de su límite este mes. ¡Buen ritmo!
      </p>
      <Link href="/dashboard/limites" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Ver límites
      </Link>
    </section>
  );
}
