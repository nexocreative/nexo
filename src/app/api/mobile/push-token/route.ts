import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireUserIdFromRequest } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await requireUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.token) return NextResponse.json({ error: "Falta el token" }, { status: 400 });

  const { error } = await supabaseAdmin().from("profiles").update({ push_token: body.token }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
