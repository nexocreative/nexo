"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palmtree, Plus, Plane, Check, Luggage, Camera, Mic, PenLine, Upload, Loader2, Square, BedDouble, Bus, Car, UtensilsCrossed, Ticket, Gamepad2, ShoppingBag, Shield, Package, Pencil, Trash2, X, type LucideIcon } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { startVacation, closeVacation, addVacationExpense, deleteVacationExpense, updateVacationExpense } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  expenses: ExpenseRow[];
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
  const [detail, setDetail] = React.useState<ClosedVac | null>(null);

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
              <button
                key={v.id}
                onClick={() => setDetail(v)}
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

                {detail.expenses.length === 0 ? (
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
  const remaining = vac.budget - vac.spent;

  async function close() {
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

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              <Check className="h-4 w-4" /> Cerrar viaje y contabilizar
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-border/70 bg-white/80 p-4 backdrop-blur-sm">
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
  const Icon = (category && VAC_CAT_MAP[category]?.icon) ?? Package;
  return <Icon className={className} />;
}

type VacMethod = "photo" | "voice" | "manual";

const vacMethods: { key: VacMethod; label: string; icon: typeof Camera; bg: string; fg: string }[] = [
  { key: "photo", label: "Ticket", icon: Camera, bg: PALETTE.mintSoft, fg: PALETTE.mintInk },
  { key: "voice", label: "Voz", icon: Mic, bg: PALETTE.lilaSoft, fg: PALETTE.lilaInk },
  { key: "manual", label: "Manual", icon: PenLine, bg: PALETTE.peachSoft, fg: PALETTE.peachInk },
];

function AddExpenseCard({ vacationId }: { vacationId: string }) {
  const router = useRouter();
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
      if (!res.ok) { toast.error(json.error ?? "No se pudo analizar el ticket"); return; }
      const d = json.data;
      if (d.comercio) setConcepto(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.categoria) setCategory(d.categoria);
      if (d.fecha) setDate(d.fecha);
      setDetected(true);
      toast.success("Ticket analizado · revisa los datos");
    } catch { toast.error("Error de conexión al analizar el ticket"); }
    finally { setAnalyzing(false); }
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
      if (!res.ok) { toast.error(json.error ?? "No se pudo procesar la voz"); return; }
      const d = json.data;
      if (d.comercio) setConcepto(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.categoria) setCategory(d.categoria);
      if (d.fecha) setDate(d.fecha);
      setDetected(true);
      toast.success(`Entendido: "${json.transcript}"`);
    } catch { toast.error("Error de conexión al procesar la voz"); }
    finally { setAnalyzing(false); }
  }

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
      setConcepto(""); setAmount(""); setNotas(""); setCategory("");
      setDetected(false); setMethod("manual");
      router.refresh();
    } else toast.error(res.error);
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
              {VAC_CATEGORIES.map((c) => (
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
          </>
        )}
      </div>
    </section>
  );
}

function ExpensesList({ vac }: { vac: ActiveVac }) {
  const router = useRouter();
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editConcepto, setEditConcepto] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editNotas, setEditNotas] = React.useState("");
  const [saving, setSaving] = React.useState(false);

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
    const res = await updateVacationExpense(editId, {
      concepto: editConcepto,
      amount: editAmount,
      occurred_at: editDate,
      category: editCategory || null,
      notas: editNotas || undefined,
    });
    setSaving(false);
    if (res.ok) { toast.success("Gasto actualizado"); setEditId(null); router.refresh(); }
    else toast.error(res.error);
  }

  async function remove(id: string) {
    const res = await deleteVacationExpense(id);
    if (res.ok) { toast.success("Gasto eliminado"); router.refresh(); }
    else toast.error(res.error);
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Gastos del viaje</h3>
      {vac.expenses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aún no hay gastos en este viaje. Añade el primero.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/60">
          {vac.expenses.map((e) => (
            <li key={e.id}>
              {editId === e.id ? (
                /* Formulario de edición inline */
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
                    <input
                      type="date"
                      value={editDate}
                      onChange={(ev) => setEditDate(ev.target.value)}
                      className="w-1/2 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                    />
                  </div>
                  <select
                    value={editCategory}
                    onChange={(ev) => setEditCategory(ev.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                  >
                    <option value="">Categoría (opcional)</option>
                    {VAC_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
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
                /* Fila normal */
                <div className="flex items-center gap-4 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <VacIcon category={e.category} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.concepto ?? "Gasto"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {fmtDay(e.occurred_at)}
                      {e.category && VAC_CAT_MAP[e.category] ? ` · ${VAC_CAT_MAP[e.category].label}` : ""}
                      {e.notas ? ` · ${e.notas}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-foreground">{formatEUR(-e.amount, { sign: true })}</span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Editar gasto"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(e.id)}
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
