import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getOpenAI, WHISPER_MODEL, VISION_MODEL } from "@/lib/openai";

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
    const msg = e instanceof Error ? e.message : "error desconocido";
    return NextResponse.json({ error: `No se pudo transcribir el audio: ${msg}` }, { status: 502 });
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
    const msg = e instanceof Error ? e.message : "error desconocido";
    return NextResponse.json({ error: `No se pudieron extraer los datos: ${msg}`, transcript }, { status: 502 });
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
