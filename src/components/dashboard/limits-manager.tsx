"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Plus, AlertTriangle, Ban, Bell } from "lucide-react";
import { setGlobalBudget, upsertCategoryLimit } from "@/app/dashboard/actions";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { formatEUR } from "@/lib/format";
import { STATE_COLOR, type BudgetState } from "@/lib/constants";

interface Cat { key: string; label: string }
interface Row { cat: Cat; limit: number; spent: number; pct: number; state: BudgetState }

export function LimitsManager({
  global,
  categories,
  unconfigured,
}: {
  global: { limit: number | null; spent: number; pct: number; state: BudgetState };
  categories: Row[];
  unconfigured: Cat[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <GlobalCard global={global} />

        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Límites por categoría</h3>
          <p className="text-sm text-muted-foreground">Define cuánto quieres gastar como máximo en cada una.</p>
          <ul className="mt-5 space-y-5">
            {categories.map((r) => (
              <CategoryLimitRow key={r.cat.key} row={r} />
            ))}
          </ul>

          {unconfigured.length > 0 && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sin límite todavía
              </p>
              <div className="space-y-3">
                {unconfigured.map((c) => (
                  <CategoryLimitRow
                    key={c.key}
                    row={{ cat: c, limit: 0, spent: 0, pct: 0, state: "ok" }}
                    isNew
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <AlertsLegend />
      </div>
    </div>
  );
}

function GlobalCard({ global }: { global: { limit: number | null; spent: number; pct: number; state: BudgetState } }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(global.limit === null);
  const [value, setValue] = React.useState(String(global.limit ?? ""));
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const res = await setGlobalBudget(Number(value));
    setPending(false);
    if (res.ok) {
      toast.success("Presupuesto global actualizado");
      setEditing(false);
      router.refresh();
    } else toast.error(res.error);
  }

  const color = STATE_COLOR[global.state];

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Límite global mensual
          </p>
          <p className="mt-2 text-3xl font-extrabold text-foreground">
            {formatEUR(global.spent)}
            {global.limit !== null && (
              <span className="text-lg font-semibold text-muted-foreground"> / {formatEUR(global.limit)}</span>
            )}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
        )}
      </div>

      {global.limit !== null && (
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, global.pct)}%`, backgroundColor: color }} />
        </div>
      )}

      {editing && (
        <div className="mt-4 flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Importe mensual"
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
      )}
    </section>
  );
}

function CategoryLimitRow({ row, isNew = false }: { row: Row; isNew?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(String(row.limit || ""));
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const res = await upsertCategoryLimit(row.cat.key, Number(value));
    setPending(false);
    if (res.ok) {
      toast.success(`Límite de ${row.cat.label} actualizado`);
      setEditing(false);
      router.refresh();
    } else toast.error(res.error);
  }

  if (isNew && !editing) {
    return (
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CategoryIcon category={row.cat.key} className="h-4 w-4" /></span>
          {row.cat.label}
        </span>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <Plus className="h-4 w-4" /> Añadir límite
        </button>
      </div>
    );
  }

  const color = STATE_COLOR[row.state];

  return (
    <li className="list-none">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CategoryIcon category={row.cat.key} className="h-4 w-4" /></span>
          {row.cat.label}
        </span>
        {!editing ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{formatEUR(row.spent)}</span>
            <span className="text-muted-foreground">/ {formatEUR(row.limit)}</span>
            <button onClick={() => setEditing(true)} className="ml-1 text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="w-24 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:border-primary/50"
            />
            <button disabled={pending} onClick={save} className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Check className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>
      {!isNew && row.limit > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, row.pct)}%`, backgroundColor: color }} />
          </div>
          <span className="w-10 text-right text-xs font-semibold" style={{ color }}>{row.pct}%</span>
        </div>
      )}
    </li>
  );
}

function AlertsLegend() {
  const items = [
    { icon: Bell, color: STATE_COLOR.warning, title: "Aviso al 75%", desc: "Toast suave para que estés al tanto." },
    { icon: AlertTriangle, color: STATE_COLOR.alert, title: "Alerta al 90%", desc: "Card destacada en el dashboard." },
    { icon: Ban, color: STATE_COLOR.blocked, title: "Bloqueo al 100%", desc: "Aviso visual de límite superado." },
  ];
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Alertas progresivas</h3>
      <p className="text-sm text-muted-foreground">Nexo te avisa según te acercas al límite.</p>
      <ul className="mt-5 space-y-4">
        {items.map((it) => (
          <li key={it.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${it.color}22`, color: it.color }}>
              <it.icon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-2xl bg-accent/60 p-4">
        <p className="text-xs font-semibold text-primary">💡 Recomendación IA</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Las recomendaciones basadas en tus patrones (Claude API) aparecerán aquí comparando con meses anteriores.
        </p>
      </div>
    </section>
  );
}
