import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerAuthSession } from "@/lib/auth";
import { getOpenAI, VISION_MODEL } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

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
- "fecha": usa el año que aparezca en el ticket. Si el año NO se ve con claridad, usa el AÑO ACTUAL. Nunca inventes años pasados; un ticket reciente casi siempre es de este año.
- Si no puedes leer la fecha, déjala como "".
- Si no puedes leer un dato, usa "" para textos, 0 para números y [] para items.
- No incluyas texto fuera del JSON.`;

/** Valida la fecha extraída: si es inválida o cae fuera de una ventana
 *  razonable (más de ~18 meses atrás o en el futuro), usa la de hoy.
 *  Evita que un año mal leído por la IA esconda el gasto en otro mes. */
function sanitizeTicketDate(value: unknown): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return todayStr;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return todayStr;
  const minDate = new Date(today);
  minDate.setMonth(minDate.getMonth() - 18);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 2);
  if (d < minDate || d > maxDate) return todayStr;
  return value;
}

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

  // Límite: máximo 3 análisis por minuto y usuario.
  const rl = await checkAndRecordRateLimit(userId, "ticket", 3, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Has analizado varios tickets seguidos. Espera un momento e inténtalo de nuevo." },
      { status: 429 },
    );
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
            { type: "text", text: `Hoy es ${new Date().toISOString().slice(0, 10)}. Extrae los datos de este ticket en JSON.` },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });
    extracted = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch (e) {
    console.error("Error analizando ticket:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Ahora mismo no podemos analizar el ticket. Inténtalo de nuevo más tarde." },
      { status: 502 },
    );
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
      fecha: sanitizeTicketDate(extracted.fecha),
      categoria: category,
      items: Array.isArray(extracted.items) ? extracted.items : [],
    },
    receiptPath,
  });
}
