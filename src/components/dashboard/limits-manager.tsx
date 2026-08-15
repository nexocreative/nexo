"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, AlertTriangle, Ban, Bell, Info } from "lucide-react";
import { setGlobalBudget, upsertCategoryLimit } from "@/app/dashboard/actions";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatEUR } from "@/lib/format";
import { STATE_COLOR, type BudgetState } from "@/lib/constants";

interface Cat { key: string; label: string }
interface Row { cat: Cat; limit: number; spent: number; pct: number; state: BudgetState }

type Editing = { kind: "global"; limit: number | null } | { kind: "category"; cat: Cat; limit: number } | null;

export function LimitsManager({
  global,
  categories,
  unconfigured,
}: {
  global: { limit: number | null; spent: number; pct: number; state: BudgetState };
  categories: Row[];
  unconfigured: Cat[];
}) {
  const [editing, setEditing] = React.useState<Editing>(null);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <GlobalCard global={global} onEdit={() => setEditing({ kind: "global", limit: global.limit })} />

      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Límites por categoría</h3>
            <p className="text-sm text-muted-foreground">Define cuánto quieres gastar como máximo en cada una.</p>
          </div>
          <AlertsInfo />
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {categories.map((r) => (
            <CategoryLimitRow key={r.cat.key} row={r} onEdit={() => setEditing({ kind: "category", cat: r.cat, limit: r.limit })} />
          ))}
        </ul>

        {unconfigured.length > 0 && (
          <div className="mt-6 border-t border-border/60 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sin límite todavía
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {unconfigured.map((c) => (
                <CategoryLimitRow
                  key={c.key}
                  row={{ cat: c, limit: 0, spent: 0, pct: 0, state: "ok" }}
                  isNew
                  onEdit={() => setEditing({ kind: "category", cat: c, limit: 0 })}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <LimitDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function GlobalCard({
  global,
  onEdit,
}: {
  global: { limit: number | null; spent: number; pct: number; state: BudgetState };
  onEdit: () => void;
}) {
  const color = STATE_COLOR[global.state];

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Límite mensual total
          </p>
          <p className="mt-2 text-3xl font-extrabold text-foreground">
            {formatEUR(global.spent)}
            {global.limit !== null && (
              <span className="text-lg font-semibold text-muted-foreground"> / {formatEUR(global.limit)}</span>
            )}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          {global.limit === null ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {global.limit === null ? "Establecer límite" : "Editar"}
        </button>
      </div>

      {global.limit !== null && (
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, global.pct)}%`, backgroundColor: color }} />
        </div>
      )}
    </section>
  );
}

function CategoryLimitRow({ row, isNew = false, onEdit }: { row: Row; isNew?: boolean; onEdit: () => void }) {
  if (isNew) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-dashed border-border/70 p-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CategoryIcon category={row.cat.key} className="h-4 w-4" /></span>
          {row.cat.label}
        </span>
        <button onClick={onEdit} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <Plus className="h-4 w-4" /> Añadir
        </button>
      </div>
    );
  }

  const color = STATE_COLOR[row.state];

  return (
    <li className="list-none rounded-2xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CategoryIcon category={row.cat.key} className="h-4 w-4" /></span>
          {row.cat.label}
        </span>
        <button onClick={onEdit} className="shrink-0 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold text-foreground">{formatEUR(row.spent)}</span>
        <span className="text-muted-foreground"> / {formatEUR(row.limit)}</span>
      </p>
      {row.limit > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, row.pct)}%`, backgroundColor: color }} />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-semibold" style={{ color }}>{row.pct}%</span>
        </div>
      )}
    </li>
  );
}

function LimitDialog({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (editing) setValue(editing.kind === "global" ? String(editing.limit ?? "") : String(editing.limit || ""));
  }, [editing]);

  if (!editing) return null;

  const title = editing.kind === "global" ? "Límite mensual total" : `Límite de ${editing.cat.label}`;

  async function save() {
    if (!editing) return;
    setPending(true);
    try {
      const res =
        editing.kind === "global"
          ? await setGlobalBudget(Number(value))
          : await upsertCategoryLimit(editing.cat.key, Number(value));
      if (res.ok) {
        toast.success(editing.kind === "global" ? "Presupuesto global actualizado" : `Límite de ${editing.cat.label} actualizado`);
        router.refresh();
        onClose();
      } else toast.error(res.error);
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Importe mensual"
            aria-label="Importe mensual del límite"
            autoFocus
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <button
            disabled={pending}
            onClick={save}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlertsInfo() {
  const items = [
    { icon: Bell, color: STATE_COLOR.warning, title: "Aviso al 75%", desc: "Una notificación breve en pantalla." },
    { icon: AlertTriangle, color: STATE_COLOR.alert, title: "Alerta al 90%", desc: "Un aviso destacado en tu Resumen." },
    { icon: Ban, color: STATE_COLOR.blocked, title: "100% superado", desc: "Se marca como superado, pero puedes seguir registrando gastos con normalidad." },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cómo funcionan las alertas progresivas"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl">
        <p className="text-sm font-bold text-foreground">Alertas progresivas</p>
        <p className="text-xs text-muted-foreground">Nexo te avisa según te acercas al límite.</p>
        <ul className="mt-4 space-y-3">
          {items.map((it) => (
            <li key={it.title} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${it.color}22`, color: it.color }}>
                <it.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
