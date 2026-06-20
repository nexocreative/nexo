import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerAuthSession } from "@/lib/auth";
import { getOpenAI, VISION_MODEL } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORY_KEYS = [
  "supermercado", "restaurantes", "transporte", "ocio", "suscripciones",
  "salud", "hogar", "ropa", "otros",
];

const SYSTEM_PROMPT = `Eres un asistente que extrae datos de tickets de compra (recibos) a partir de una foto.
Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma exacta:
{
  "comercio": string,          // nombre del establecimiento
  "importe": number,           // importe TOTAL pagado, en euros, solo el número (ej. 23.45)
  "fecha": string,             // fecha del ticket en formato YYYY-MM-DD
  "categoria": string,         // una de: ${CATEGORY_KEYS.join(", ")}
  "items": [ { "nombre": string, "importe": number } ]  // líneas del ticket si se distinguen
}
Reglas:
- "categoria" DEBE ser exactamente uno de los valores permitidos; si dudas usa "otros".
- "importe" es el TOTAL del ticket (no líneas sueltas), como número con punto decimal.
- Si no puedes leer un dato, usa "" para textos, 0 para números y [] para items.
- No incluyas texto fuera del JSON.`;

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "Falta la imagen del ticket" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen supera los 10 MB" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  // 1) Extracción con GPT-4o Vision
  let extracted: Record<string, unknown>;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extrae los datos de este ticket en JSON." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });
    extracted = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error desconocido";
    return NextResponse.json({ error: `No se pudo analizar el ticket: ${msg}` }, { status: 502 });
  }

  // Normaliza categoría
  const cat = String(extracted.categoria ?? "").toLowerCase();
  const category = CATEGORY_KEYS.includes(cat) ? cat : "otros";

  // 2) Sube la imagen original a Storage (no fatal si falla)
  let receiptPath: string | null = null;
  try {
    const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${userId}/${randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin()
      .storage.from("receipts")
      .upload(path, buf, { contentType: mime, upsert: false });
    if (!error) receiptPath = path;
    else console.error("Error subiendo ticket:", error.message);
  } catch (e) {
    console.error("Error subiendo ticket:", e);
  }

  return NextResponse.json({
    data: {
      comercio: String(extracted.comercio ?? ""),
      importe: Number(extracted.importe) || 0,
      fecha: typeof extracted.fecha === "string" && extracted.fecha ? extracted.fecha : null,
      categoria: category,
      items: Array.isArray(extracted.items) ? extracted.items : [],
    },
    receiptPath,
  });
}
