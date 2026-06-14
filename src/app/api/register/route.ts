import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80).optional(),
  email: z.string().trim().toLowerCase().email("Email no válido"),
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

  const { name, email, password } = parsed.data;
  const admin = supabaseAdmin();

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: created, error } = await admin
    .schema("next_auth")
    .from("users")
    .insert({ email, name: name ?? email.split("@")[0], password: passwordHash })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation (email ya registrado)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 },
      );
    }
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "No se pudo crear la cuenta" },
      { status: 500 },
    );
  }

  // Crea el perfil asociado.
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.id,
    display_name: name ?? email.split("@")[0],
    currency: "EUR",
  });

  if (profileError) {
    console.error("Error creando perfil:", profileError);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
