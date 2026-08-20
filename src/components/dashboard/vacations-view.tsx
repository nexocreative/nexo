"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palmtree, Plus, Plane, Check, Luggage, Camera, Mic, PenLine, Upload, Loader2, Square, BedDouble, Bus, Car, UtensilsCrossed, Ticket, Gamepad2, ShoppingBag, Shield, Package, Pencil, Trash2, X, ChevronDown, Users, MoreHorizontal, Link2Off, ArrowRight, type LucideIcon } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { startVacation, closeVacation, addVacationExpense, deleteVacationExpense, updateVacationExpense, renameVacation, linkVacationGrupo, createGrupo, addGrupoGasto } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";
import { upgradeToast } from "@/lib/upgrade-toast";
import { cn } from "@/lib/utils";
import { balanceColor } from "@/components/dashboard/juntos-view";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog";
import { useCategories } from "@/components/dashboard/categories-provider";
import type { GrupoConDetalle, GrupoBalance } from "@/types/database";

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
  grupo: GrupoConDetalle | null;
}
interface ClosedVac {
  id: string;
  name: string;
  budget: number;
  spent: number;
  txCount: number;
  start_date: string;
  end_date: string | null;
  expenses: ExpenseRow[];
  summary: Record<string, unknown> | null;
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Selector de pestañas "Gastos"/"Saldos", reutilizado en el viaje activo y en el detalle de viajes cerrados. */
function VacTabs({ tab, onChange }: { tab: "gastos" | "saldos"; onChange: (t: "gastos" | "saldos") => void }) {
  return (
    <div className="flex w-fit rounded-xl border border-border/60 bg-muted/40 p-1 gap-1">
      {(["gastos", "saldos"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t === "gastos" ? "Gastos" : "Saldos"}
        </button>
      ))}
    </div>
  );
}

/** Barra con el nombre del grupo vinculado y la opción de desvincularlo (no borra el grupo, solo lo desasocia del viaje). */
/**
 * Insignia de solo lectura con el grupo vinculado + un menú "..." aparte para
 * desvincular (con modal de confirmación), igual patrón que usa GrupoDetail
 * para "Eliminar/Abandonar grupo" en vez de meter la acción en la propia insignia.
 */
/** Insignia de solo lectura con el grupo vinculado — sin acciones, solo informativa. */
function LinkedGrupoBadge({ grupoName }: { grupoName: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 shadow-sm" style={{ backgroundColor: PALETTE.lilaSoft }}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card" style={{ color: PALETTE.lilaInk }}>
        <Users className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm font-medium" style={{ color: PALETTE.lilaInk }}>
        Vinculado a <span className="font-bold">{grupoName}</span>
      </span>
    </div>
  );
}

/**
 * Resumen de solo lectura del grupo vinculado (total gastado + quién debe a
 * quién). Gestionar el grupo (añadir gasto, saldar, invitar) se hace siempre
 * desde "En conjunto" para no duplicar esa UI en dos sitios; aquí solo se
 * enlaza directo a su detalle. El botón de desvincular vive junto a ese
 * enlace, ya que ambos son "acciones sobre el vínculo", no información.
 */
