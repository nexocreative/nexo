import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireUserIdFromRequest } from "@/lib/mobile-auth";

export const runtime = "nodejs";

// Etiqueta fija para comparar este flujo de checkout en el Dashboard de Stripe.
const INTEGRATION_IDENTIFIER = "nexo_plus_qkxmvbdt";

export async function POST(req: Request) {
  const userId = await requireUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let plan: "monthly" | "annual" = "monthly";
  try {
    const body = await req.json();
    if (body?.plan === "annual") plan = "annual";
  } catch {
    // sin body -> mensual por defecto
  }

  const priceId = plan === "annual" ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) {
    return NextResponse.json({ error: "Nexo Plus no está configurado todavía" }, { status: 500 });
  }

  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  const stripe = getStripe();
  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const { data: user } = await admin.schema("next_auth").from("users").select("email").eq("id", userId).maybeSingle();
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      metadata: { nexo_user_id: userId },
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: "user_id" });
  }

  const origin = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/plus?checkout=success`,
    cancel_url: `${origin}/dashboard/plus?checkout=cancel`,
    integration_identifier: INTEGRATION_IDENTIFIER,
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }
  return NextResponse.json({ url: checkoutSession.url });
}
