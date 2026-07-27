import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;
  const admin = supabaseAdmin();

  const { data: verification } = await admin
    .schema("next_auth")
    .from("verification_tokens")
    .select("identifier, expires")
    .eq("token", token)
    .maybeSingle();

  if (!verification || new Date(verification.expires).getTime() < Date.now()) {
    return NextResponse.json({ error: "El enlace no es válido o ha caducado" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { error } = await admin
    .schema("next_auth")
    .from("users")
    .update({ password: passwordHash })
    .eq("email", verification.identifier);

  if (error) {
    console.error("Error actualizando contraseña:", error);
    return NextResponse.json({ error: "No se pudo actualizar la contraseña" }, { status: 500 });
  }

  await admin.schema("next_auth").from("verification_tokens").delete().eq("token", token);

  return NextResponse.json({ ok: true });
}
