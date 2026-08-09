import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isLoginThrottled, recordLoginAttempt } from "@/lib/rate-limit";

// Sesión de 30 días, igual que el maxAge por defecto de NextAuth en la web.
const MOBILE_SESSION_SECONDS = 60 * 60 * 24 * 30;

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

/**
 * Login para la app móvil (Expo). No hay sesión de NextAuth en RN, así que
 * este endpoint reproduce la validación de `authorize()` en `lib/auth.ts` y
 * devuelve directamente un JWT firmado con SUPABASE_JWT_SECRET para que la
 * app pueda usarlo como Authorization header contra Supabase (RLS vía
 * `auth.jwt()->>'sub'`, igual que `supabaseForUser` en la web).
 */
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

  const { email, password } = parsed.data;

  if (await isLoginThrottled(email)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const admin = supabaseAdmin();

  const { data: user } = await admin
    .schema("next_auth")
    .from("users")
    .select("id, name, email, password")
    .eq("email", email)
    .maybeSingle();

  if (!user?.password) {
    await recordLoginAttempt(email, false);
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await recordLoginAttempt(email, false);
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  await recordLoginAttempt(email, true);

  const signingSecret = process.env.SUPABASE_JWT_SECRET;
  if (!signingSecret) {
    console.error("Falta SUPABASE_JWT_SECRET en el entorno.");
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + MOBILE_SESSION_SECONDS;
  const token = jwt.sign(
    {
      aud: "authenticated",
      exp: expiresAt,
      sub: user.id,
      email: user.email,
      role: "authenticated",
    },
    signingSecret,
  );

  return NextResponse.json({
    token,
    expiresAt,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
