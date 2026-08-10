import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Cliente de Stripe. Solo servidor. */
export function getStripe(): Stripe {
  if (client) return client;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Falta STRIPE_SECRET_KEY en el entorno.");
  }
  client = new Stripe(apiKey);
  return client;
}
