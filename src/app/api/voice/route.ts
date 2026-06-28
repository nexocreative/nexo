import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getOpenAI, WHISPER_MODEL, VISION_MODEL } from "@/lib/openai";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORY_KEYS = [
  "supermercado", "restaurantes", "transporte", "ocio", "suscripciones",
  "salud", "hogar", "ropa", "otros",
];

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
  if (!file) return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "El audio supera los 20 MB" }, { status: 413 });
  }

  // Límite: máximo 3 grabaciones por minuto y usuario.
  const rl = await checkAndRecordRateLimit(userId, "voice", 3, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Has usado la voz varias veces seguidas. Espera un momento e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  // 1) Transcripción con Whisper
  let transcript = "";
  try {
    const tr = await getOpenAI().audio.transcriptions.create({
      file,
      model: WHISPER_MODEL,
      language: "es",
    });
    transcript = tr.text?.trim() ?? "";
  } catch (e) {
    console.error("Error transcribiendo audio:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Ahora mismo no podemos procesar la voz. Inténtalo de nuevo más tarde." },
      { status: 502 },
    );
  }
  if (!transcript) {
    return NextResponse.json({ error: "No se entendió el audio. Inténtalo de nuevo." }, { status: 422 });
  }

  // 2) Extracción estructurada con GPT-4o
  const today = new Date().toISOString().slice(0, 10);
  const system = `Eres un asistente que convierte una frase hablada sobre un gasto en JSON.
La fecha de hoy es ${today}. Devuelve EXCLUSIVAMENTE un objeto JSON:
{
  "comercio": string,   // dónde o en qué se gastó (ej. "Gasolinera", "Mercadona", "Cena")
  "importe": number,    // cantidad en euros, solo el número (ej. 50)
  "fecha": string,      // YYYY-MM-DD; resuelve "hoy"/"ayer" respecto a ${today}
  "categoria": string   // una de: ${CATEGORY_KEYS.join(", ")}
}
Reglas: si falta un dato usa "" / 0; "categoria" debe ser uno de los permitidos (si dudas, "otros"). Solo el JSON.`;

  let extracted: Record<string, unknown> = {};
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: transcript },
      ],
    });
    extracted = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch (e) {
    console.error("Error extrayendo datos de voz:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Ahora mismo no podemos procesar la voz. Inténtalo de nuevo más tarde.", transcript },
      { status: 502 },
    );
  }

  const cat = String(extracted.categoria ?? "").toLowerCase();
  const category = CATEGORY_KEYS.includes(cat) ? cat : "otros";

  return NextResponse.json({
    transcript,
    data: {
      comercio: String(extracted.comercio ?? ""),
      importe: Number(extracted.importe) || 0,
      fecha: typeof extracted.fecha === "string" && extracted.fecha ? extracted.fecha : null,
      categoria: category,
    },
  });
}
