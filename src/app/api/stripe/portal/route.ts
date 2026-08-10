import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  const { data: sub } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No tienes ninguna suscripción todavía" }, { status: 400 });
  }

  const origin = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/dashboard/plus`,
  });

  return NextResponse.json({ url: portalSession.url });
}
