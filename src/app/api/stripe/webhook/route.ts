import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { nexoPlusActivatedEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

async function upsertFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const item = subscription.items.data[0];

  const { error } = await supabaseAdmin()
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: item?.price.id ?? null,
      status: subscription.status,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) console.error("Error actualizando subscriptions desde webhook:", error.message);
}

/** Email de bienvenida, solo la primera vez que se activa (no en cada renovación). */
async function sendPlusWelcomeEmail(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const admin = supabaseAdmin();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!sub) return;

  const { data: user } = await admin
    .schema("next_auth")
    .from("users")
    .select("email")
    .eq("id", sub.user_id)
    .maybeSingle();
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "¡Bienvenida a Nexo Plus!",
    html: nexoPlusActivatedEmail({ link: `${process.env.NEXTAUTH_URL}/dashboard/plus` }),
  });
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    console.error("Firma de webhook de Stripe inválida:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
          const subId =
            typeof checkoutSession.subscription === "string"
              ? checkoutSession.subscription
              : checkoutSession.subscription.id;
          const subscription = await getStripe().subscriptions.retrieve(subId);
          await upsertFromSubscription(subscription);
          await sendPlusWelcomeEmail(subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Error procesando webhook de Stripe:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
