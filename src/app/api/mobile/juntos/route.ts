import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireUserIdFromRequest } from "@/lib/mobile-auth";
import { getGrupos } from "@/lib/data/queries";
import { assertUnderLimit } from "@/lib/billing";
import { sendEmail } from "@/lib/email/send";
import { grupoInviteEmail, grupoGastoEmail } from "@/lib/email/templates";
import { sendPushNotification } from "@/lib/push";

export const runtime = "nodejs";

/**
 * Endpoint móvil para "Juntos" (grupos de gastos compartidos).
 * Muchas de estas operaciones (invitar por email, crear cuentas "fantasma"
 * en next_auth.users, repartir/saldar deudas entre miembros) tocan filas de
 * OTROS usuarios o el esquema next_auth, y por eso no se pueden hacer con el
 * cliente Supabase con RLS del móvil — necesitan supabaseAdmin() (service
 * role), igual que las Server Actions equivalentes en dashboard/actions.ts.
 */

type ActionResult = { ok: true } | { ok: false; error: string; upgradeRequired?: boolean };

export async function GET(req: Request) {
  const userId = await requireUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const grupos = await getGrupos(userId);
  return NextResponse.json({ grupos });
}

async function notifyGrupoInvite(params: {
  grupoId: string;
  inviterId: string;
  targetUserId: string;
  targetEmail: string;
  hasAccount: boolean;
}): Promise<void> {
  const admin = supabaseAdmin();
  const [{ data: grupo }, { data: inviter }, { data: targetProfile }] = await Promise.all([
    admin.from("grupos").select("name").eq("id", params.grupoId).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", params.inviterId).maybeSingle(),
    admin.from("profiles").select("notification_prefs").eq("id", params.targetUserId).maybeSingle(),
  ]);
  if (targetProfile?.notification_prefs?.grupo_invite === false) return;

  const link = params.hasAccount
    ? `${process.env.NEXTAUTH_URL}/dashboard/juntos`
    : `${process.env.NEXTAUTH_URL}/login?tab=register&callbackUrl=%2Fdashboard%2Fjuntos&email=${encodeURIComponent(params.targetEmail)}`;

  await sendEmail({
    to: params.targetEmail,
    subject: "Te han invitado a un grupo en Nexo",
    html: grupoInviteEmail({
      grupoName: grupo?.name ?? "un grupo",
      inviterName: inviter?.display_name ?? "Alguien",
      link,
      needsAccount: !params.hasAccount,
    }),
  });

  if (params.hasAccount) {
    await sendPushNotification(params.targetUserId, {
      title: "Nueva invitación a un grupo",
      body: `${inviter?.display_name ?? "Alguien"} te invitó a "${grupo?.name ?? "un grupo"}"`,
      data: { type: "grupo_invite", grupoId: params.grupoId },
    });
  }
}

async function notifyGrupoGasto(params: {
  grupoId: string;
  actorId: string;
  paidBy: string;
  description: string;
  amount: number;
  partes: { user_id: string; amount: number }[];
}): Promise<void> {
  const recipients = params.partes.filter((p) => p.user_id !== params.actorId);
  if (recipients.length === 0) return;

  const admin = supabaseAdmin();
  const recipientIds = recipients.map((p) => p.user_id);
  const [{ data: grupo }, { data: payerProfile }, { data: users }, { data: profiles }] = await Promise.all([
    admin.from("grupos").select("name").eq("id", params.grupoId).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", params.paidBy).maybeSingle(),
    admin.schema("next_auth").from("users").select("id, email").in("id", recipientIds),
    admin.from("profiles").select("id, notification_prefs").in("id", recipientIds),
  ]);

  const emailById = new Map((users ?? []).map((u) => [u.id, u.email]));
  const prefsById = new Map((profiles ?? []).map((p) => [p.id, p.notification_prefs]));

  await Promise.all(
    recipients.map(async (p) => {
      if (prefsById.get(p.user_id)?.grupo_gasto === false) return;
      const email = emailById.get(p.user_id);
      if (email) {
        await sendEmail({
          to: email,
          subject: "Nuevo gasto compartido en Nexo",
          html: grupoGastoEmail({
            grupoName: grupo?.name ?? "tu grupo",
            payerName: payerProfile?.display_name ?? "Alguien",
            description: params.description,
            amount: params.amount,
            share: p.amount,
            link: `${process.env.NEXTAUTH_URL}/dashboard/juntos`,
          }),
        });
      }
      await sendPushNotification(p.user_id, {
        title: "Nuevo gasto compartido",
        body: `${payerProfile?.display_name ?? "Alguien"} añadió "${params.description}" en ${grupo?.name ?? "tu grupo"}`,
        data: { type: "grupo_gasto", grupoId: params.grupoId },
      });
    }),
  );
}

