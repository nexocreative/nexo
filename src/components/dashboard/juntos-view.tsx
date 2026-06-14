"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Lock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Plus,
  Target,
  Mail,
  Clock,
  UserPlus,
  Check,
  X,
  Unlink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ProgressRing } from "@/components/ui/progress-ring";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import {
  togglePartnerConsent,
  contributeSavings,
  invitePartner,
  respondToInvite,
  unlinkPartner,
} from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import { PALETTE } from "@/lib/constants";

type LinkStatus = "none" | "pending_sent" | "pending_received" | "accepted";

interface Goal {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  pct: number;
  daysLeft: number;
  monthlyNeeded: number;
  onTrack: boolean;
}

export function JuntosView({
  status,
  sharingActive,
  partnerName,
  myConsent,
  partnerConsent,
  goal,
  consolidated,
}: {
  status: LinkStatus;
  sharingActive: boolean;
  partnerName: string | null;
  myConsent: boolean;
  partnerConsent: boolean;
  goal: Goal | null;
  consolidated: { month: string; income: number; expense: number }[] | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {goal ? (
          <GoalCard goal={goal} />
        ) : (
          <section className="rounded-3xl border border-border/60 bg-card p-7 text-center shadow-sm">
            <Target className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 text-lg font-bold">Sin objetivo conjunto</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea una meta de ahorro compartida con {partnerName ?? "tu pareja"}.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-foreground">Gráfica consolidada del hogar</h3>
            <p className="text-xs text-muted-foreground">Ingresos vs gastos de ambos · últimos 6 meses</p>
          </div>
          {sharingActive && consolidated ? (
            <div className="mt-4">
              <IncomeExpenseBars data={consolidated} />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 py-14 text-center">
              <Lock className="h-7 w-7 text-muted-foreground" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Los datos cruzados solo se muestran cuando <strong>ambos</strong> activáis la vista conjunta.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <PartnerCard
          status={status}
          partnerName={partnerName}
          myConsent={myConsent}
          partnerConsent={partnerConsent}
          sharingActive={sharingActive}
        />
        {goal && sharingActive && <ContributeCard />}
      </div>
    </div>
  );
}

function PartnerCard({
  status,
  partnerName,
  myConsent,
  partnerConsent,
  sharingActive,
}: {
  status: LinkStatus;
  partnerName: string | null;
  myConsent: boolean;
  partnerConsent: boolean;
  sharingActive: boolean;
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
          <Users className="h-[18px] w-[18px]" />
        </span>
        <h3 className="text-base font-bold text-foreground">Vista conjunta</h3>
      </div>

      {status === "none" && <InviteForm />}
      {status === "pending_sent" && <PendingSent partnerName={partnerName} />}
      {status === "pending_received" && <PendingReceived partnerName={partnerName} />}
      {status === "accepted" && (
        <AcceptedState
          partnerName={partnerName}
          myConsent={myConsent}
          partnerConsent={partnerConsent}
          sharingActive={sharingActive}
        />
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        🔒 <strong>Privacidad por diseño:</strong> tus datos individuales nunca se comparten automáticamente. Solo aquí, con activación explícita de ambos, se muestran datos cruzados.
      </p>
    </section>
  );
}

function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const res = await invitePartner(email);
    setPending(false);
    if (res.ok) {
      toast.success("Invitación enviada");
      setEmail("");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        Invita a tu pareja por su email de Nexo para compartir objetivos y gráficas del hogar.
      </p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <button
          disabled={pending || !email}
          onClick={submit}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" /> Enviar invitación
        </button>
      </div>
    </div>
  );
}

function PendingSent({ partnerName }: { partnerName: string | null }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  async function cancel() {
    setPending(true);
    const res = await unlinkPartner();
    setPending(false);
    if (res.ok) {
      toast.success("Invitación cancelada");
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold text-muted-foreground">
        <Clock className="h-4 w-4" /> Invitación enviada
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Esperando a que <span className="font-semibold text-foreground">{partnerName ?? "tu pareja"}</span> acepte la invitación.
      </p>
      <button
        disabled={pending}
        onClick={cancel}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        <X className="h-4 w-4" /> Cancelar invitación
      </button>
    </div>
  );
}

function PendingReceived({ partnerName }: { partnerName: string | null }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  async function respond(accept: boolean) {
    setPending(true);
    const res = await respondToInvite(accept);
    setPending(false);
    if (res.ok) {
      toast.success(accept ? "Vista conjunta activada" : "Invitación rechazada");
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <div className="mt-4">
      <p className="text-sm text-foreground">
        <span className="font-semibold">{partnerName ?? "Alguien"}</span> quiere compartir la vista conjunta contigo.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          disabled={pending}
          onClick={() => respond(true)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> Aceptar
        </button>
        <button
          disabled={pending}
          onClick={() => respond(false)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
        >
          <X className="h-4 w-4" /> Rechazar
        </button>
      </div>
    </div>
  );
}

function AcceptedState({
  partnerName,
  myConsent,
  partnerConsent,
  sharingActive,
}: {
  partnerName: string | null;
  myConsent: boolean;
  partnerConsent: boolean;
  sharingActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function toggle(next: boolean) {
    setPending(true);
    const res = await togglePartnerConsent(next);
    setPending(false);
    if (res.ok) {
      toast.success(next ? "Has activado la vista conjunta" : "Has desactivado la vista conjunta");
      router.refresh();
    } else toast.error(res.error);
  }

  async function unlink() {
    setPending(true);
    const res = await unlinkPartner();
    setPending(false);
    if (res.ok) {
      toast.success("Vínculo deshecho");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Tú</p>
          <p className="text-xs text-muted-foreground">Compartir mis datos</p>
        </div>
        <Switch checked={myConsent} disabled={pending} onCheckedChange={toggle} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{partnerName ?? "Pareja"}</p>
          <p className="text-xs text-muted-foreground">{partnerConsent ? "Ha dado consentimiento" : "Pendiente de activar"}</p>
        </div>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground"
          style={partnerConsent ? { backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk } : { backgroundColor: "hsl(var(--muted))" }}
        >
          {partnerConsent ? "✓" : "…"}
        </span>
      </div>

      <div
        className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground"
        style={sharingActive ? { backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk } : { backgroundColor: "hsl(var(--muted))" }}
      >
        {sharingActive ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        {sharingActive ? "Vista conjunta activa" : "Vista conjunta inactiva"}
      </div>

      <button
        disabled={pending}
        onClick={unlink}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        <Unlink className="h-3.5 w-3.5" /> Deshacer vínculo con {partnerName ?? "tu pareja"}
      </button>
    </>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-7 shadow-sm">
      <div className="flex flex-wrap items-center gap-7">
        <ProgressRing value={goal.pct} size={150} stroke={14} color={PALETTE.lila}>
          <span className="text-2xl font-extrabold text-foreground">{goal.pct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ahorrado</span>
        </ProgressRing>

        <div className="min-w-[200px] flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Objetivo conjunto</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{goal.name}</h2>
          <p className="mt-2 text-lg font-bold text-foreground">
            {formatEUR(goal.current_amount)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">de {formatEUR(goal.target_amount)}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fecha límite: {new Date(goal.target_date).toLocaleDateString("es-ES", { month: "long", year: "numeric" })} · faltan {goal.daysLeft} días
          </p>

          <div
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={goal.onTrack ? { backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk } : { backgroundColor: PALETTE.peachSoft, color: PALETTE.peachInk }}
          >
            {goal.onTrack ? <TrendingUp className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {goal.onTrack
              ? `Vais a buen ritmo · ${formatEUR(goal.monthlyNeeded)}/mes para llegar`
              : `Vais por debajo del ritmo · necesitáis ${formatEUR(goal.monthlyNeeded)}/mes`}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContributeCard() {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const res = await contributeSavings(Number(amount));
    setPending(false);
    if (res.ok) {
      toast.success("Aportación añadida al objetivo");
      setAmount("");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Aportar al ahorro</h3>
      <p className="text-xs text-muted-foreground">Cada uno aporta según su disponibilidad.</p>
      <div className="mt-4 flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Importe €"
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        <button
          disabled={pending || !amount}
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Aportar
        </button>
      </div>
    </section>
  );
}
