"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, Camera, Mic, MessageSquare, Repeat, PenLine, Banknote, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { deleteTransaction } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

export interface MovementRow {
  id: string;
  type: "expense" | "income";
  amount: number;
  category: string | null;
  merchant: string | null;
  description: string | null;
  occurred_at: string;
  source: string;
  receipt_url: string | null;
  ai_confidence: number | null;
  cat: { key: string; label: string };
}

const SOURCE: Record<string, { label: string; icon: typeof Camera }> = {
  manual: { label: "Manual", icon: PenLine },
  photo: { label: "Foto ticket", icon: Camera },
  voice: { label: "Voz", icon: Mic },
  chat: { label: "Chat", icon: MessageSquare },
  recurring: { label: "Recurrente", icon: Repeat },
};

function RowIcon({ row }: { row: MovementRow }) {
  if (row.type === "income") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}>
        <Banknote className="h-5 w-5" />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <CategoryIcon category={row.cat.key} className="h-5 w-5" />
    </span>
  );
}

export function MovementsList({ rows }: { rows: MovementRow[] }) {
  const [open, setOpen] = React.useState<MovementRow | null>(null);

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay movimientos con estos filtros.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border/60">
        {rows.map((t) => {
          const src = SOURCE[t.source] ?? SOURCE.manual;
          return (
            <li key={t.id}>
              <button
                onClick={() => setOpen(t)}
                className="flex w-full items-center gap-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <RowIcon row={t} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t.merchant ?? t.description ?? t.cat.label}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <src.icon className="h-3 w-3" />
                    {src.label}
                    {t.receipt_url && <Paperclip className="h-3 w-3" />}
                  </p>
                </div>
                <span
                  className="w-24 shrink-0 text-right text-sm font-bold"
                  style={{ color: t.type === "income" ? PALETTE.mintInk : "hsl(var(--foreground))" }}
                >
                  {formatEUR(t.type === "income" ? t.amount : -t.amount, { sign: true })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          {open && <Detail row={open} onClose={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ row, onClose }: { row: MovementRow; onClose: () => void }) {
  const src = SOURCE[row.source] ?? SOURCE.manual;
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  async function remove() {
    setPending(true);
    const res = await deleteTransaction(row.id);
    setPending(false);
    if (res.ok) {
      toast.success("Movimiento eliminado");
      onClose();
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <RowIcon row={row} />
          {row.merchant ?? row.description ?? row.cat.label}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p
          className="text-3xl font-extrabold"
          style={{ color: row.type === "income" ? PALETTE.mintInk : "hsl(var(--foreground))" }}
        >
          {formatEUR(row.type === "income" ? row.amount : -row.amount, { sign: true })}
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Tipo" value={row.type === "income" ? "Ingreso" : "Gasto"} />
          <Field label="Categoría" value={row.type === "income" ? "—" : row.cat.label} />
          <Field label="Fecha" value={new Date(row.occurred_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} />
          <Field label="Origen" value={src.label} />
          {row.ai_confidence != null && (
            <Field label="Confianza IA" value={`${Math.round(row.ai_confidence * 100)}%`} />
          )}
        </dl>
        {row.description && row.description !== row.merchant && (
          <p className="text-sm text-muted-foreground">{row.description}</p>
        )}
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {row.receipt_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.receipt_url} alt="Ticket" className="mx-auto max-h-60 rounded-lg" />
          ) : (
            "Sin ticket adjunto"
          )}
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-[#C2496B] transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" /> Eliminar movimiento
          </button>
        ) : (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-foreground">
              ¿Eliminar este movimiento?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.merchant ?? row.description ?? row.cat.label} ·{" "}
              {formatEUR(row.type === "income" ? row.amount : -row.amount, { sign: true })}. Esta acción no se puede deshacer.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                disabled={pending}
                onClick={remove}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#C2496B] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Sí, eliminar
              </button>
              <button
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}
