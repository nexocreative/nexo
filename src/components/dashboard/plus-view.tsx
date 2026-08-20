"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Check, X, Loader2, Camera, Mic, FileSpreadsheet, History, Users, Download } from "lucide-react";
import { PALETTE } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Camera, label: "Escanear tickets con IA" },
  { icon: Mic, label: "Registrar gastos por voz" },
  { icon: FileSpreadsheet, label: "Importar extractos bancarios con IA" },
  { icon: History, label: "Historial completo de movimientos" },
  { icon: Users, label: "Grupos, vacaciones y ahorro ilimitados" },
  { icon: Download, label: "Exportar movimientos a CSV" },
];

/** Debe reflejar FREE_LIMITS y FREE_AI_TRIAL_USES en src/lib/billing.ts (server-only, no importable en este componente cliente). */
const COMPARISON: { label: string; free: string | boolean; plus: string | boolean }[] = [
  { label: "Registro manual y presupuestos", free: true, plus: true },
  { label: "Grupos, vacaciones y ahorro", free: "1 activo", plus: "Ilimitados" },
  { label: "Historial de movimientos", free: "3 meses", plus: "Completo" },
  { label: "Escanear tickets con IA", free: "2 pruebas gratis", plus: true },
  { label: "Registrar gastos por voz", free: "2 pruebas gratis", plus: true },
  { label: "Importar extractos bancarios con IA", free: "1 prueba gratis", plus: true },
  { label: "Exportar a CSV", free: false, plus: true },
];

const PRICES = {
  monthly: { amount: "2,99 €", period: "/ mes", cta: "Empezar por 2,99 €/mes" },
  annual: { amount: "19,99 €", period: "/ año", cta: "Empezar por 19,99 €/año" },
} as const;

