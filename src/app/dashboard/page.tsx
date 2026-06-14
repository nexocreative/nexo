import Link from "next/link";
import { Camera, Mic, Plus, TrendingUp, AlertTriangle, ShieldCheck, CalendarDays, Banknote } from "lucide-react";
import { requireUserId, getDashboard } from "@/lib/data/queries";
import { ProgressRing } from "@/components/ui/progress-ring";
import { NominaCard } from "@/components/dashboard/nomina-card";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const d = await getDashboard(userId);
  const remaining = d.monthlyBudget ? d.monthlyBudget - d.monthExpense : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Columna principal */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Balance del mes */}
        <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
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
            <ProgressRing value={d.savingsRate} size={104} stroke={11} color={PALETTE.lila}>
              <span className="text-xl font-extrabold text-foreground">{d.savingsRate}%</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ahorro
              </span>
            </ProgressRing>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <Stat label="Ingresos" value={formatEUR(d.monthIncome)} positive />
            <Stat label="Gastos" value={formatEUR(d.monthExpense)} />
            <Stat label="Presup. restante" value={remaining !== null ? formatEUR(remaining) : "—"} />
          </div>
        </section>

        {/* Acceso rápido a añadir gasto */}
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Registrar un gasto</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <QuickAdd icon={Camera} title="Foto ticket" desc="Escanea con IA" bg={PALETTE.mintSoft} fg={PALETTE.mintInk} />
            <QuickAdd icon={Mic} title="Por voz" desc="Dilo en alto" bg={PALETTE.lilaSoft} fg={PALETTE.lilaInk} />
            <QuickAdd icon={Plus} title="Manual" desc="Paso a paso" bg={PALETTE.peachSoft} fg={PALETTE.peachInk} />
          </div>
        </section>

        {/* Últimos movimientos */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
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
                        : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    {t.type === "income" ? <Banknote className="h-[18px] w-[18px]" /> : <CategoryIcon category={t.category} className="h-[18px] w-[18px]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t.merchant ?? t.description ?? t.cat.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(t.occurred_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      {t.type === "expense" ? ` · ${t.cat.label}` : " · Ingreso"}
                    </p>
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: t.type === "income" ? PALETTE.mintInk : "hsl(var(--foreground))" }}
                  >
                    {formatEUR(t.type === "income" ? t.amount : -t.amount, { sign: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Columna lateral */}
      <div className="flex flex-col gap-6">
        {d.nomina?.needsConfirmation && <NominaCard expected={d.nomina.expected} />}

        <AlertCard d={d} />

        {/* Mini-recordatorio mes */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Este mes</h3>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Llevas <span className="font-semibold text-foreground">{formatEUR(d.monthExpense)}</span> en gastos
            {d.monthlyBudget ? (
              <>
                {" "}de un presupuesto de{" "}
                <span className="font-semibold text-foreground">{formatEUR(d.monthlyBudget)}</span>.
              </>
            ) : (
              "."
            )}
          </p>
          {d.monthlyBudget && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, d.budgetSpentPct)}%`,
                  backgroundColor: d.budgetState === "ok" ? PALETTE.lila : d.budgetState === "warning" ? PALETTE.peach : PALETTE.peachInk,
                }}
              />
            </div>
          )}
          <Link href="/dashboard/limites" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Gestionar límites
          </Link>
        </section>
      </div>
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

function QuickAdd({
  icon: Icon,
  title,
  desc,
  bg,
  fg,
}: {
  icon: typeof Camera;
  title: string;
  desc: string;
  bg: string;
  fg: string;
}) {
  return (
    <Link
      href="/dashboard/anadir"
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: bg, color: fg }}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function AlertCard({ d }: { d: Awaited<ReturnType<typeof getDashboard>> }) {
  const alert = d.topAlert;
  if (alert && alert.pct >= 75) {
    const critical = alert.pct >= 90;
    return (
      <section
        className="rounded-3xl border p-6 shadow-sm"
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
    <section className="rounded-3xl border border-border/60 p-6 shadow-sm" style={{ background: `linear-gradient(135deg, ${PALETTE.mintSoft}, hsl(var(--card)))` }}>
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
