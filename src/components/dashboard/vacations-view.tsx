"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palmtree, Plus, Plane, Check, Luggage } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { startVacation, closeVacation } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

interface ActiveVac {
  id: string;
  name: string;
  budget: number;
  spent: number;
  pct: number;
  txCount: number;
  start_date: string;
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

export function VacationsView({
  active,
  closed,
}: {
  active: ActiveVac | null;
  closed: ClosedVac[];
}) {
  return (
    <div className="space-y-6">
      {active ? <ActiveCard vac={active} /> : <StartCard />}

      {closed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
            <Luggage className="h-5 w-5 text-muted-foreground" /> Cápsulas de viaje
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((v) => (
              <div key={v.id} className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE6D2] text-[#D98A4E]">
                    <Plane className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Cerrado
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{v.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.start_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  {v.end_date && ` – ${new Date(v.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Gastado</p>
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
    setPending(true);
    const res = await closeVacation(vac.id);
    setPending(false);
    if (res.ok) {
      toast.success("Viaje cerrado · resumen generado");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#F3D9C4] bg-card p-7 shadow-sm">
      {/* Blobs decorativos melocotón/lila */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl" style={{ backgroundColor: PALETTE.peach }} />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: PALETTE.lila }} />

      <div className="relative flex flex-wrap items-center gap-7">
        <ProgressRing value={vac.pct} size={140} stroke={13} color="#E8945B" trackColor="rgba(255,255,255,0.7)">
          <span className="text-2xl font-extrabold text-foreground">{vac.pct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">del presup.</span>
        </ProgressRing>

        <div className="min-w-[220px] flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE6D2] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#D98A4E]">
            <Palmtree className="h-3.5 w-3.5" /> Modo vacaciones activo
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{vac.name}</h2>
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
            <Check className="h-4 w-4" /> Cerrar viaje y generar resumen
          </button>
        </div>
      </div>
    </section>
  );
}

function StartCard() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const res = await startVacation({ name, budget: Number(budget), end_date: endDate || undefined });
    setPending(false);
    if (res.ok) {
      toast.success("Modo vacaciones activado");
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
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE6D2] text-[#D98A4E]">
          <Palmtree className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold tracking-tight">Inicia un modo vacaciones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Un período especial con presupuesto propio. Los gastos del viaje se agrupan en una cápsula aparte y, al cerrarla, se genera un resumen que se integra en tus estadísticas.
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del viaje (ej. Verano en Cádiz)"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Presupuesto €"
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground outline-none focus:border-primary/50"
            />
          </div>
          <button
            disabled={pending || !name || !budget}
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Activar modo vacaciones
          </button>
        </div>
      </div>
    </section>
  );
}
