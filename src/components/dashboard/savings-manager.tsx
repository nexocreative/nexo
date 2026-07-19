"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Check,
  Wallet,
  CalendarRange,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavingsBars } from "@/components/charts/savings-bars";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  createSavingsCategory,
  updateSavingsCategory,
  deleteSavingsCategory,
  addSavingsEntry,
} from "@/app/dashboard/actions";

export interface CategoryView {
  id: string;
  name: string;
  monthlyPlan: number;
  thisMonth: number;
  accumulated: number;
  byMonth: Record<string, number>;
  targetAmount: number | null;
  targetDate: string | null;
  daysLeft: number | null;
}

export interface SavingsData {
  thisMonth: number;
  monthlyPlan: number;
  yearTotal: number;
  total: number;
  currentMonth: string;
  categories: CategoryView[];
  monthly: { month: string; amount: number }[];
  months: { value: string; label: string }[];
}

type CatEditing = CategoryView | "new" | null;

export function SavingsManager({ data }: { data: SavingsData }) {
  const [catEditing, setCatEditing] = React.useState<CatEditing>(null);
  const [contributeFor, setContributeFor] = React.useState<CategoryView | "any" | null>(null);

  const now = new Date();
  const monthName = now.toLocaleDateString("es-ES", { month: "long" });
  const year = now.getFullYear();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      {/* Columna principal (izquierda): resumen + tabla + gráfica */}
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
      {/* Resumen */}
      <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.lila, color: "#fff" }}>
              <PiggyBank className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ahorro de {monthName}</p>
              <p className="text-3xl font-extrabold tracking-tight text-foreground">{formatEUR(data.thisMonth)}</p>
            </div>
          </div>
          <button
            onClick={() => setContributeFor("any")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Añadir aporte
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat icon={Wallet} label="Plan mensual" value={formatEUR(data.monthlyPlan)} />
          <Stat icon={CalendarRange} label={`Acumulado ${year}`} value={formatEUR(data.yearTotal)} />
          <Stat icon={TrendingUp} label="Acumulado total" value={formatEUR(data.total)} highlight />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          El ahorro de cada mes se aparta de tu balance: <span className="font-semibold text-foreground">ingresos − gastos − ahorro</span>.
        </p>
      </section>

      {/* Tabla mensual por categoría */}
      <MonthlyTable categories={data.categories} months={data.months} currentMonth={data.currentMonth} />

      {/* Balance mes a mes */}
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Balance mes a mes</h3>
        <p className="text-xs text-muted-foreground">Lo que has ahorrado cada mes (últimos 12 meses)</p>
        <div className="mt-4">
          <SavingsBars data={data.monthly} />
        </div>
      </section>
      </div>

      {/* Aside derecha: categorías de ahorro */}
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">Categorías</h3>
            <p className="text-sm text-muted-foreground">Añade tu objetivo de ahorro</p>
          </div>
          <button
            onClick={() => setCatEditing("new")}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir
          </button>
        </div>

        {data.categories.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">Aún no tienes categorías. Crea la primera.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {data.categories.map((c) => {
              const isGoal = c.targetAmount != null;
              const pct = isGoal
                ? Math.min(100, Math.round((c.accumulated / c.targetAmount!) * 100))
                : c.monthlyPlan > 0
                  ? Math.min(100, Math.round((c.thisMonth / c.monthlyPlan) * 100))
                  : 0;
              return (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">{c.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{formatEUR(isGoal ? c.accumulated : c.thisMonth)}</span>
                      <button
                        onClick={() => setCatEditing(c)}
                        aria-label={`Editar ${c.name}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGoal
                      ? <>de {formatEUR(c.targetAmount!)} · quedan {c.daysLeft} días</>
                      : <>este mes{c.monthlyPlan > 0 && ` · plan ${formatEUR(c.monthlyPlan)}`}</>}
                  </p>
                  {(isGoal || c.monthlyPlan > 0) && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PALETTE.lila }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold" style={{ color: PALETTE.lilaInk }}>{pct}%</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CategoryDialog editing={catEditing} onClose={() => setCatEditing(null)} />
      <ContributeDialog
        target={contributeFor}
        categories={data.categories}
        onClose={() => setContributeFor(null)}
      />
    </div>
  );
}

function MonthlyTable({
  categories,
  months,
  currentMonth,
}: {
  categories: CategoryView[];
  months: { value: string; label: string }[];
  currentMonth: string;
}) {
  const [month, setMonth] = React.useState(currentMonth);
  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    plan: c.monthlyPlan,
    amount: c.byMonth[month] ?? 0,
  }));
  const totalPlan = rows.reduce((a, r) => a + r.plan, 0);
  const totalAmount = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Resumen mensual</h3>
          <p className="text-xs text-muted-foreground">Cuánto has ahorrado por categoría en el mes elegido.</p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold capitalize outline-none focus:border-primary/50 sm:w-auto"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
          ))}
        </select>
      </div>

      {categories.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Aún no tienes categorías de ahorro.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-semibold">Categoría</th>
                <th className="pb-2 px-3 text-right font-semibold">Plan</th>
                <th className="pb-2 px-3 text-right font-semibold">Ahorrado</th>
                <th className="pb-2 pl-3 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = r.plan > 0 ? Math.round((r.amount / r.plan) * 100) : null;
                return (
                  <tr key={r.id} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE.lila }} />
                        {r.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">{r.plan > 0 ? formatEUR(r.plan) : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-foreground">{formatEUR(r.amount)}</td>
                    <td className="py-2.5 pl-3 text-right font-semibold" style={{ color: PALETTE.lilaInk }}>
                      {pct === null ? "—" : `${pct}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border/60 font-bold text-foreground">
                <td className="pt-3 pr-3">Total</td>
                <td className="pt-3 px-3 text-right">{totalPlan > 0 ? formatEUR(totalPlan) : "—"}</td>
                <td className="pt-3 px-3 text-right">{formatEUR(totalAmount)}</td>
                <td className="pt-3 pl-3 text-right">
                  {totalPlan > 0 ? `${Math.round((totalAmount / totalPlan) * 100)}%` : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={highlight ? { backgroundColor: PALETTE.lilaSoft } : { backgroundColor: "hsl(var(--muted) / 0.7)" }}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <p className="mt-1 text-base font-bold" style={{ color: highlight ? PALETTE.lilaInk : "hsl(var(--foreground))" }}>{value}</p>
    </div>
  );
}

type PlanMode = "fixed" | "goal";

function CategoryDialog({ editing, onClose }: { editing: CatEditing; onClose: () => void }) {
  const router = useRouter();
  const item = editing && editing !== "new" ? editing : null;

  const [name, setName] = React.useState("");
  const [mode, setMode] = React.useState<PlanMode>("fixed");
  const [plan, setPlan] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      if (item.targetAmount != null && item.targetDate) {
        setMode("goal");
        setTargetAmount(String(item.targetAmount));
        setTargetDate(item.targetDate.slice(0, 10));
        setPlan("");
      } else {
        setMode("fixed");
        setPlan(item.monthlyPlan ? String(item.monthlyPlan) : "");
        setTargetAmount("");
        setTargetDate("");
      }
    } else {
      setName("");
      setMode("fixed");
      setPlan("");
      setTargetAmount("");
      setTargetDate("");
    }
    setConfirmDel(false);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const goalPreview = React.useMemo(() => {
    if (mode !== "goal") return null;
    const amount = Number(targetAmount);
    if (!amount || !targetDate) return null;
    const accumulated = item?.accumulated ?? 0;
    const daysLeft = Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000));
    const monthsLeft = Math.max(1, daysLeft / 30);
    const monthlyNeeded = Math.max(0, Math.round((amount - accumulated) / monthsLeft));
    return { monthlyNeeded, daysLeft };
  }, [mode, targetAmount, targetDate, item]);

  async function save() {
    setPending(true);
    const payload =
      mode === "goal"
        ? {
            name,
            monthly_plan: 0,
            target_amount: targetAmount === "" ? 0 : Number(targetAmount),
            target_date: targetDate || null,
          }
        : {
            name,
            monthly_plan: plan === "" ? 0 : Number(plan),
            target_amount: null,
            target_date: null,
          };
    const res = item ? await updateSavingsCategory(item.id, payload) : await createSavingsCategory(payload);
    setPending(false);
    if (res.ok) {
      toast.success(item ? "Categoría actualizada" : "Categoría creada");
      onClose();
      router.refresh();
    } else toast.error(res.error);
  }

  async function remove() {
    if (!item) return;
    setPending(true);
    const res = await deleteSavingsCategory(item.id);
    setPending(false);
    if (res.ok) {
      toast.success("Categoría eliminada");
      onClose();
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Editar categoría" : "Nueva categoría de ahorro"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Emergencia, Vacaciones, Coche"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cómo quieres planificarlo</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("fixed")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  mode === "fixed" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                Importe fijo al mes
              </button>
              <button
                type="button"
                onClick={() => setMode("goal")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  mode === "goal" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                Objetivo con fecha
              </button>
            </div>
          </div>

          {mode === "fixed" ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan mensual (€)</label>
              <input
                type="number"
                step="0.01"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="0.00 (opcional)"
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Es tu objetivo de referencia; el aporte de cada mes lo añades tú a mano.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objetivo total (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="Ej. 2400"
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha límite</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {goalPreview
                  ? `Necesitas ahorrar ≈ ${formatEUR(goalPreview.monthlyNeeded)}/mes (quedan ${goalPreview.daysLeft} días). Se recalcula solo según lo que vayas aportando.`
                  : "Pon el importe y la fecha para ver cuánto necesitas ahorrar al mes."}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              disabled={pending || !name}
              onClick={save}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> {item ? "Guardar" : "Crear"}
            </button>
            {item && !confirmDel && (
              <button
                disabled={pending}
                onClick={() => setConfirmDel(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-[#C2496B] hover:bg-destructive/20 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {item && confirmDel && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-sm font-semibold text-foreground">¿Eliminar &ldquo;{item.name}&rdquo;? Se borrarán también sus aportes.</p>
              <div className="mt-2 flex gap-2">
                <button
                  disabled={pending}
                  onClick={remove}
                  className="flex-1 rounded-lg bg-[#C2496B] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  Sí, eliminar
                </button>
                <button
                  disabled={pending}
                  onClick={() => setConfirmDel(false)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContributeDialog({
  target,
  categories,
  onClose,
}: {
  target: CategoryView | "any" | null;
  categories: CategoryView[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const months = React.useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const value = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      out.push({ value, label: m.toLocaleDateString("es-ES", { month: "long", year: "numeric" }) });
    }
    return out;
  }, []);

  React.useEffect(() => {
    if (!target) return;
    setCategoryId(target === "any" ? categories[0]?.id ?? "" : target.id);
    setAmount("");
    setMonth(months[0]?.value ?? "");
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setPending(true);
    const res = await addSavingsEntry({ category_id: categoryId, amount: Number(amount), month });
    setPending(false);
    if (res.ok) {
      toast.success(`+${formatEUR(Number(amount))} ahorrado`);
      onClose();
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar aporte de ahorro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Importe (€)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mes</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm capitalize outline-none focus:border-primary/50"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Usa un importe negativo para corregir o retirar ahorro.</p>

          <button
            disabled={pending || !categoryId || !amount}
            onClick={save}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60",
            )}
          >
            <Check className="h-4 w-4" /> Guardar aporte
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
