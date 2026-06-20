"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palmtree, Plus, Plane, Check, Luggage } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { startVacation, closeVacation, addVacationExpense } from "@/app/dashboard/actions";
import { CATEGORIES } from "@/lib/constants";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

interface ExpenseRow {
  id: string;
  concepto: string | null;
  notas: string | null;
  category: string | null;
  amount: number;
  occurred_at: string;
}
interface ActiveVac {
  id: string;
  name: string;
  budget: number;
  spent: number;
  pct: number;
  txCount: number;
  start_date: string;
  end_date: string | null;
  expenses: ExpenseRow[];
}
interface ClosedVac {
  id: string;
  name: string;
  budget: number;
  spent: number;
  txCount: number;
  start_date: string;
  end_date: string | null;
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function VacationsView({
  active,
  closed,
}: {
  active: ActiveVac | null;
  closed: ClosedVac[];
}) {
  return (
    <div className="space-y-6">
      {active ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActiveCard vac={active} />
          </div>
          <div>
            <AddExpenseCard vacationId={active.id} />
          </div>
          <div className="lg:col-span-3">
            <ExpensesList vac={active} />
          </div>
        </div>
      ) : (
        <StartCard />
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
            <Luggage className="h-5 w-5 text-muted-foreground" /> Cápsulas de viaje
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((v) => (
              <div key={v.id} className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.peachSoft, color: PALETTE.peachInk }}>
                    <Plane className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Cerrado
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{v.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {fmtDay(v.start_date)}
                  {v.end_date && ` – ${fmtDay(v.end_date)}`}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total contabilizado</p>
                    <p className="text-xl font-extrabold text-foreground">{formatEUR(v.spent)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.txCount} gastos · presup. {formatEUR(v.budget)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ActiveCard({ vac }: { vac: ActiveVac }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const remaining = vac.budget - vac.spent;

  async function close() {
    if (!confirm(`¿Cerrar "${vac.name}"? Se añadirá el total (${formatEUR(vac.spent)}) a tus movimientos generales como gasto "Vacaciones".`)) return;
    setPending(true);
    const res = await closeVacation(vac.id);
    setPending(false);
    if (res.ok) {
      toast.success("Viaje cerrado · total añadido a movimientos generales");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <section className="relative h-full overflow-hidden rounded-3xl border border-[#F3D9C4] bg-card p-7 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl" style={{ backgroundColor: PALETTE.peach }} />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: PALETTE.lila }} />

      <div className="relative flex flex-wrap items-center gap-7">
        <ProgressRing value={vac.pct} size={140} stroke={13} color="#E8945B" trackColor="rgba(255,255,255,0.7)">
          <span className="text-2xl font-extrabold text-foreground">{vac.pct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">del presup.</span>
        </ProgressRing>

        <div className="min-w-[220px] flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: PALETTE.peach, color: PALETTE.peachInk }}>
            <Palmtree className="h-3.5 w-3.5" /> Modo vacaciones activo
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{vac.name}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmtDay(vac.start_date)}{vac.end_date && ` – ${fmtDay(vac.end_date)}`}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">
            {formatEUR(vac.spent)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">de {formatEUR(vac.budget)}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {remaining >= 0 ? `Te quedan ${formatEUR(remaining)}` : `Te has pasado ${formatEUR(-remaining)}`} · {vac.txCount} gastos
          </p>

          <button
            disabled={pending}
            onClick={close}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> Cerrar viaje y contabilizar
          </button>
        </div>
      </div>
    </section>
  );
}

function AddExpenseCard({ vacationId }: { vacationId: string }) {
  const router = useRouter();
  const [concepto, setConcepto] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const res = await addVacationExpense({
      vacation_id: vacationId,
      concepto,
      amount: Number(amount),
      occurred_at: date,
      category: category || null,
      notas: notas || undefined,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Gasto añadido al viaje");
      setConcepto("");
      setAmount("");
      setNotas("");
      setCategory("");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <section className="h-full rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Añadir gasto del viaje</h3>
      <p className="text-xs text-muted-foreground">Contabilidad interna · no afecta al total general hasta cerrar.</p>
      <div className="mt-4 space-y-3">
        <input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Concepto (ej. Cena, Hotel)"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Importe €"
            className="w-1/2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-1/2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
        >
          <option value="">Categoría (opcional)</option>
          {CATEGORIES.filter((c) => c.key !== "vacaciones").map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        <button
          disabled={pending || !concepto || !amount}
          onClick={submit}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Añadir gasto
        </button>
      </div>
    </section>
  );
}

function ExpensesList({ vac }: { vac: ActiveVac }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Gastos del viaje</h3>
      {vac.expenses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aún no hay gastos en este viaje. Añade el primero.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/60">
          {vac.expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-4 py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CategoryIcon category={e.category} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{e.concepto ?? "Gasto"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmtDay(e.occurred_at)}
                  {e.notas ? ` · ${e.notas}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-foreground">{formatEUR(-e.amount, { sign: true })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StartCard() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const res = await startVacation({
      name,
      budget: Number(budget),
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Proyecto de vacaciones creado");
      setName("");
      setBudget("");
      setEndDate("");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#F3D9C4] bg-card p-7 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: PALETTE.peach }} />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full opacity-40 blur-3xl" style={{ backgroundColor: PALETTE.lila }} />

      <div className="relative max-w-md">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.peach, color: PALETTE.peachInk }}>
          <Palmtree className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold tracking-tight">Crea un proyecto de vacaciones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra un viaje con su presupuesto y fechas. Sus gastos se llevan aparte y, al cerrarlo, el total se añade a tus movimientos como gasto &ldquo;Vacaciones&rdquo;.
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del viaje (ej. Vacaciones Sicilia)"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Presupuesto €"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div className="w-1/2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fin (opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <button
            disabled={pending || !name || !budget}
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Crear proyecto de vacaciones
          </button>
        </div>
      </div>
    </section>
  );
}
