"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Plus,
  ChevronLeft,
  UserPlus,
  Trash2,
  Check,
  X,
  LogOut,
  CreditCard,
  ChevronDown,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  createGrupo,
  deleteGrupo,
  leaveGrupo,
  renameGrupo,
  inviteGrupoMember,
  respondToGrupoInvite,
  addGrupoGasto,
  deleteGrupoGasto,
  settleWithMember,
  createTransaction,
} from "@/app/dashboard/actions";
import { formatEUR } from "@/lib/format";
import type { GruposData, GrupoConDetalle } from "@/types/database";

interface Props {
  data: GruposData;
  currentUserId: string;
}

function fmtDay(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function BarWithTooltip({
  pct,
  isPositive,
  shouldPay,
  totalGastado,
}: {
  pct: number;
  isPositive: boolean;
  shouldPay: number;
  totalGastado: number;
}) {
  const linePct = totalGastado > 0 ? Math.min((shouldPay / totalGastado) * 100, 100) : 0;

  return (
    <div className="relative h-3 w-full">
      <div className="relative h-full w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${isPositive ? "bg-emerald-400" : "bg-red-400"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {/* Zona hover alrededor de la línea */}
      {totalGastado > 0 && (
        <div
          className="group absolute top-0 flex h-full -translate-x-1/2 cursor-default items-center justify-center px-2"
          style={{ left: `${linePct}%` }}
        >
          <div className="h-full w-0.5 bg-foreground/40" />
          <div className="pointer-events-none absolute bottom-full mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs font-semibold text-background group-hover:block"
            style={{ left: "50%" }}
          >
            Su parte: {formatEUR(shouldPay)}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ name, email }: { name: string | null; email: string | null }) {
  const label = name?.[0] ?? email?.[0] ?? "?";
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
      {label.toUpperCase()}
    </span>
  );
}

// ─── Vista detalle de un grupo ────────────────────────────────────────────────

function GrupoDetail({
  grupo,
  currentUserId,
  onBack,
}: {
  grupo: GrupoConDetalle;
  currentUserId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviting, setInviting] = React.useState(false);
  const [showAddGasto, setShowAddGasto] = React.useState(false);
  const [deleteGastoId, setDeleteGastoId] = React.useState<string | null>(null);
  const [settling, setSettling] = React.useState<string | null>(null);
  const [settleConfirm, setSettleConfirm] = React.useState<{ userId: string; net: number; name: string | null } | null>(null);
  const [settleAddToMovements, setSettleAddToMovements] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(grupo.name);
  const [savingName, setSavingName] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Form state para añadir gasto
  const acceptedMembers = grupo.members.filter((m) => m.status === "accepted");
  const [gastoDesc, setGastoDesc] = React.useState("");
  const [gastoAmount, setGastoAmount] = React.useState("");
  const [gastoDate, setGastoDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [gastoPaidBy, setGastoPaidBy] = React.useState(currentUserId);
  const [gastoParticipants, setGastoParticipants] = React.useState<string[]>(
    acceptedMembers.map((m) => m.user_id),
  );
  const [addingGasto, setAddingGasto] = React.useState(false);

  const toggleParticipant = (uid: string) => {
    setGastoParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const res = await inviteGrupoMember(grupo.id, inviteEmail.trim());
    setInviting(false);
    if (res.ok) {
      toast.success("Invitación enviada");
      setInviteEmail("");
      setShowInvite(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleAddGasto() {
    if (!gastoDesc.trim() || !gastoAmount || gastoParticipants.length === 0) return;
    setAddingGasto(true);
    const res = await addGrupoGasto({
      grupoId: grupo.id,
      description: gastoDesc.trim(),
      amount: Number(gastoAmount),
      occurredAt: gastoDate,
      paidBy: gastoPaidBy,
      participantIds: gastoParticipants,
    });
    setAddingGasto(false);
    if (res.ok) {
      toast.success("Gasto añadido");
      setGastoDesc("");
      setGastoAmount("");
      setGastoDate(new Date().toISOString().slice(0, 10));
      setGastoPaidBy(currentUserId);
      setGastoParticipants(acceptedMembers.map((m) => m.user_id));
      setShowAddGasto(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDeleteGasto() {
    if (!deleteGastoId) return;
    const res = await deleteGrupoGasto(deleteGastoId);
    setDeleteGastoId(null);
    if (res.ok) {
      toast.success("Gasto eliminado");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleSettle(otherUserId: string, net: number, addToMovements: boolean) {
    setSettling(otherUserId);
    const res = await settleWithMember(grupo.id, otherUserId);
    if (res.ok && addToMovements && Math.abs(net) >= 0.01) {
      const otherName = grupo.members.find((m) => m.user_id === otherUserId)?.display_name
        ?? grupo.members.find((m) => m.user_id === otherUserId)?.email
        ?? "compañero";
      await createTransaction({
        type: net < 0 ? "expense" : "income",
        amount: Math.abs(net),
        category: net < 0 ? "otros" : null,
        description: `${net < 0 ? "Pago a" : "Cobro de"} ${otherName} - ${grupo.name}`,
        source: "manual",
      });
    }
    setSettling(null);
    if (res.ok) {
      toast.success("Saldado");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue.trim() === grupo.name) { setEditingName(false); return; }
    setSavingName(true);
    const res = await renameGrupo(grupo.id, nameValue);
    setSavingName(false);
    if (res.ok) { toast.success("Nombre actualizado"); router.refresh(); }
    else toast.error(res.error);
    setEditingName(false);
  }

  async function handleLeave() {
    setLeaving(true);
    const isCreator = grupo.created_by === currentUserId;
    const res = isCreator ? await deleteGrupo(grupo.id) : await leaveGrupo(grupo.id);
    setLeaving(false);
    if (res.ok) {
      toast.success(isCreator ? "Grupo eliminado" : "Has abandonado el grupo");
      onBack();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const nonZeroBalances = grupo.balances.filter((b) => Math.abs(b.net) >= 0.01);

  const acceptedAll = grupo.members.filter((m) => m.status === "accepted");
  const totalGastado = grupo.gastos.reduce((a, g) => a + g.amount, 0);

  const memberStats = acceptedAll.map((m) => {
    const paid = grupo.gastos
      .filter((g) => g.paid_by === m.user_id)
      .reduce((a, g) => a + g.amount, 0);
    // Lo que debería haber pagado = suma de sus partes en todos los gastos en que participa
    const shouldPay = grupo.gastos
      .flatMap((g) => g.partes)
      .filter((p) => p.user_id === m.user_id)
      .reduce((a, p) => a + p.amount, 0);
    return {
      user_id: m.user_id,
      display_name: m.display_name,
      email: m.email,
      paid,
      shouldPay,
      pct: totalGastado > 0 ? (paid / totalGastado) * 100 : 0,
      net: paid - shouldPay,
    };
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {editingName ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              className="min-w-0 flex-1 rounded-xl border border-primary/50 bg-card px-3 py-1.5 text-xl font-extrabold outline-none"
            />
            <button onClick={handleSaveName} disabled={savingName} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-60">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setEditingName(false); setNameValue(grupo.name); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-2xl font-extrabold tracking-tight text-foreground">
            {grupo.name}
          </h1>
        )}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl border border-border bg-card py-1 shadow-xl">
              {grupo.created_by === currentUserId && (
                <button
                  onClick={() => { setShowMenu(false); setNameValue(grupo.name); setEditingName(true); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                  Editar nombre
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); setShowLeaveConfirm(true); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                {grupo.created_by === currentUserId ? "Eliminar grupo" : "Abandonar grupo"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resumen visual */}
      {totalGastado > 0 && (
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          {/* Total */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total gastado
            </p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">
              {formatEUR(totalGastado)}
            </p>
          </div>

          {/* Barras por persona */}
          <div className="space-y-4">
            {memberStats
              .sort((a, b) => b.paid - a.paid)
              .map((m) => {
                const isPositive = m.net >= 0;
                return (
                  <div key={m.user_id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={m.display_name} email={m.email} />
                        <span className="truncate text-sm font-semibold text-foreground">
                          {m.user_id === currentUserId ? "Yo" : (m.display_name ?? m.email)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-bold text-foreground">
                          {formatEUR(m.paid)}
                        </span>
                        {Math.abs(m.net) >= 0.01 && (
                          <span
                            className={`ml-2 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {isPositive ? "+" : ""}{formatEUR(m.net)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Barra */}
                    <BarWithTooltip
                      pct={m.pct}
                      isPositive={isPositive}
                      shouldPay={m.shouldPay}
                      totalGastado={totalGastado}
                    />
                  </div>
                );
              })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Pagó de más
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Pagó de menos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-0.5 bg-foreground/30" />
              Parte justa
            </span>
          </div>
        </section>
      )}

      {/* Balances */}
      {nonZeroBalances.length > 0 && (
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Balances
          </h2>
          <ul className="space-y-3">
            {grupo.balances.map((b) => (
              <li key={b.user_id} className="flex items-center gap-3">
                <Avatar name={b.display_name} email={b.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {b.display_name ?? b.email}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      Math.abs(b.net) < 0.01
                        ? "text-muted-foreground"
                        : b.net > 0
                          ? "text-emerald-600"
                          : "text-red-500"
                    }`}
                  >
                    {Math.abs(b.net) < 0.01
                      ? "En paz"
                      : b.net > 0
                        ? `Te debe ${formatEUR(b.net)}`
                        : `Le debes ${formatEUR(Math.abs(b.net))}`}
                  </p>
                </div>
                {Math.abs(b.net) >= 0.01 && (
                  <button
                    onClick={() => { setSettleAddToMovements(false); setSettleConfirm({ userId: b.user_id, net: b.net, name: b.display_name ?? b.email }); }}
                    className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Saldar
                  </button>
                )}
              </li>
            ))}
            {grupo.balances.every((b) => Math.abs(b.net) < 0.01) && (
              <p className="text-sm text-muted-foreground">Todo saldado</p>
            )}
          </ul>
        </section>
      )}

      {/* Gastos */}
      <section className="min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Gastos
          </h2>
          <button
            onClick={() => setShowAddGasto((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir gasto
          </button>
        </div>

        {/* Formulario añadir gasto */}
        {showAddGasto && (
          <div className="mx-6 mb-5 space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
            <input
              autoFocus
              placeholder="Descripción"
              value={gastoDesc}
              onChange={(e) => setGastoDesc(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Importe (€)"
                min="0.01"
                step="0.01"
                value={gastoAmount}
                onChange={(e) => setGastoAmount(e.target.value)}
                className="w-1/2 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
              <input
                type="date"
                value={gastoDate}
                onChange={(e) => setGastoDate(e.target.value)}
                className="w-1/2 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <select
                value={gastoPaidBy}
                onChange={(e) => setGastoPaidBy(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-card py-2 pl-3 pr-10 text-sm outline-none focus:border-primary/50"
              >
                {acceptedMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_id === currentUserId
                      ? "Yo"
                      : (m.display_name ?? m.email ?? m.user_id)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Participan:</p>
              <div className="flex flex-wrap gap-2">
                {acceptedMembers.map((m) => {
                  const checked = gastoParticipants.includes(m.user_id);
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => toggleParticipant(m.user_id)}
                      className={`rounded-xl border px-3 py-1 text-xs font-medium transition-colors ${
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {m.user_id === currentUserId ? "Yo" : (m.display_name ?? m.email)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddGasto(false)}
                className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddGasto}
                disabled={addingGasto || !gastoDesc.trim() || !gastoAmount || gastoParticipants.length === 0}
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingGasto ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {grupo.gastos.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No hay gastos aún.</p>
        ) : (
          <ul className="divide-y divide-border/60 px-6 pb-2">
            {grupo.gastos.map((gasto) => {
              const myPart = gasto.partes.find((p) => p.user_id === currentUserId);
              const participants = gasto.partes.map((p) => {
                const m = grupo.members.find((x) => x.user_id === p.user_id);
                return m?.display_name ?? m?.email ?? p.user_id;
              });
              return (
                <li key={gasto.id} className="flex min-w-0 items-start gap-3 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {gasto.description}
                      </p>
                      <span className="shrink-0 text-sm font-bold text-foreground">
                        {formatEUR(gasto.amount)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {fmtDay(gasto.occurred_at)} · Pagó {gasto.paid_by === currentUserId ? "yo" : (gasto.paid_by_name ?? "?")}
                      {myPart && (
                        <span className={myPart.settled ? " · Saldado" : ` · Tu parte: ${formatEUR(myPart.amount)}`} />
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                      {participants.join(", ")}
                    </p>
                  </div>
                  {gasto.paid_by === currentUserId && (
                    <button
                      onClick={() => setDeleteGastoId(gasto.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Miembros */}
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Miembros
          </h2>
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            <UserPlus className="h-4 w-4" />
            Invitar persona
          </button>
        </div>

        {showInvite && (
          <div className="mb-4 flex gap-2">
            <input
              autoFocus
              type="email"
              placeholder="Email de Nexo"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
              className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setShowInvite(false); setInviteEmail(""); }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <ul className="space-y-3">
          {grupo.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <Avatar name={m.display_name} email={m.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.user_id === currentUserId
                    ? "Yo"
                    : (m.display_name ?? m.email ?? "Usuario")}
                </p>
                {m.status !== "accepted" && (
                  <p className="text-xs text-muted-foreground">
                    {m.status === "pending" ? "Pendiente" : "Rechazado"}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Modal confirmar abandonar/eliminar grupo */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">
              {grupo.created_by === currentUserId ? "¿Eliminar el grupo?" : "¿Abandonar el grupo?"}
            </h4>
            <p className="mt-1.5 text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {leaving ? "..." : grupo.created_by === currentUserId ? "Eliminar" : "Abandonar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar saldar */}
      {settleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">¿Marcar como saldado?</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Se marcarán todos los gastos pendientes entre vosotros como saldados.
              {" "}<span className="font-semibold text-foreground">
                {settleConfirm.net < 0
                  ? `Debes ${formatEUR(Math.abs(settleConfirm.net))} a ${settleConfirm.name ?? "esta persona"}.`
                  : `Te deben ${formatEUR(settleConfirm.net)} de ${settleConfirm.name ?? "esta persona"}.`}
              </span>
            </p>
            <label className="mt-4 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={settleAddToMovements}
                onChange={(e) => setSettleAddToMovements(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground">
                Añadir {formatEUR(Math.abs(settleConfirm.net))} a mis movimientos
                {settleConfirm.net < 0 ? " (gasto)" : " (ingreso)"}
              </span>
            </label>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setSettleConfirm(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const { userId, net } = settleConfirm;
                  setSettleConfirm(null);
                  await handleSettle(userId, net, settleAddToMovements);
                }}
                disabled={settling === settleConfirm.userId}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {settling ? "..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrar gasto */}
      {deleteGastoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">¿Eliminar gasto?</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteGastoId(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteGasto}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vista lista de grupos ────────────────────────────────────────────────────

export function JuntosView({ data, currentUserId }: Props) {
  const router = useRouter();
  const [selectedGrupoId, setSelectedGrupoId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [respondingId, setRespondingId] = React.useState<string | null>(null);

  const selectedGrupo = data.grupos.find((g) => g.id === selectedGrupoId) ?? null;

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await createGrupo(newName.trim());
    setCreating(false);
    if (res.ok) {
      toast.success("Grupo creado");
      setNewName("");
      setShowCreate(false);
      router.refresh();
      if ("id" in res && res.id) setSelectedGrupoId(res.id);
    } else {
      toast.error(res.error);
    }
  }

  async function handleRespond(grupoId: string, accept: boolean) {
    setRespondingId(grupoId);
    const res = await respondToGrupoInvite(grupoId, accept);
    setRespondingId(null);
    if (res.ok) {
      toast.success(accept ? "Te has unido al grupo" : "Invitación rechazada");
      router.refresh();
      if (accept) setSelectedGrupoId(grupoId);
    } else {
      toast.error(res.error);
    }
  }

  if (selectedGrupo) {
    return (
      <GrupoDetail
        grupo={selectedGrupo}
        currentUserId={currentUserId}
        onBack={() => setSelectedGrupoId(null)}
      />
    );
  }

  const myNetTotal = data.grupos.reduce((acc, g) => {
    return acc + g.balances.reduce((a, b) => a + b.net, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          {data.grupos.length > 0 && (
            <p className={`text-sm font-medium ${Math.abs(myNetTotal) < 0.01 ? "text-muted-foreground" : myNetTotal > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {Math.abs(myNetTotal) < 0.01
                ? "Todo saldado"
                : myNetTotal > 0
                  ? `Te deben ${formatEUR(myNetTotal)} en total`
                  : `Debes ${formatEUR(Math.abs(myNetTotal))} en total`}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo grupo
        </button>
      </div>

      {/* Modal crear grupo */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">Nuevo grupo</h4>
            <input
              autoFocus
              placeholder="Nombre del grupo"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              className="mt-4 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowCreate(false); setNewName(""); }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitaciones pendientes */}
      {data.pendingInvites.length > 0 && (
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Invitaciones pendientes
          </h2>
          <ul className="space-y-3">
            {data.pendingInvites.map((inv) => (
              <li key={inv.grupo_id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{inv.grupo_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Invitado por {inv.invited_by_name ?? inv.invited_by_email ?? "alguien"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => handleRespond(inv.grupo_id, true)}
                    disabled={respondingId === inv.grupo_id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRespond(inv.grupo_id, false)}
                    disabled={respondingId === inv.grupo_id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lista de grupos */}
      {data.grupos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card py-16 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin grupos todavía</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea un grupo para empezar a repartir gastos
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.grupos.map((g) => {
            const myNet = g.balances.reduce((a, b) => a + b.net, 0);
            const memberCount = g.members.filter((m) => m.status === "accepted").length;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGrupoId(g.id)}
                className="flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {Math.abs(myNet) < 0.01 ? (
                    <span className="text-sm font-medium text-muted-foreground">En paz</span>
                  ) : (
                    <>
                      <p
                        className={`text-sm font-bold ${myNet > 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {myNet > 0 ? "+" : ""}{formatEUR(myNet)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {myNet > 0 ? "te deben" : "debes"}
                      </p>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
