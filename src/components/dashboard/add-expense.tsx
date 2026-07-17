"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Mic, PenLine, Receipt, Check, Upload, Loader2, Square, TrendingUp, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { CATEGORIES, PALETTE, getCategory } from "@/lib/constants";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { ImportarSection } from "@/components/dashboard/import-section";
import { createTransaction, createIncome } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { cn } from "@/lib/utils";

type ExpenseMethod = "photo" | "voice" | "manual";
type IncomeMethod = "voice" | "manual";

const NEW_CATEGORY = "__new__";

const expenseMethods: { key: ExpenseMethod; title: string; desc: string; icon: typeof Camera; bg: string; fg: string }[] = [
  { key: "photo", title: "Foto Ticket", desc: "GPT-4o Vision extrae los datos del recibo.", icon: Camera, bg: PALETTE.mintSoft, fg: PALETTE.mintInk },
  { key: "voice", title: "Por Voz", desc: "Whisper transcribe y GPT-4o estructura.", icon: Mic, bg: PALETTE.lilaSoft, fg: PALETTE.lilaInk },
  { key: "manual", title: "Manual", desc: "Introduce los detalles paso a paso.", icon: PenLine, bg: PALETTE.peachSoft, fg: PALETTE.peachInk },
];

const incomeMethods: { key: IncomeMethod; title: string; desc: string; icon: typeof Mic; bg: string; fg: string }[] = [
  { key: "voice", title: "Por Voz", desc: "Whisper transcribe y GPT-4o estructura.", icon: Mic, bg: PALETTE.lilaSoft, fg: PALETTE.lilaInk },
  { key: "manual", title: "Manual", desc: "Introduce los detalles paso a paso.", icon: PenLine, bg: PALETTE.peachSoft, fg: PALETTE.peachInk },
];

export function AddExpense({ incomeCategories }: { incomeCategories: string[] }) {
  const [tab, setTab] = React.useState<"gastos" | "ingresos" | "importar">("gastos");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tab === "importar" ? (
          <button
            onClick={() => setTab("gastos")}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        ) : (
          <>
            <div className="flex w-fit rounded-xl border border-border/60 bg-muted/40 p-1 gap-1">
              <button
                onClick={() => setTab("gastos")}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                  tab === "gastos" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Gastos
              </button>
              <button
                onClick={() => setTab("ingresos")}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                  tab === "ingresos" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Ingresos
              </button>
            </div>
            <button
              onClick={() => setTab("importar")}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              <FileSpreadsheet className="h-4 w-4" /> Importar extracto
            </button>
          </>
        )}
      </div>

      {tab === "gastos" ? (
        <GastosSection />
      ) : tab === "ingresos" ? (
        <IngresosSection incomeCategories={incomeCategories} />
      ) : (
        <ImportarSection />
      )}
    </div>
  );
}

