"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ArrowDownRight, Banknote, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createIncome } from "@/app/dashboard/actions";
import { PALETTE } from "@/lib/constants";

const NEW_CATEGORY = "__new__";

export function AddMovementMenu({ incomeCategories }: { incomeCategories: string[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState(incomeCategories[0] ?? "Salario");
  const [newCategory, setNewCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = React.useState(false);

  function reset() {
    setAmount("");
    setCategory(incomeCategories[0] ?? "Salario");
    setNewCategory("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  const finalCategory = category === NEW_CATEGORY ? newCategory.trim() : category;

  async function save() {
    setPending(true);
    const res = await createIncome({
      amount: Number(amount),
      category: finalCategory,
      description,
      occurred_at: date,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Ingreso añadido");
      setOpen(false);
      reset();
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Añadir movimiento
            <ChevronDown className="h-4 w-4 opacity-80" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() => setOpen(true)}
            className="cursor-pointer gap-2 py-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}>
              <Banknote className="h-4 w-4" />
            </span>
            Añadir ingreso
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => router.push("/dashboard/anadir")}
            className="cursor-pointer gap-2 py-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ArrowDownRight className="h-4 w-4" />
            </span>
            Añadir gasto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo ingreso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                {incomeCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value={NEW_CATEGORY}>+ Nueva categoría…</option>
              </select>
              {category === NEW_CATEGORY && (
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nombre de la categoría"
                  className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción (opcional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Nómina de junio"
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <button
              disabled={pending || !amount || !finalCategory}
              onClick={save}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Guardar ingreso
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