export function PlusView({
  plan,
  currentPeriodEnd,
  justSubscribed = false,
}: {
  plan: "free" | "plus";
  currentPeriodEnd: string | null;
  justSubscribed?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<"monthly" | "annual" | "portal" | null>(null);
  const [billing, setBilling] = React.useState<"monthly" | "annual">("monthly");
  const notified = React.useRef(false);
  const retries = React.useRef(0);
  const MAX_RETRIES = 4;
  const [confirmTimedOut, setConfirmTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (!justSubscribed || notified.current) return;
    if (plan === "plus") {
      notified.current = true;
      toast.success("¡Bienvenida a Nexo Plus! 🎉");
      router.replace("/dashboard/plus");
    } else if (retries.current < MAX_RETRIES) {
      // El webhook de Stripe puede tardar unos segundos en confirmar el pago.
      retries.current += 1;
      const t = setTimeout(() => router.refresh(), 2500);
      return () => clearTimeout(t);
    } else {
      setConfirmTimedOut(true);
    }
  }, [justSubscribed, plan, router]);

  React.useEffect(() => {
    // Si el usuario va a Stripe y vuelve con "atrás", el navegador puede restaurar
    // esta página desde bfcache con el spinner de loading congelado tal cual estaba.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) setLoading(null);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function subscribe(period: "monthly" | "annual") {
    setLoading(period);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: period }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "No se pudo iniciar el pago");
        setLoading(null);
        return;
      }
      window.location.href = json.url;
    } catch {
      toast.error("Error de conexión al iniciar el pago");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "No se pudo abrir la gestión de la suscripción");
        setLoading(null);
        return;
      }
      window.location.href = json.url;
    } catch {
      toast.error("Error de conexión");
      setLoading(null);
    }
  }

  if (plan === "plus") {
    return (
      <div className="mx-auto max-w-lg space-y-6 pt-4">
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div
            className="h-20"
            style={{ background: `linear-gradient(120deg, ${PALETTE.lilaSoft}, ${PALETTE.mintSoft} 55%, ${PALETTE.peachSoft})` }}
          />
          <div className="-mt-8 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card bg-card shadow-sm">
              <span
                className="flex h-full w-full items-center justify-center rounded-xl"
                style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
              >
                <Sparkles className="h-6 w-6" />
              </span>
            </span>
          </div>
          <div className="px-8 pb-8 pt-2 text-center">
            <h2 className="text-xl font-bold text-foreground">Ya eres Nexo Plus</h2>
            {currentPeriodEnd && (
              <div className="mx-auto mt-4 inline-flex flex-col items-center gap-0.5 rounded-2xl border border-border/60 bg-muted/40 px-6 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-foreground/70">Plan activo</span>
                <span className="text-sm text-foreground/80">
                  Se renueva el{" "}
                  <span className="text-base font-bold text-foreground">{formatDate(currentPeriodEnd.slice(0, 10))}</span>
                </span>
              </div>
            )}
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-left">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: PALETTE.mintInk }} />
                  {f.label}
                </li>
              ))}
            </ul>
            <button
              onClick={openPortal}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-60"
            >
              {loading === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
              Gestionar suscripción
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      {justSubscribed && !confirmTimedOut && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-accent/40 px-4 py-3 text-sm font-semibold text-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: PALETTE.lilaInk }} />
          Confirmando tu pago… esto tarda solo unos segundos.
        </div>
      )}
      {justSubscribed && confirmTimedOut && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
          <span className="font-semibold text-foreground">
            Tu pago se procesó en Stripe, pero todavía no lo vemos reflejado aquí. Puede tardar un poco más.
          </span>
          <button
            onClick={() => router.refresh()}
            className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40"
          >
            Volver a comprobar
          </button>
        </div>
      )}

      <section
        className="rounded-3xl p-7 text-center"
        style={{ background: `linear-gradient(120deg, ${PALETTE.lilaSoft}, ${PALETTE.mintSoft} 55%, ${PALETTE.peachSoft})` }}
      >
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm"
          style={{ color: PALETTE.lilaInk }}
        >
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Sin límites en tus finanzas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Desbloquea la IA, el historial completo y sin límites en grupos, vacaciones y ahorro.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex w-full rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              billing === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              billing === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            Anual <span className="font-bold" style={{ color: PALETTE.mintInk }}>· ahorra 44%</span>
          </button>
        </div>

        <div className="text-center">
          <p>
            <span className="text-4xl font-extrabold text-foreground">{PRICES[billing].amount}</span>{" "}
            <span className="text-sm font-semibold text-muted-foreground">{PRICES[billing].period}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {billing === "annual"
              ? "Equivale a 1,67 €/mes: pagas una vez al año"
              : "Cancela cuando quieras, sin permanencia"}
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => subscribe(billing)}
            disabled={loading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {(loading === "monthly" || loading === "annual") && <Loader2 className="h-4 w-4 animate-spin" />}
            {PRICES[billing].cta}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/60">
        <div className="grid grid-cols-[1fr_4.5rem_5.5rem] items-center">
          <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Incluye</div>
          <div className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">Free</div>
          <div
            className="mr-1.5 mt-1.5 rounded-t-lg px-2 py-2.5 text-center text-xs font-bold"
            style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
          >
            Plus
          </div>
        </div>
        {COMPARISON.map((row, i) => (
          <div key={row.label} className="grid grid-cols-[1fr_4.5rem_5.5rem] items-center border-t border-border/60">
            <div className="px-4 py-2.5 text-xs text-foreground">{row.label}</div>
            <div className="px-2 py-2.5 text-center">
              {typeof row.free === "boolean" ? (
                row.free ? (
                  <Check className="mx-auto h-4 w-4" style={{ color: PALETTE.mintInk }} />
                ) : (
                  <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                )
              ) : (
                <span className="text-[11px] font-semibold text-muted-foreground">{row.free}</span>
              )}
            </div>
            <div
              className={cn("mr-1.5 px-2 py-2.5 text-center", i === COMPARISON.length - 1 && "rounded-b-lg")}
              style={{ backgroundColor: PALETTE.lilaSoft }}
            >
              {typeof row.plus === "boolean" ? (
                <Check className="mx-auto h-4 w-4" style={{ color: PALETTE.mintInk }} />
              ) : (
                <span className="text-[11px] font-bold" style={{ color: PALETTE.lilaInk }}>
                  {row.plus}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