function GastosSection() {
  const router = useRouter();
  const [method, setMethod] = React.useState<ExpenseMethod>("manual");
  const [category, setCategory] = React.useState("supermercado");
  const [merchant, setMerchant] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [detected, setDetected] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [receiptPath, setReceiptPath] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  function pickMethod(m: ExpenseMethod) {
    setMethod(m);
    setDetected(false);
    setReceiptPath(null);
    setPreview(null);
    setRecording(false);
    if (m === "manual") { setMerchant(""); setAmount(""); }
  }

  async function analyzePhoto(file: File) {
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ticket", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "No se pudo analizar el ticket"); return; }
      const d = json.data;
      if (d.comercio) setMerchant(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.categoria) setCategory(d.categoria);
      if (d.fecha) setDate(d.fecha);
      setReceiptPath(json.receiptPath ?? null);
      setDetected(true);
      toast.success("Ticket analizado con IA · revisa los datos");
    } catch { toast.error("Error de conexión al analizar el ticket"); }
    finally { setAnalyzing(false); }
  }

  async function startRecordingExpense() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        analyzeVoiceExpense(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch { toast.error("No se pudo acceder al micrófono. Revisa los permisos."); }
  }

  function stopRecordingExpense() { mediaRecorderRef.current?.stop(); setRecording(false); }

  async function analyzeVoiceExpense(blob: Blob) {
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      const res = await fetch("/api/voice", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "No se pudo procesar la voz"); return; }
      const d = json.data;
      if (d.comercio) setMerchant(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.categoria) setCategory(d.categoria);
      if (d.fecha) setDate(d.fecha);
      setDetected(true);
      toast.success(`Entendido: "${json.transcript}"`);
    } catch { toast.error("Error de conexión al procesar la voz"); }
    finally { setAnalyzing(false); }
  }

  async function confirm() {
    if (!amount || Number(amount) <= 0) { toast.error("Indica un importe válido"); return; }
    setPending(true);
    const res = await createTransaction({
      type: "expense",
      amount: Number(amount),
      category,
      merchant: merchant || undefined,
      occurred_at: date,
      source: method,
      receipt_url: receiptPath,
    });
    setPending(false);
    if (res.ok) { toast.success("Gasto registrado"); router.push("/dashboard/movimientos"); }
    else toast.error(res.error);
  }

  const showCapture = method !== "manual" && !detected;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold tracking-tight">Método de entrada</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
          {expenseMethods.map((m) => (
            <button
              key={m.key}
              onClick={() => pickMethod(m.key)}
              className={cn(
                "flex flex-col items-center rounded-2xl border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 sm:rounded-3xl sm:p-6",
                method === m.key ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl" style={{ backgroundColor: m.bg, color: m.fg }}>
                <m.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <p className="mt-2 text-xs font-bold leading-tight text-primary sm:mt-4 sm:text-base">{m.title}</p>
              <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">{m.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          {showCapture && method === "photo" ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-accent/40 p-8 text-center">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzePhoto(f); }}
              />
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
                {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {analyzing ? "Analizando el ticket con IA…" : "Sube o haz una foto del ticket"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">GPT-4o Vision extraerá comercio, importe, fecha y categoría.</p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={analyzing}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" /> {analyzing ? "Procesando…" : "Subir / hacer foto"}
              </button>
            </div>
          ) : showCapture && method === "voice" ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-accent/40 p-8 text-center">
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
                {recording && <span className="absolute inset-0 animate-ping rounded-2xl" style={{ backgroundColor: PALETTE.lila, opacity: 0.4 }} />}
                {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="relative h-6 w-6" />}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {analyzing ? "Transcribiendo con IA…" : recording ? "Escuchando… habla ahora" : "Pulsa y di tu gasto en alto"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ej: &ldquo;Gasolinera, 50 euros, hoy&rdquo;. Whisper transcribe y GPT-4o extrae los datos.</p>
              {!recording ? (
                <button
                  onClick={startRecordingExpense}
                  disabled={analyzing}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  <Mic className="h-4 w-4" /> {analyzing ? "Procesando…" : "Empezar a hablar"}
                </button>
              ) : (
                <button
                  onClick={stopRecordingExpense}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C2496B] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Square className="h-4 w-4" /> Detener y analizar
                </button>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Importe</label>
                <div className="mt-1.5 flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent py-3 text-2xl font-extrabold outline-none"
                  />
                  <span className="text-2xl font-extrabold text-muted-foreground">€</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comercio</label>
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Ej. Mercadona"
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    category === c.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  <CategoryIcon category={c.key} className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">Previsualización</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-start justify-between p-6" style={{ background: `linear-gradient(135deg, ${PALETTE.lilaSoft}, ${PALETTE.mintSoft})` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {detected ? "Gasto detectado" : "Resumen del gasto"}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">{amount ? formatEUR(Number(amount)) : "—"}</p>
              </div>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Ticket" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70" style={{ color: PALETTE.lilaInk }}>
                  <Receipt className="h-5 w-5" />
                </span>
              )}
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Comercio" value={merchant || "—"} />
                <Field label="Fecha" value={new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Categoría</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <CategoryIcon category={category} className="h-4 w-4 text-muted-foreground" />
                  {getCategory(category).label}
                </p>
              </div>
              <button
                disabled={pending}
                onClick={confirm}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> Confirmar gasto
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function IngresosSection({ incomeCategories }: { incomeCategories: string[] }) {
  const router = useRouter();
  const [method, setMethod] = React.useState<IncomeMethod>("manual");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = React.useState(incomeCategories[0] ?? "Salario");
  const [newCategory, setNewCategory] = React.useState("");
  const [detected, setDetected] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  function pickMethod(m: IncomeMethod) {
    setMethod(m);
    setDetected(false);
    setRecording(false);
    if (m === "manual") { setDescription(""); setAmount(""); }
  }

  async function startRecordingIncome() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        analyzeVoiceIncome(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch { toast.error("No se pudo acceder al micrófono. Revisa los permisos."); }
  }

  function stopRecordingIncome() { mediaRecorderRef.current?.stop(); setRecording(false); }

  async function analyzeVoiceIncome(blob: Blob) {
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      const res = await fetch("/api/voice", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "No se pudo procesar la voz"); return; }
      const d = json.data;
      if (d.comercio) setDescription(d.comercio);
      if (d.importe) setAmount(String(d.importe));
      if (d.fecha) setDate(d.fecha);
      setDetected(true);
      toast.success(`Entendido: "${json.transcript}"`);
    } catch { toast.error("Error de conexión al procesar la voz"); }
    finally { setAnalyzing(false); }
  }

  const finalCategory = category === NEW_CATEGORY ? newCategory.trim() : category;

  async function confirm() {
    if (!amount || Number(amount) <= 0) { toast.error("Indica un importe válido"); return; }
    if (!finalCategory) { toast.error("Indica una categoría"); return; }
    setPending(true);
    const res = await createIncome({
      amount: Number(amount),
      category: finalCategory,
      description,
      occurred_at: date,
    });
    setPending(false);
    if (res.ok) { toast.success("Ingreso registrado"); router.push("/dashboard/movimientos"); }
    else toast.error(res.error);
  }

  const showCapture = method !== "manual" && !detected;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold tracking-tight">Método de entrada</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-4 max-w-sm">
          {incomeMethods.map((m) => (
            <button
              key={m.key}
              onClick={() => pickMethod(m.key)}
              className={cn(
                "flex flex-col items-center rounded-2xl border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 sm:rounded-3xl sm:p-6",
                method === m.key ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl" style={{ backgroundColor: m.bg, color: m.fg }}>
                <m.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <p className="mt-2 text-xs font-bold leading-tight text-primary sm:mt-4 sm:text-base">{m.title}</p>
              <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">{m.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          {showCapture ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-accent/40 p-8 text-center">
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
                {recording && <span className="absolute inset-0 animate-ping rounded-2xl" style={{ backgroundColor: PALETTE.lila, opacity: 0.4 }} />}
                {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="relative h-6 w-6" />}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {analyzing ? "Transcribiendo con IA…" : recording ? "Escuchando… habla ahora" : "Pulsa y di tu ingreso en alto"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ej: &ldquo;Nómina de junio, dos mil euros&rdquo;. Whisper transcribe y GPT-4o extrae los datos.</p>
              {!recording ? (
                <button
                  onClick={startRecordingIncome}
                  disabled={analyzing}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  <Mic className="h-4 w-4" /> {analyzing ? "Procesando…" : "Empezar a hablar"}
                </button>
              ) : (
                <button
                  onClick={stopRecordingIncome}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C2496B] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Square className="h-4 w-4" /> Detener y analizar
                </button>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Importe</label>
                <div className="mt-1.5 flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent py-3 text-2xl font-extrabold outline-none"
                  />
                  <span className="text-2xl font-extrabold text-muted-foreground">€</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Nómina de junio"
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {incomeCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={() => setCategory(NEW_CATEGORY)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === NEW_CATEGORY ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                )}
              >
                + Nueva
              </button>
            </div>
            {category === NEW_CATEGORY && (
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nombre de la categoría"
                className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight">Previsualización</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-start justify-between p-6" style={{ background: `linear-gradient(135deg, ${PALETTE.mintSoft}, ${PALETTE.lilaSoft})` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {detected ? "Ingreso detectado" : "Resumen del ingreso"}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">{amount ? `+${formatEUR(Number(amount))}` : "—"}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70" style={{ color: PALETTE.mintInk }}>
                <TrendingUp className="h-5 w-5" />
              </span>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Descripción" value={description || "—"} />
                <Field label="Fecha" value={new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Categoría</p>
                <p className="mt-1 text-sm font-bold text-foreground">{finalCategory || "—"}</p>
              </div>
              <button
                disabled={pending}
                onClick={confirm}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> Confirmar ingreso
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
