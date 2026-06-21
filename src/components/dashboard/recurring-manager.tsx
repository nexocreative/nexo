"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Repeat, Plus, Pencil, Trash2, Banknote, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { CATEGORIES } from "@/lib/constants";
import { formatEUR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
} from "@/app/dashboard/actions";

export interface RecItem {
  id: string;
  type: "expense" | "income";
  amount: number;
  category: string | null;
  description: string | null;
  day_of_month: number;
  active: boolean;
}

type Editing = RecItem | "new" | null;

export function RecurringManager({ items }: { items: RecItem[] }) {
  const [editing, setEditing] = React.useState<Editing>(null);

  const expenses = items.filter((r) => r.type === "expense");
  const incomes = items.filter((r) => r.type === "income");
  const fixedMonthly = expenses
    .filter((r) => r.active)
    .reduce((a, r) => a + Number(r.amount), 0);

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
            <Repeat className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">Movimientos fijos</h3>
            <p className="text-xs text-muted-foreground">Recurrentes cada mes</p>
          </div>
        </div>
        <button
          onClick={() => setEditing("new")}
          aria-label="Añadir gasto fijo"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-muted/60 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Total mensual fijo
        </p>
        <p className="mt-0.5 text-xl font-extrabold text-foreground">{formatEUR(fixedMonthly)}</p>
      </div>

      {expenses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no tienes movimientos fijos. Añade tus suscripciones y pagos recurrentes.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {expenses.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setEditing(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-muted/50",
                  !r.active && "opacity-50",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CategoryIcon category={r.category} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Día {r.day_of_month} de cada mes{!r.active && " · pausado"}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">{formatEUR(Number(r.amount))}</span>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {incomes.length > 0 && (
        <>
          <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ingresos fijos
          </h4>
          <ul className="mt-3 space-y-2">
            {incomes.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setEditing(r)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-muted/50",
                    !r.active && "opacity-50",
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Banknote className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">Día {r.day_of_month} · confirmación mensual</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatEUR(Number(r.amount))}</span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <RecurringDialog editing={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

function RecurringDialog({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const router = useRouter();
  const isNew = editing === "new";
  const item = editing && editing !== "new" ? editing : null;

  const [type, setType] = React.useState<"expense" | "income">("expense");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("suscripciones");
  const [day, setDay] = React.useState("1");
  const [active, setActive] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);

  // Sincroniza el formulario al abrir
  React.useEffect(() => {
    if (item) {
      setType(item.type);
      setDescription(item.description ?? "");
      setAmount(String(item.amount));
      setCategory(item.category ?? "otros");
      setDay(String(item.day_of_month));
      setActive(item.active);
    } else if (isNew) {
      setType("expense");
      setDescription("");
      setAmount("");
      setCategory("suscripciones");
      setDay("1");
      setActive(true);
    }
    setConfirmDel(false);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setPending(true);
    const payload = {
      type,
      description,
      amount: Number(amount),
      category: type === "income" ? null : category,
      day_of_month: Number(day),
      active,
    };
    const res = item ? await updateRecurring(item.id, payload) : await createRecurring(payload);
    setPending(false);
    if (res.ok) {
      const label = type === "income" ? "Ingreso fijo" : "Gasto fijo";
      toast.success(item ? `${label} actualizado` : `${label} añadido`);
      onClose();
      router.refresh();
    } else toast.error(res.error);
  }

  async function remove() {
    if (!item) return;
    setPending(true);
    const res = await deleteRecurring(item.id);
    setPending(false);
    if (res.ok) {
      toast.success("Gasto fijo eliminado");
      onClose();
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar" : "Nuevo"} {type === "income" ? "ingreso" : "gasto"} fijo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Tipo */}
          <div className="flex rounded-xl bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {t === "expense" ? "Gasto fijo" : "Ingreso fijo"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Concepto</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Spotify, Alquiler, Nómina"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Importe</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="w-28">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Día (1-28)</label>
              <input
                type="number"
                min={1}
                max={28}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          {type === "expense" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                {CATEGORIES.filter((c) => c.key !== "vacaciones").map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {item && (
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Activo</p>
                <p className="text-xs text-muted-foreground">Si lo pausas, deja de contar como fijo</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              disabled={pending || !description || !amount}
              onClick={save}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> {item ? "Guardar" : "Añadir"}
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
              <p className="text-sm font-semibold text-foreground">¿Eliminar &ldquo;{item.description}&rdquo;?</p>
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