// --- Grupos ------------------------------------------------------------------

async function renameGrupo(userId: string, grupoId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) return { ok: false, error: "Nombre inválido" };
  const { error } = await supabaseAdmin().from("grupos").update({ name: trimmed }).eq("id", grupoId).eq("created_by", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function createGrupo(userId: string, name: string): Promise<ActionResult & { id?: string }> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) return { ok: false, error: "Nombre inválido" };
  const limit = await assertUnderLimit(userId, "grupos");
  if (!limit.ok) return { ok: false, error: limit.error, upgradeRequired: true };

  const admin = supabaseAdmin();
  const { data: grupo, error: e1 } = await admin.from("grupos").insert({ name: trimmed, created_by: userId }).select("id").single();
  if (e1 || !grupo) return { ok: false, error: e1?.message ?? "Error al crear el grupo" };

  const { error: e2 } = await admin
    .from("grupo_miembros")
    .insert({ grupo_id: grupo.id, user_id: userId, invited_by: userId, status: "accepted" });
  if (e2) return { ok: false, error: e2.message };
  return { ok: true, id: grupo.id };
}

async function deleteGrupo(userId: string, grupoId: string): Promise<ActionResult> {
  const { error } = await supabaseAdmin().from("grupos").delete().eq("id", grupoId).eq("created_by", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function leaveGrupo(userId: string, grupoId: string): Promise<ActionResult> {
  const { error } = await supabaseAdmin().from("grupo_miembros").delete().eq("grupo_id", grupoId).eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function inviteGrupoMember(userId: string, grupoId: string, email: string): Promise<ActionResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = supabaseAdmin();

  const { data: self } = await admin
    .from("grupo_miembros")
    .select("id")
    .eq("grupo_id", grupoId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  if (!self) return { ok: false, error: "No eres miembro de este grupo" };

  let targetUser: { id: string; password: string | null } | null = null;
  const { data: found } = await admin.schema("next_auth").from("users").select("id, password").eq("email", normalizedEmail).maybeSingle();
  targetUser = found;

  const hasAccount = !!targetUser?.password;
  if (!targetUser) {
    const { data: created, error: createErr } = await admin
      .schema("next_auth")
      .from("users")
      .insert({ email: normalizedEmail })
      .select("id, password")
      .single();
    if (createErr) {
      const { data: existing } = await admin.schema("next_auth").from("users").select("id, password").eq("email", normalizedEmail).maybeSingle();
      if (!existing) return { ok: false, error: "No se pudo crear la invitación" };
      targetUser = existing;
    } else {
      targetUser = created;
    }
  }
  if (targetUser.id === userId) return { ok: false, error: "No puedes invitarte a ti mismo" };

  const { error } = await admin.from("grupo_miembros").insert({ grupo_id: grupoId, user_id: targetUser.id, invited_by: userId, status: "pending" });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ese usuario ya es miembro del grupo" };
    return { ok: false, error: error.message };
  }

  await notifyGrupoInvite({ grupoId, inviterId: userId, targetUserId: targetUser.id, targetEmail: normalizedEmail, hasAccount });
  return { ok: true };
}

async function includeMemberInExistingGastos(grupoId: string, newUserId: string) {
  const admin = supabaseAdmin();
  const { data: gastos } = await admin.from("grupo_gastos").select("id, amount").eq("grupo_id", grupoId);
  if (!gastos || gastos.length === 0) return;

  const gastoIds = gastos.map((g) => g.id);
  const { data: partes } = await admin.from("grupo_gasto_partes").select("id, gasto_id, user_id, amount, settled").in("gasto_id", gastoIds);

  for (const gasto of gastos) {
    const gastoPartes = (partes ?? []).filter((p) => p.gasto_id === gasto.id);
    if (gastoPartes.length === 0) continue;
    if (gastoPartes.some((p) => p.user_id === newUserId)) continue;
    if (gastoPartes.some((p) => p.settled)) continue;

    const participantCount = gastoPartes.length + 1;
    const share = Math.round((gasto.amount / participantCount) * 100) / 100;
    const newUserShare = Math.round((gasto.amount - share * (participantCount - 1)) * 100) / 100;

    await Promise.all(gastoPartes.map((p) => admin.from("grupo_gasto_partes").update({ amount: share }).eq("id", p.id)));
    await admin.from("grupo_gasto_partes").insert({ gasto_id: gasto.id, user_id: newUserId, amount: newUserShare });
  }
}

async function respondToGrupoInvite(userId: string, grupoId: string, accept: boolean): Promise<ActionResult> {
  const status = accept ? "accepted" : "rejected";
  const { error } = await supabaseAdmin()
    .from("grupo_miembros")
    .update({ status })
    .eq("grupo_id", grupoId)
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  if (accept) await includeMemberInExistingGastos(grupoId, userId);
  return { ok: true };
}

const grupoGastoSchema = z.object({
  grupoId: z.string().uuid(),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(120),
  amount: z.coerce.number().positive("El importe debe ser mayor que 0"),
  occurredAt: z.string().optional(),
  paidBy: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1, "Debe haber al menos un participante"),
});

async function addGrupoGasto(userId: string, input: unknown): Promise<ActionResult> {
  const parsed = grupoGastoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;
  const admin = supabaseAdmin();

  const { data: self } = await admin
    .from("grupo_miembros")
    .select("id")
    .eq("grupo_id", d.grupoId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  if (!self) return { ok: false, error: "No eres miembro de este grupo" };

  const { data: gasto, error: e1 } = await admin
    .from("grupo_gastos")
    .insert({
      grupo_id: d.grupoId,
      paid_by: d.paidBy,
      description: d.description,
      amount: d.amount,
      occurred_at: d.occurredAt || new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (e1 || !gasto) return { ok: false, error: e1?.message ?? "Error al crear el gasto" };

  const partePorPersona = Math.round((d.amount / d.participantIds.length) * 100) / 100;
  const partes = d.participantIds.map((pid, i) => ({
    gasto_id: gasto.id,
    user_id: pid,
    amount:
      i === d.participantIds.length - 1
        ? Math.round((d.amount - partePorPersona * (d.participantIds.length - 1)) * 100) / 100
        : partePorPersona,
  }));

  const { error: e2 } = await admin.from("grupo_gasto_partes").insert(partes);
  if (e2) return { ok: false, error: e2.message };

  await notifyGrupoGasto({ grupoId: d.grupoId, actorId: userId, paidBy: d.paidBy, description: d.description, amount: d.amount, partes });
  return { ok: true };
}

async function deleteGrupoGasto(userId: string, gastoId: string): Promise<ActionResult> {
  const { error } = await supabaseAdmin().from("grupo_gastos").delete().eq("id", gastoId).eq("paid_by", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function settleWithMember(userId: string, grupoId: string, otherUserId: string): Promise<ActionResult> {
  const admin = supabaseAdmin();

  const { data: gastosByOther } = await admin.from("grupo_gastos").select("id").eq("grupo_id", grupoId).eq("paid_by", otherUserId);
  if (gastosByOther && gastosByOther.length > 0) {
    await admin
      .from("grupo_gasto_partes")
      .update({ settled: true, settled_at: new Date().toISOString() })
      .in("gasto_id", gastosByOther.map((g) => g.id))
      .eq("user_id", userId)
      .eq("settled", false);
  }

  const { data: gastosByMe } = await admin.from("grupo_gastos").select("id").eq("grupo_id", grupoId).eq("paid_by", userId);
  if (gastosByMe && gastosByMe.length > 0) {
    await admin
      .from("grupo_gasto_partes")
      .update({ settled: true, settled_at: new Date().toISOString() })
      .in("gasto_id", gastosByMe.map((g) => g.id))
      .eq("user_id", otherUserId)
      .eq("settled", false);
  }
  return { ok: true };
}

// --- Dispatcher ---------------------------------------------------------------

export async function POST(req: Request) {
  const userId = await requireUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const action = String(body.action ?? "");

  let result: ActionResult;
  switch (action) {
    case "renameGrupo":
      result = await renameGrupo(userId, String(body.grupoId ?? ""), String(body.name ?? ""));
      break;
    case "createGrupo":
      result = await createGrupo(userId, String(body.name ?? ""));
      break;
    case "deleteGrupo":
      result = await deleteGrupo(userId, String(body.grupoId ?? ""));
      break;
    case "leaveGrupo":
      result = await leaveGrupo(userId, String(body.grupoId ?? ""));
      break;
    case "inviteGrupoMember":
      result = await inviteGrupoMember(userId, String(body.grupoId ?? ""), String(body.email ?? ""));
      break;
    case "respondToGrupoInvite":
      result = await respondToGrupoInvite(userId, String(body.grupoId ?? ""), !!body.accept);
      break;
    case "addGrupoGasto":
      result = await addGrupoGasto(userId, body.input);
      break;
    case "deleteGrupoGasto":
      result = await deleteGrupoGasto(userId, String(body.gastoId ?? ""));
      break;
    case "settleWithMember":
      result = await settleWithMember(userId, String(body.grupoId ?? ""), String(body.otherUserId ?? ""));
      break;
    default:
      return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
