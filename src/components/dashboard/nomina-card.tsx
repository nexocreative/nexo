"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Check, X } from "lucide-react";
import { confirmNomina } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";

export function NominaCard({ expected }: { expected: number }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [amount, setAmount] = React.useState(String(expected));
  const [pending, setPending] = React.useState(false);

  async function submit(isUsual: boolean) {
    setPending(true);
    const res = await confirmNomina({
      isUsual,
      amount: isUsual ? undefined : Number(amount),
    });
    setPending(false);
    if (res.ok) {
      toast.success("Nómina registrada en tus ingresos del mes");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-accent to-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Banknote className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Confirmación de nómina</p>
          <p className="text-xs text-muted-foreground">Tu ingreso fijo de este mes</p>
        </div>
      </div>

      {!editing ? (
        <>
          <p className="mt-4 text-sm text-foreground">
            ¿Tu nómina de este mes ha sido la habitual de{" "}
            <span className="font-bold">{formatEUR(expected)}</span>?
          </p>
          <div className="mt-4 flex gap-2">
            <button
              disabled={pending}
              onClick={() => submit(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Sí, la habitual
            </button>
            <button
              disabled={pending}
              onClick={() => setEditing(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              <X className="h-4 w-4" /> No
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">
            Importe real recibido
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() => submit(false)}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Guardar importe
            </button>
            <button
              disabled={pending}
              onClick={() => setEditing(false)}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