function LinkedGrupoSummary({ vacationId, grupo }: { vacationId: string; grupo: GrupoConDetalle }) {
  const router = useRouter();
  const totalGastado = grupo.gastos.reduce((a, g) => a + g.amount, 0);
  const nonZero = grupo.balances.filter((b) => Math.abs(b.net) >= 0.01);

  const [showMenu, setShowMenu] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [unlinking, setUnlinking] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function unlink() {
    setUnlinking(true);
    try {
      const res = await linkVacationGrupo(vacationId, null);
      if (res.ok) { toast.success("Grupo desvinculado del viaje"); router.refresh(); }
      else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al desvincular");
    } finally {
      setUnlinking(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total gastado en el grupo</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-foreground">{formatEUR(totalGastado)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/juntos?grupo=${grupo.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              Ver y gestionar en En conjunto <ArrowRight className="h-4 w-4" />
            </Link>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Opciones del grupo vinculado"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-border bg-card py-1 shadow-xl">
                  <button
                    onClick={() => { setShowMenu(false); setShowConfirm(true); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-muted"
                  >
                    <Link2Off className="h-4 w-4" />
                    Desvincular grupo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {nonZero.length === 0 ? (
          <p className="mt-5 border-t border-border/60 pt-4 text-sm text-muted-foreground">Todo saldado.</p>
        ) : (
          <ul className="mt-5 space-y-3 border-t border-border/60 pt-4">
            {nonZero.map((b) => (
              <li key={b.user_id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground">{b.display_name ?? b.email}</span>
                <span className="shrink-0 font-semibold" style={{ color: balanceColor(b.net) }}>
                  {b.net > 0 ? `Te debe ${formatEUR(b.net)}` : `Le debes ${formatEUR(Math.abs(b.net))}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">¿Desvincular el grupo?</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Dejarás de ver los gastos y saldos de <span className="font-semibold text-foreground">{grupo.name}</span> en este viaje. El grupo en sí no se borra, sigue disponible en &ldquo;En conjunto&rdquo;.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={unlink}
                disabled={unlinking}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {unlinking ? "..." : "Desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** CTA para vincular el viaje a un grupo de "En conjunto" cuando aún no tiene ninguno. */
function LinkGrupoCard({
  vacationId,
  availableGrupos,
}: {
  vacationId: string;
  availableGrupos: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState("");
  const [linking, setLinking] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function linkExisting() {
    if (!selected) return;
    setLinking(true);
    try {
      const res = await linkVacationGrupo(vacationId, selected);
      if (res.ok) { toast.success("Viaje vinculado al grupo"); router.refresh(); }
      else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al vincular");
    } finally {
      setLinking(false);
    }
  }

  async function createAndLink() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createGrupo(newName.trim());
      if (!res.ok) {
        if (res.upgradeRequired) upgradeToast(res.error, router);
        else toast.error(res.error);
        return;
      }
      if ("id" in res && res.id) {
        const link = await linkVacationGrupo(vacationId, res.id);
        if (link.ok) { toast.success("Grupo creado y vinculado"); router.refresh(); }
        else toast.error(link.error);
      }
    } catch {
      toast.error("Error de conexión al crear el grupo");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
        <Users className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-bold tracking-tight text-foreground">Reparte los gastos del viaje</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Vincula este viaje a un grupo de &ldquo;En conjunto&rdquo; para añadir gastos compartidos entre los acompañantes y ver quién debe a quién.
      </p>

      {availableGrupos.length > 0 && (
        <div className="mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-card py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary/50"
            >
              <option value="">Elige un grupo existente…</option>
              {availableGrupos.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            onClick={linkExisting}
            disabled={!selected || linking}
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {linking ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      )}

      <div className="mt-4 flex max-w-md items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del grupo nuevo"
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={createAndLink}
          disabled={!newName.trim() || creating}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {creating ? "Creando..." : "Crear grupo"}
        </button>
      </div>
    </section>
  );
}

/** Foto de los saldos de un viaje cerrado, tal y como quedaron al cerrarlo (el grupo en sí sigue vivo e independiente del viaje). */
function ClosedGrupoSnapshot({ summary }: { summary: Record<string, unknown> | null }) {
  const snapshot = (summary as { grupo_snapshot?: { grupo_name: string; balances: GrupoBalance[] } | null } | null)?.grupo_snapshot ?? null;

  if (!snapshot) {
    return <p className="text-sm text-muted-foreground">Este viaje no se vinculó a ningún grupo compartido.</p>;
  }

  const nonZero = snapshot.balances.filter((b) => Math.abs(b.net) >= 0.01);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Foto de los saldos de &ldquo;{snapshot.grupo_name}&rdquo; al cerrar el viaje.
      </p>
      {nonZero.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todo saldado en ese momento.</p>
      ) : (
        <ul className="space-y-2.5">
          {nonZero.map((b) => (
            <li key={b.user_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-foreground">{b.display_name ?? b.email}</span>
              <span className="shrink-0 font-semibold" style={{ color: balanceColor(b.net) }}>
                {b.net > 0 ? `Te debía ${formatEUR(b.net)}` : `Le debías ${formatEUR(Math.abs(b.net))}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VacationsView({
  active,
  closed,
  currentUserId,
  availableGrupos,
}: {
  active: ActiveVac | null;
  closed: ClosedVac[];
  currentUserId: string;
  availableGrupos: { id: string; name: string }[];
}) {
  const [detail, setDetail] = React.useState<ClosedVac | null>(null);
  const [activeTab, setActiveTab] = React.useState<"gastos" | "saldos">("gastos");
  const [detailTab, setDetailTab] = React.useState<"gastos" | "saldos">("gastos");

  return (
    <div className="space-y-6">
      {active ? (
        <div className="space-y-6">
          <VacTabs tab={activeTab} onChange={setActiveTab} />
          {activeTab === "gastos" ? (
            <div className="grid min-w-0 gap-6 lg:grid-cols-3 lg:items-start">
              <div className="min-w-0 lg:col-span-2">
                <ActiveCard vac={active} />
              </div>
              <div className="min-w-0 lg:row-span-2">
                <AddExpenseCard vacationId={active.id} currentUserId={currentUserId} grupo={active.grupo} />
              </div>
              <div className="min-w-0 lg:col-span-2">
                <ExpensesList vac={active} />
              </div>
            </div>
          ) : active.grupo ? (
            <div className="space-y-4">
              <LinkedGrupoBadge grupoName={active.grupo.name} />
              <LinkedGrupoSummary vacationId={active.id} grupo={active.grupo} />
            </div>
          ) : (
            <LinkGrupoCard vacationId={active.id} availableGrupos={availableGrupos} />
          )}
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
              <button
                key={v.id}
                onClick={() => { setDetail(v); setDetailTab("gastos"); }}
                className="rounded-3xl border border-border/60 bg-card p-6 text-left shadow-sm transition-transform hover:-translate-y-0.5"
              >
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
                <p className="mt-3 text-xs font-semibold text-primary">Ver detalles →</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Detalle de un viaje cerrado */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.peachSoft, color: PALETTE.peachInk }}>
                    <Plane className="h-5 w-5" />
                  </span>
                  {detail.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-end justify-between rounded-2xl bg-muted/60 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total del viaje</p>
                    <p className="text-2xl font-extrabold text-foreground">{formatEUR(detail.spent)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fmtDay(detail.start_date)}{detail.end_date && ` – ${fmtDay(detail.end_date)}`} · presup. {formatEUR(detail.budget)}
                  </p>
                </div>

                <VacTabs tab={detailTab} onChange={setDetailTab} />

                {detailTab === "gastos" ? (
                  detail.expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Este viaje no tiene gastos registrados.</p>
                  ) : (
                    <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto">
                      {detail.expenses.map((e) => (
                        <li key={e.id} className="flex items-center gap-3 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <VacIcon category={e.category} className="h-[18px] w-[18px]" />
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
                  )
                ) : (
                  <ClosedGrupoSnapshot summary={detail.summary} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActiveCard({ vac }: { vac: ActiveVac }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(vac.name);
  const [savingName, setSavingName] = React.useState(false);
  const remaining = vac.budget - vac.spent;

  async function saveName() {
    if (!nameValue.trim() || nameValue.trim() === vac.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await renameVacation(vac.id, nameValue);
      if (res.ok) { toast.success("Nombre actualizado"); router.refresh(); }
      else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }

  async function close() {
    setPending(true);
    try {
      const res = await closeVacation(vac.id);
      if (res.ok) {
        toast.success("Viaje cerrado · total añadido a movimientos generales");
        router.refresh();
      } else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al cerrar el viaje");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative h-full overflow-hidden rounded-3xl border border-[#F3D9C4] bg-card p-7 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl" style={{ backgroundColor: PALETTE.peach }} />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: PALETTE.lila }} />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-7">
        <ProgressRing value={vac.pct} size={110} stroke={11} color="#E8945B" trackColor="rgba(255,255,255,0.7)">
          <span className="text-2xl font-extrabold text-foreground">{vac.pct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">del presup.</span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          {/* Color fijo: el fondo PALETTE.peach no cambia con el tema. */}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: PALETTE.peach, color: "#C47C45" }}>
            <Palmtree className="h-3.5 w-3.5" /> Modo vacaciones activo
          </span>
          {editingName ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                className="min-w-0 flex-1 rounded-xl border border-primary/50 bg-card/70 px-3 py-1.5 text-xl font-extrabold tracking-tight text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={saveName} disabled={savingName} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditingName(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => { setNameValue(vac.name); setEditingName(true); }} className="group mt-3 flex items-center gap-2 text-left">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{vac.name}</h2>
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
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

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              <Check className="h-4 w-4" /> Cerrar viaje y contabilizar
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm">
              <p className="text-sm font-semibold text-foreground">¿Cerrar &ldquo;{vac.name}&rdquo;?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Se añadirá el total ({formatEUR(vac.spent)}) a tus movimientos generales como gasto &ldquo;Vacaciones&rdquo;.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={pending}
                  onClick={close}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" /> Sí, cerrar
                </button>
                <button
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const VAC_CATEGORIES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "alojamiento",    label: "Alojamiento",       icon: BedDouble },
  { key: "vuelos",         label: "Vuelos",             icon: Plane },
  { key: "transporte",     label: "Transporte",         icon: Bus },
  { key: "coche_alquiler", label: "Alquiler de coche",  icon: Car },
  { key: "restaurantes",   label: "Restaurantes",       icon: UtensilsCrossed },
  { key: "entradas",       label: "Entradas y tickets", icon: Ticket },
  { key: "ocio",           label: "Ocio y actividades", icon: Gamepad2 },
  { key: "compras",        label: "Compras",            icon: ShoppingBag },
  { key: "seguro",         label: "Seguro de viaje",    icon: Shield },
  { key: "otros",          label: "Otros",              icon: Package },
];

const VAC_CAT_MAP = Object.fromEntries(VAC_CATEGORIES.map((c) => [c.key, c]));


function VacIcon({ category, className }: { category: string | null; className?: string }) {
  const categories = useCategories();
  if (category && VAC_CAT_MAP[category]) {
    const Icon = VAC_CAT_MAP[category].icon;
    return <Icon className={className} />;
  }
  // No es una de las categorías de viaje: prueba con las propias del usuario.
  return <CategoryIcon category={category} categories={categories.filter((c) => c.custom)} className={className} />;
}

type VacMethod = "photo" | "voice" | "manual";

const vacMethods: { key: VacMethod; label: string; icon: typeof Camera; bg: string; fg: string }[] = [
  { key: "photo", label: "Ticket", icon: Camera, bg: PALETTE.mintSoft, fg: PALETTE.mintInk },
  { key: "voice", label: "Voz", icon: Mic, bg: PALETTE.lilaSoft, fg: PALETTE.lilaInk },
  { key: "manual", label: "Manual", icon: PenLine, bg: PALETTE.peachSoft, fg: PALETTE.peachInk },
];

function AddExpenseCard({
  vacationId,
  currentUserId,
  grupo,
}: {
  vacationId: string;
  currentUserId: string;
  grupo: GrupoConDetalle | null;
}) {
  const router = useRouter();
  const categories = useCategories();
  const vacCategories = React.useMemo(
    () => [...VAC_CATEGORIES, ...categories.filter((c) => c.custom)],
    [categories],
  );
  const [showNewCategory, setShowNewCategory] = React.useState(false);
  const [method, setMethod] = React.useState<VacMethod>("manual");
  const [concepto, setConcepto] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [detected, setDetected] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const mountedRef = React.useRef(true);

  // Compartir el gasto con el grupo vinculado al viaje (además de guardarlo
  // como gasto personal): quién pagó y quién participa en el reparto.
  const acceptedGrupoMembers = React.useMemo(
    () => grupo?.members.filter((m) => m.status === "accepted") ?? [],
    [grupo],
  );
  const [shareWithGroup, setShareWithGroup] = React.useState(false);
  const [gastoPaidBy, setGastoPaidBy] = React.useState(currentUserId);
  const [gastoParticipants, setGastoParticipants] = React.useState<string[]>(
    acceptedGrupoMembers.map((m) => m.user_id),
  );

  const toggleParticipant = (uid: string) => {
    setGastoParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  // Si el componente se desmonta (p.ej. se navega fuera) a media grabación o
  // análisis, libera el micrófono y evita setState sobre un componente ya
  // desmontado.
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") {
        mr.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  function pickMethod(m: VacMethod) {
    setMethod(m);
    setDetected(false);
    setRecording(false);
    if (m === "manual") { setConcepto(""); setAmount(""); }
  }

  async function analyzePhoto(file: File) {
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ticket", { method: "POST", body: fd });
      const json = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok) { toast.error(json.error ?? "No se pudo analizar el ticket"); return; }
      const d = json.data;
      if (d.comercio) setConcepto(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.categoria) setCategory(d.categoria);
      if (d.fecha) setDate(d.fecha);
      setDetected(true);
      toast.success("Ticket analizado · revisa los datos");
    } catch {
      if (mountedRef.current) toast.error("Error de conexión al analizar el ticket");
    } finally {
      if (mountedRef.current) setAnalyzing(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        analyzeVoice(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch { toast.error("No se pudo acceder al micrófono. Revisa los permisos."); }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setRecording(false); }

  async function analyzeVoice(blob: Blob) {
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      const res = await fetch("/api/voice", { method: "POST", body: fd });
      const json = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok) { toast.error(json.error ?? "No se pudo procesar la voz"); return; }
      const d = json.data;
      if (d.comercio) setConcepto(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.categoria) setCategory(d.categoria);
      if (d.fecha) setDate(d.fecha);
      setDetected(true);
      toast.success(`Entendido: "${json.transcript}"`);
    } catch {
      if (mountedRef.current) toast.error("Error de conexión al procesar la voz");
    } finally {
      if (mountedRef.current) setAnalyzing(false);
    }
  }

  async function submit() {
    setPending(true);
    try {
      const res = await addVacationExpense({
        vacation_id: vacationId,
        concepto,
        amount: Number(amount),
        occurred_at: date,
        category: category || null,
        notas: notas || undefined,
      });
      if (!res.ok) { toast.error(res.error); return; }

      // Además de guardarlo como gasto personal del viaje, si se marcó
      // "Compartir con el grupo" se registra también como gasto compartido
      // (con quién pagó y quién participa) para que entre en el reparto.
      if (shareWithGroup && grupo && gastoParticipants.length > 0) {
        const shareRes = await addGrupoGasto({
          grupoId: grupo.id,
          description: concepto,
          amount: Number(amount),
          occurredAt: date,
          paidBy: gastoPaidBy,
          participantIds: gastoParticipants,
        });
        if (!shareRes.ok) toast.error(`Gasto guardado, pero no se pudo compartir con el grupo: ${shareRes.error}`);
      }

      toast.success("Gasto añadido al viaje");
      setConcepto(""); setAmount(""); setNotas(""); setCategory("");
      setDetected(false); setMethod("manual");
      setShareWithGroup(false); setGastoPaidBy(currentUserId);
      setGastoParticipants(acceptedGrupoMembers.map((m) => m.user_id));
      router.refresh();
    } catch {
      toast.error("Error de conexión al guardar el gasto");
    } finally {
      setPending(false);
    }
  }

  const showCapture = method !== "manual" && !detected;

  return (
    <section className="h-full rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Añadir gasto del viaje</h3>
      <p className="text-xs text-muted-foreground">Contabilidad interna · no afecta al total hasta cerrar.</p>

      {/* Selector de método */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {vacMethods.map((m) => (
          <button
            key={m.key}
            onClick={() => pickMethod(m.key)}
            className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition-all hover:-translate-y-0.5 ${method === m.key ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60 bg-card"}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: m.bg, color: m.fg }}>
              <m.icon className="h-4 w-4" />
            </span>
            <p className="mt-1.5 text-[11px] font-bold text-primary">{m.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {/* Zona de captura (foto o voz) */}
        {showCapture && method === "photo" && (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-accent/40 p-5 text-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzePhoto(f); }}
            />
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
              {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </span>
            <p className="mt-2 text-xs font-semibold text-foreground">
              {analyzing ? "Analizando con IA…" : "Sube o haz una foto del ticket"}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={analyzing}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" /> {analyzing ? "Procesando…" : "Subir / hacer foto"}
            </button>
          </div>
        )}

        {showCapture && method === "voice" && (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-accent/40 p-5 text-center">
            <span className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
              {recording && <span className="absolute inset-0 animate-ping rounded-xl" style={{ backgroundColor: PALETTE.lila, opacity: 0.4 }} />}
              {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="relative h-5 w-5" />}
            </span>
            <p className="mt-2 text-xs font-semibold text-foreground">
              {analyzing ? "Transcribiendo con IA…" : recording ? "Escuchando… habla ahora" : "Pulsa y di el gasto en alto"}
            </p>
            {!recording ? (
              <button
                onClick={startRecording}
                disabled={analyzing}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Mic className="h-3.5 w-3.5" /> {analyzing ? "Procesando…" : "Empezar a hablar"}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#C2496B] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <Square className="h-3.5 w-3.5" /> Detener y analizar
              </button>
            )}
          </div>
        )}

        {/* Formulario (siempre visible en manual; visible tras detección en foto/voz) */}
        {(method === "manual" || detected) && (
          <>
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
              <DatePicker
                value={date}
                onChange={setDate}
                showIcon={false}
                formatStr="d MMM"
                className="w-1/2 px-3 py-2.5"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-card py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary/50"
                >
                  <option value="">Categoría (opcional)</option>
                  {vacCategories.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                aria-label="Nueva categoría"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <CategoryFormDialog
              open={showNewCategory}
              onOpenChange={setShowNewCategory}
              editing={null}
              onSaved={(key) => key && setCategory(key)}
            />
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas (opcional)"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />

            {grupo && (
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={shareWithGroup}
                    onChange={(e) => setShareWithGroup(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Compartir con el grupo &ldquo;{grupo.name}&rdquo;
                  </span>
                </label>

                {shareWithGroup && (
                  <div className="mt-3 space-y-2.5">
                    <div className="relative">
                      <select
                        value={gastoPaidBy}
                        onChange={(e) => setGastoPaidBy(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-border bg-card py-2 pl-3 pr-10 text-sm outline-none focus:border-primary/50"
                      >
                        {acceptedGrupoMembers.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.user_id === currentUserId ? "Yo" : (m.display_name ?? m.email ?? m.user_id)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Participan:</p>
                      <div className="flex flex-wrap gap-2">
                        {acceptedGrupoMembers.map((m) => {
                          const checked = gastoParticipants.includes(m.user_id);
                          return (
                            <button
                              key={m.user_id}
                              type="button"
                              onClick={() => toggleParticipant(m.user_id)}
                              className={`rounded-xl border px-3 py-1 text-xs font-medium transition-colors ${
                                checked
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card text-muted-foreground"
                              }`}
                            >
                              {m.user_id === currentUserId ? "Yo" : (m.display_name ?? m.email)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              disabled={pending || !concepto || !amount || (shareWithGroup && gastoParticipants.length === 0)}
              onClick={submit}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-75"
            >
              <Plus className="h-4 w-4" /> Añadir gasto
            </button>
          </>
        )}
      </div>
    </section>
  );
}

const EXPENSES_PAGE_SIZE = 8;

function ExpensesList({ vac }: { vac: ActiveVac }) {
  const router = useRouter();
  const categories = useCategories();
  const vacCategories = React.useMemo(
    () => [...VAC_CATEGORIES, ...categories.filter((c) => c.custom)],
    [categories],
  );
  const [showNewCategory, setShowNewCategory] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editConcepto, setEditConcepto] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editNotas, setEditNotas] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(EXPENSES_PAGE_SIZE);

  function openEdit(e: ExpenseRow) {
    setEditId(e.id);
    setEditConcepto(e.concepto ?? "");
    setEditAmount(String(e.amount));
    setEditDate(e.occurred_at);
    setEditCategory(e.category ?? "");
    setEditNotas(e.notas ?? "");
  }

  function cancelEdit() { setEditId(null); }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await updateVacationExpense(editId, {
        concepto: editConcepto,
        amount: editAmount,
        occurred_at: editDate,
        category: editCategory || null,
        notas: editNotas || undefined,
      });
      if (res.ok) { toast.success("Gasto actualizado"); setEditId(null); router.refresh(); }
      else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      const res = await deleteVacationExpense(deleteId);
      if (res.ok) { toast.success("Gasto eliminado"); router.refresh(); }
      else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al eliminar");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Gastos del viaje</h3>
      {vac.expenses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aún no hay gastos en este viaje. Añade el primero.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/60">
          {vac.expenses.slice(0, visibleCount).map((e) => (
            <li key={e.id} className="min-w-0">
              {editId === e.id ? (
                <div className="space-y-2 py-3">
                  <input
                    value={editConcepto}
                    onChange={(ev) => setEditConcepto(ev.target.value)}
                    placeholder="Concepto"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(ev) => setEditAmount(ev.target.value)}
                      placeholder="Importe €"
                      className="w-1/2 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                    />
                    <DatePicker
                      value={editDate}
                      onChange={setEditDate}
                      showIcon={false}
                      formatStr="d MMM"
                      className="w-1/2 px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={editCategory}
                        onChange={(ev) => setEditCategory(ev.target.value)}
                        className="w-full appearance-none rounded-xl border border-border bg-card py-2 pl-3 pr-10 text-sm outline-none focus:border-primary/50"
                      >
                        <option value="">Categoría (opcional)</option>
                        {vacCategories.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      aria-label="Nueva categoría"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <CategoryFormDialog
                    open={showNewCategory}
                    onOpenChange={setShowNewCategory}
                    editing={null}
                    onSaved={(key) => key && setEditCategory(key)}
                  />
                  <input
                    value={editNotas}
                    onChange={(ev) => setEditNotas(ev.target.value)}
                    placeholder="Notas (opcional)"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={saving || !editConcepto || !editAmount}
                      onClick={saveEdit}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" /> Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-start gap-3 py-3.5 sm:items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <VacIcon category={e.category} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* fila 1: título + precio (mobile) */}
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{e.concepto ?? "Gasto"}</p>
                      <span className="shrink-0 text-sm font-bold text-foreground sm:hidden">{formatEUR(-e.amount, { sign: true })}</span>
                    </div>
                    {/* fila 2: fecha/notas + botones (mobile) */}
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtDay(e.occurred_at)}
                        {e.notas ? ` · ${e.notas}` : ""}
                      </p>
                      <div className="flex shrink-0 gap-1 sm:hidden">
                        <button
                          onClick={() => openEdit(e)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Editar gasto"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(e.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500"
                          aria-label="Eliminar gasto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* desktop: precio + botones fuera de la columna de texto */}
                  <span className="hidden shrink-0 text-sm font-bold text-foreground sm:block">{formatEUR(-e.amount, { sign: true })}</span>
                  <div className="hidden shrink-0 gap-1 sm:flex">
                    <button
                      onClick={() => openEdit(e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Editar gasto"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(e.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500"
                      aria-label="Eliminar gasto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {vac.expenses.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((v) => v + EXPENSES_PAGE_SIZE)}
          className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-sm font-semibold text-primary hover:underline"
        >
          Ver {Math.min(vac.expenses.length - visibleCount, EXPENSES_PAGE_SIZE)} más
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* Modal de confirmación de borrado */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">¿Eliminar gasto?</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
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
    if (Number(budget) < 0) { toast.error("El presupuesto no puede ser negativo"); return; }
    setPending(true);
    try {
      const res = await startVacation({
        name,
        budget: Number(budget),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (res.ok) {
        toast.success("Proyecto de vacaciones creado");
        setName("");
        setBudget("");
        setEndDate("");
        router.refresh();
      } else if (res.upgradeRequired) upgradeToast(res.error, router);
      else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al crear el viaje");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#F3D9C4] bg-card p-7 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: PALETTE.peach }} />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full opacity-40 blur-3xl" style={{ backgroundColor: PALETTE.lila }} />

      <div className="relative max-w-md">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.peach, color: "#C47C45" }}>
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
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Presupuesto €"
            aria-label="Presupuesto del viaje en euros"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Inicio</label>
              <DatePicker value={startDate} onChange={setStartDate} showIcon={false} formatStr="d MMM yyyy" className="mt-1 px-3 py-2.5" />
            </div>
            <div className="w-1/2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fin (opcional)</label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                showIcon={false}
                formatStr="d MMM yyyy"
                placeholder="Sin fecha"
                clearable
                className="mt-1 px-3 py-2.5 text-muted-foreground"
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
