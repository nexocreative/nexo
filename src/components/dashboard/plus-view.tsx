"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Check, Loader2, Camera, Mic, FileSpreadsheet, History, Users, Download } from "lucide-react";
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

  async function subscribe(billing: "monthly" | "annual") {
    setLoading(billing);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing }),
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
        <section className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
          >
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-foreground">Ya eres Nexo Plus ✨</h2>
          {currentPeriodEnd && (
            <p className="mt-1 text-sm text-muted-foreground">
              Tu suscripción se renueva el {formatDate(currentPeriodEnd.slice(0, 10))}
            </p>
          )}
          <ul className="mt-6 space-y-2 text-left">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm text-foreground">
                <Check className="h-4 w-4 shrink-0" style={{ color: PALETTE.mintInk }} />
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
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pt-4">
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

      <section className="text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
        >
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Nexo Plus</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Desbloquea la IA, el historial completo y sin límites en grupos, vacaciones y ahorro.
        </p>
      </section>

      <ul className="mx-auto grid max-w-md gap-2.5">
        {FEATURES.map((f) => (
          <li key={f.label} className="flex items-center gap-2.5 text-sm text-foreground">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}>
              <f.icon className="h-3.5 w-3.5" />
            </span>
            {f.label}
          </li>
        ))}
      </ul>

      <div className="grid gap-5 sm:grid-cols-2">
        <PriceCard
          title="Mensual"
          price="2,99 €"
          period="/ mes"
          cta="Suscribirme"
          loading={loading === "monthly"}
          disabled={loading !== null}
          onClick={() => subscribe("monthly")}
        />
        <PriceCard
          title="Anual"
          price="19,99 €"
          period="/ año"
          badge="Ahorra 44%"
          cta="Suscribirme"
          highlighted
          loading={loading === "annual"}
          disabled={loading !== null}
          onClick={() => subscribe("annual")}
        />
      </div>
    </div>
  );
}

function PriceCard({
  title,
  price,
  period,
  badge,
  cta,
  highlighted = false,
  loading,
  disabled,
  onClick,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  cta: string;
  highlighted?: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm",
        highlighted ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60",
      )}
    >
      {badge && (
        <span
          className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: PALETTE.peachSoft, color: PALETTE.peachInk }}
        >
          {badge}
        </span>
      )}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2">
        <span className="text-3xl font-extrabold text-foreground">{price}</span>{" "}
        <span className="text-sm font-semibold text-muted-foreground">{period}</span>
      </p>
      <button
        onClick={onClick}
        disabled={disabled}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {cta}
      </button>
    </section>
  );
}
