import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  const { email } = parsed.data;
  const admin = supabaseAdmin();

  const { data: user } = await admin
    .schema("next_auth")
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  // No revela si el email existe o no: siempre responde ok.
  if (user?.email) {
    await admin.schema("next_auth").from("verification_tokens").delete().eq("identifier", user.email);

    const token = randomUUID();
    const expires = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    await admin
      .schema("next_auth")
      .from("verification_tokens")
      .insert({ identifier: user.email, token, expires });

    const link = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Recupera tu contraseña de Nexo",
      html: passwordResetEmail({ link }),
    });
  }

  return NextResponse.json({ ok: true });
}
