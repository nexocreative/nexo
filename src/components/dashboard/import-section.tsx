"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, Loader2, Check, AlertTriangle, CalendarClock, ChevronDown } from "lucide-react";
import { CATEGORIES, PALETTE } from "@/lib/constants";
import { createTransactionsBulk } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ApiRow {
  fila: number;
  fecha: string | null;
  descripcion: string;
  importe: number;
  tipo: "expense" | "income";
  categoria: string | null;
  posible_duplicado: boolean;
  fecha_invalida: boolean;
}

interface ImportRow {
  fila: number;
  fecha: string;
  descripcion: string;
  importe: string;
  tipo: "expense" | "income";
  categoria: string;
  posibleDuplicado: boolean;
  incluir: boolean;
}

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as string[];

// Ancho de cada columna de la tabla de revisión: fijo según lo que
// necesita su contenido, salvo Descripción, que se lleva el resto.
const REVIEW_GRID_COLS = "2rem 7rem minmax(14rem,1fr) 9rem 10rem 8.5rem";

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function ImportarSection() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [rows, setRows] = React.useState<ImportRow[]>([]);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, rows]);

  async function analyzeFile(file: File) {
    setAnalyzing(true);
    setRows([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "No se pudo analizar el extracto"); return; }
      const parsed: ImportRow[] = (json.rows as ApiRow[]).map((r) => ({
        fila: r.fila,
        fecha: r.fecha ?? "",
        descripcion: r.descripcion,
        importe: r.importe ? String(r.importe) : "",
        tipo: r.tipo,
        categoria: r.tipo === "income" ? (r.categoria ?? "") : (r.categoria ?? "otros"),
        posibleDuplicado: r.posible_duplicado,
        incluir: !r.posible_duplicado && !r.fecha_invalida,
      }));
      setRows(parsed);
      const dupCount = parsed.filter((r) => r.posibleDuplicado).length;
      toast.success(
        dupCount > 0
          ? `${parsed.length} movimientos detectados · ${dupCount} posibles duplicados`
          : `${parsed.length} movimientos detectados`,
      );
    } catch { toast.error("Error de conexión al analizar el extracto"); }
    finally { setAnalyzing(false); }
  }

  function updateRow(index: number, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  const included = rows.filter((r) => r.incluir);
  const total = included.reduce((sum, r) => sum + (Number(r.importe) || 0) * (r.tipo === "income" ? 1 : -1), 0);

  async function confirmImport() {
    if (included.length === 0) { toast.error("Selecciona al menos un movimiento"); return; }
    const invalidDate = included.find((r) => !isValidDate(r.fecha));
    if (invalidDate) { toast.error("Revisa la fecha de los movimientos seleccionados"); return; }
    const invalidAmount = included.find((r) => !(Number(r.importe) > 0));
    if (invalidAmount) { toast.error("Revisa el importe de los movimientos seleccionados"); return; }

    setPending(true);
    const res = await createTransactionsBulk(
      included.map((r) => ({
        type: r.tipo,
        amount: Number(r.importe),
        category: r.tipo === "expense" ? r.categoria : (r.categoria.trim() || undefined),
        description: r.descripcion || undefined,
        occurred_at: r.fecha,
        source: "import" as const,
      })),
    );
    setPending(false);
    if (res.ok) {
      toast.success(`${res.inserted ?? included.length} movimientos importados`);
      router.push("/dashboard/movimientos");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-bold tracking-tight">Extracto bancario</h2>
        <p className="mt-1 text-sm text-muted-foreground">
         Importa un archivo Excel o CSV de tu banco. La IA detectará los movimientos automáticamente y podrás revisarlos y editarlos antes de importarlos.
        </p>
        <div className="mt-4 rounded-3xl border border-dashed border-primary/30 bg-accent/40 p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }}
          />
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}>
            {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileSpreadsheet className="h-6 w-6" />}
          </span>
          <p className="mt-4 text-sm font-semibold text-foreground">
            {analyzing ? "Analizando el extracto con IA…" : "Sube el extracto de tu banco"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Excel o CSV (.xlsx, .xls, .csv) · máx. 5 MB</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={analyzing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {analyzing ? "Procesando…" : "Subir archivo"}
          </button>
        </div>
      </section>

      {rows.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">Revisa los movimientos</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, incluir: true })))}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Seleccionar todos
              </button>
              <button
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, incluir: false })))}
                className="text-xs font-semibold text-muted-foreground hover:underline"
              >
                Deseleccionar todos
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="overflow-x-auto rounded-3xl border border-border/60 bg-card shadow-sm"
            >
            <div className="min-w-[900px] text-sm" role="table">
              <div
                role="row"
                className="grid gap-x-4 bg-muted/40 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                style={{ gridTemplateColumns: REVIEW_GRID_COLS }}
              >
                <span role="columnheader" />
                <span role="columnheader">Importe</span>
                <span role="columnheader">Descripción</span>
                <span role="columnheader">Fecha</span>
                <span role="columnheader">Tipo</span>
                <span role="columnheader">Categoría</span>
              </div>
              <div className="divide-y divide-border/60">
                {rows.map((r, i) => {
                  const dateInvalid = !isValidDate(r.fecha);
                  return (
                    <div
                      key={i}
                      role="row"
                      className="grid items-center gap-x-4 px-3 py-2"
                      style={{ gridTemplateColumns: REVIEW_GRID_COLS }}
                    >
                      <div role="cell">
                        <label className="relative flex h-4 w-4 cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={r.incluir}
                            onChange={(e) => updateRow(i, { incluir: e.target.checked })}
                            className="peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-border checked:border-primary checked:bg-primary"
                          />
                          <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
                        </label>
                      </div>
                      <div role="cell">
                        <div className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5">
                          <input
                            type="number"
                            step="0.01"
                            value={r.importe}
                            onChange={(e) => updateRow(i, { importe: e.target.value })}
                            className="min-w-0 flex-1 bg-transparent text-right text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-muted-foreground">€</span>
                        </div>
                      </div>
                      <div role="cell">
                        <input
                          value={r.descripcion}
                          onChange={(e) => updateRow(i, { descripcion: e.target.value })}
                          className="w-full rounded-lg border border-border bg-transparent px-2 py-1.5 text-xs outline-none"
                        />
                        {r.posibleDuplicado && (
                          <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> Posible duplicado
                          </span>
                        )}
                      </div>
                      <div role="cell">
                        <input
                          type="date"
                          value={r.fecha}
                          onChange={(e) => updateRow(i, { fecha: e.target.value })}
                          className={cn(
                            "w-full rounded-lg border bg-transparent px-2 py-1.5 text-xs outline-none",
                            dateInvalid ? "border-destructive/60" : "border-border",
                          )}
                        />
                        {dateInvalid && (
                          <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-destructive">
                            <CalendarClock className="h-3 w-3" /> Revisa la fecha
                          </span>
                        )}
                      </div>
                      <div role="cell">
                        <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-border text-xs font-semibold">
                          <button
                            onClick={() => updateRow(i, { tipo: "expense", categoria: CATEGORY_KEYS.includes(r.categoria) ? r.categoria : "otros" })}
                            className={cn(
                              "w-[68px] py-1.5 text-center transition-colors",
                              r.tipo === "expense" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground",
                            )}
                          >
                            Gasto
                          </button>
                          <button
                            onClick={() => updateRow(i, { tipo: "income", categoria: CATEGORY_KEYS.includes(r.categoria) ? "" : r.categoria })}
                            className={cn(
                              "w-[68px] py-1.5 text-center transition-colors",
                              r.tipo === "income" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground",
                            )}
                          >
                            Ingreso
                          </button>
                        </div>
                      </div>
                      <div role="cell">
                        {r.tipo === "expense" ? (
                          <div className="relative">
                            <select
                              value={r.categoria}
                              onChange={(e) => updateRow(i, { categoria: e.target.value })}
                              className="w-full appearance-none rounded-lg border border-border bg-transparent py-1.5 pl-2 pr-7 text-xs outline-none"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c.key} value={c.key}>{c.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        ) : (
                          <input
                            value={r.categoria}
                            onChange={(e) => updateRow(i, { categoria: e.target.value })}
                            placeholder="Ej. Nómina"
                            className="w-full rounded-lg border border-border bg-transparent px-2 py-1.5 text-xs outline-none"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {canScrollRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-3xl bg-gradient-to-l from-card to-transparent" />
          )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{included.length}</span> de {rows.length} movimientos seleccionados · Total{" "}
              <span className="font-bold text-foreground">{formatEUR(total)}</span>
            </p>
            <button
              disabled={pending || included.length === 0}
              onClick={confirmImport}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Importar seleccionados
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
