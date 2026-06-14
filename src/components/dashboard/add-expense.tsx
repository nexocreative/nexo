"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Mic, PenLine, Receipt, Sparkles, Check } from "lucide-react";
import { CATEGORIES, PALETTE, getCategory } from "@/lib/constants";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { createTransaction } from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { cn } from "@/lib/utils";

type Method = "photo" | "voice" | "manual";

const methods: { key: Method; title: string; desc: string; icon: typeof Camera; bg: string; fg: string }[] = [
  { key: "photo", title: "Foto Ticket", desc: "GPT-4o Vision extrae los datos del recibo.", icon: Camera, bg: PALETTE.mintSoft, fg: PALETTE.mintInk },
  { key: "voice", title: "Por Voz", desc: "Whisper transcribe y GPT-4o estructura.", icon: Mic, bg: PALETTE.lilaSoft, fg: PALETTE.lilaInk },
  { key: "manual", title: "Manual", desc: "Introduce los detalles paso a paso.", icon: PenLine, bg: PALETTE.peachSoft, fg: PALETTE.peachInk },
];

// Datos simulados que devolvería OpenAI (la API key real está pendiente).
const MOCK = {
  photo: { merchant: "Whole Foods Market", amount: "64.50", category: "supermercado" },
  voice: { merchant: "Gasolinera Repsol", amount: "50.00", category: "transporte" },
};

export function AddExpense() {
  const router = useRouter();
  const [method, setMethod] = React.useState<Method>("manual");
  const [category, setCategory] = React.useState("supermercado");
  const [merchant, setMerchant] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [detected, setDetected] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  function pickMethod(m: Method) {
    setMethod(m);
    setDetected(false);
    if (m === "manual") {
      setMerchant("");
      setAmount("");
    }
  }

  function simulate() {
    const data = method === "photo" ? MOCK.photo : MOCK.voice;
    setMerchant(data.merchant);
    setAmount(data.amount);
    setCategory(data.category);
    setDetected(true);
    toast.success(method === "photo" ? "Ticket analizado con IA" : "Voz transcrita con IA");
  }

  async function confirm() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Indica un importe válido");
      return;
    }
    setPending(true);
    const res = await createTransaction({
      type: "expense",
      amount: Number(amount),
      category,
      merchant: merchant || undefined,
      occurred_at: date,
      source: method,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Gasto registrado");
      router.push("/dashboard/movimientos");
    } else toast.error(res.error);
  }

  const showSimulate = method !== "manual" && !detected;

  return (
    <div className="space-y-8">
      {/* Método de entrada */}
      <section>
        <h2 className="text-lg font-bold tracking-tight">Método de entrada</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => pickMethod(m.key)}
              className={cn(
                "flex flex-col items-center rounded-3xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-0.5",
                method === m.key ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60",
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: m.bg, color: m.fg }}>
                <m.icon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-base font-bold text-primary">{m.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Formulario / captura */}
        <section className="space-y-5">
          {showSimulate ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-accent/40 p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}>
                {method === "photo" ? <Camera className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {method === "photo" ? "Sube o haz una foto del ticket" : "Pulsa y di tu gasto en alto"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {method === "photo"
                  ? "GPT-4o Vision extraerá comercio, importe, fecha y categoría."
                  : "Whisper transcribe y GPT-4o estructura los campos."}
              </p>
              <button
                onClick={simulate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" />
                {method === "photo" ? "Analizar ticket (demo IA)" : "Transcribir voz (demo IA)"}
              </button>
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

          {/* Categoría */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    category === c.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  <CategoryIcon category={c.key} className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Previsualización */}
        <section>
          <h2 className="text-lg font-bold tracking-tight">Previsualización</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-start justify-between p-6" style={{ background: `linear-gradient(135deg, ${PALETTE.lilaSoft}, ${PALETTE.mintSoft})` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {detected ? "Gasto detectado" : "Resumen del gasto"}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">
                  {amount ? formatEUR(Number(amount)) : "—"}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70" style={{ color: PALETTE.lilaInk }}>
                <Receipt className="h-5 w-5" />
              </span>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
