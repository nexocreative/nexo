// Crea (si no existen) el producto "Nexo Plus" y sus dos precios en Stripe.
// Uso: node scripts/setup-stripe-prices.mjs
// Requiere STRIPE_SECRET_KEY en .env.local (lo rellena `vercel integration add stripe`).
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
}

if (!env.STRIPE_SECRET_KEY) {
  console.log("❌ Falta STRIPE_SECRET_KEY en .env.local. Conecta primero la integración de Stripe.");
  process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const PRICES = [
  { lookup_key: "nexo_plus_monthly", unit_amount: 299, interval: "month", label: "Mensual (2,99 €)" },
  { lookup_key: "nexo_plus_annual", unit_amount: 1999, interval: "year", label: "Anual (19,99 €)" },
];

const { data: existingPrices } = await stripe.prices.list({
  lookup_keys: PRICES.map((p) => p.lookup_key),
  active: true,
});

let product = existingPrices[0]?.product
  ? await stripe.products.retrieve(existingPrices[0].product)
  : null;

if (!product) {
  const { data: products } = await stripe.products.search({ query: `name:"Nexo Plus"` });
  product = products[0] ?? (await stripe.products.create({ name: "Nexo Plus", description: "Suscripción premium de Nexo" }));
}

console.log(`Producto: ${product.name} (${product.id})`);

const results = {};
for (const p of PRICES) {
  const found = existingPrices.find((ep) => ep.lookup_key === p.lookup_key);
  if (found) {
    results[p.lookup_key] = found.id;
    console.log(`✅ Ya existía · ${p.label}: ${found.id}`);
    continue;
  }
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: p.unit_amount,
    recurring: { interval: p.interval },
    lookup_key: p.lookup_key,
  });
  results[p.lookup_key] = price.id;
  console.log(`✅ Creado · ${p.label}: ${price.id}`);
}

console.log("\nAñade esto a .env.local (y a las variables de entorno de Vercel):\n");
console.log(`STRIPE_PRICE_MONTHLY=${results.nexo_plus_monthly}`);
console.log(`STRIPE_PRICE_ANNUAL=${results.nexo_plus_annual}`);
