import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getServerAuthSession } from "@/lib/auth";
import { getOpenAI, VISION_MODEL } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 350;
const ACCEPTED_EXT = [".csv", ".xlsx", ".xls"];
const AMOUNT_EPSILON = 0.01;

const SYSTEM_PROMPT = `Eres un asistente que normaliza extractos bancarios (Excel/CSV) exportados por distintos bancos, con formatos de columnas variables.
Recibirás las filas crudas del archivo (una por línea, columnas separadas por tabulador).
Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma exacta:
{
  "movimientos": [
    {
      "fila": number,           // índice de la fila original (0-based) tal como te la pasan
      "fecha": string,          // YYYY-MM-DD; si no se puede determinar, ""
      "descripcion": string,    // concepto/comercio tal como aparece
      "importe": number,        // SIEMPRE positivo, con punto decimal
      "tipo": string,           // "expense" si es un cargo/gasto, "income" si es un abono/ingreso
      "categoria": string       // una de: ${CATEGORY_KEYS.join(", ")}, o "" si es un ingreso
    }
  ]
}
Reglas:
- Ignora filas de cabecera, saldo, totales o líneas vacías/irrelevantes.
- "importe" es siempre positivo; el signo lo indica "tipo", no el número.
- Determina "tipo" por el signo original o por columnas tipo "Cargo/Abono", "Debe/Haber", etc.
- "categoria" DEBE ser uno de los valores permitidos si tipo="expense"; usa "otros" si dudas. Para tipo="income" usa "".
- No inventes movimientos que no estén en los datos. No incluyas texto fuera del JSON.`;

interface NormalizedRow {
  fila: number;
  fecha: string | null;
  descripcion: string;
  importe: number;
  tipo: "expense" | "income";
  categoria: string | null;
  posible_duplicado: boolean;
  fecha_invalida: boolean;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

/** Enmascara datos sensibles (IBAN, DNI/NIE, tarjetas/cuentas/teléfonos) antes
 *  de que el texto salga hacia la IA. No hace falta el dato real para
 *  categorizar un movimiento, solo su descripción general. */
function redactSensitive(text: string): string {
  return text
    .replace(/\b[A-Z]{2}\d{2}\s?(?:[A-Z0-9]{4}\s?){2,7}[A-Z0-9]{0,4}\b/g, "[IBAN]")
    .replace(/\b\d{8}[A-Z]\b/g, "[DNI]")
    .replace(/\b[XYZ]\d{7}[A-Z]\b/g, "[NIE]")
    .replace(/\b\d{9,}\b/g, "[NUM]");
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
  if (!file) return NextResponse.json({ error: "Falta el archivo del extracto" }, { status: 400 });

  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXT.some((ext) => name.endsWith(ext))) {
    return NextResponse.json(
      { error: "Formato no soportado. Sube un archivo .csv, .xlsx o .xls." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 5 MB" }, { status: 413 });
  }

  // Límite: máximo 3 importaciones por minuto y usuario.
  const rl = await checkAndRecordRateLimit(userId, "import", 3, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Has importado varios extractos seguidos. Espera un momento e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  let sheetRows: unknown[][];
  try {
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  } catch (e) {
    console.error("Error leyendo el archivo de extracto:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "No pudimos leer el archivo. Comprueba que sea un Excel o CSV válido." },
      { status: 400 },
    );
  }

  const nonEmptyRows = sheetRows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
  if (nonEmptyRows.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene filas con datos." }, { status: 400 });
  }
  if (nonEmptyRows.length > MAX_ROWS) {
    return NextResponse.json(
      {
        error: `El archivo tiene demasiadas filas (${nonEmptyRows.length}). Divide el extracto en partes de máximo ${MAX_ROWS} movimientos e impórtalas por separado.`,
      },
      { status: 422 },
    );
  }

  const serializedRows = nonEmptyRows
    .map((row, i) => `${i}\t${row.map((cell) => redactSensitive(String(cell ?? ""))).join("\t")}`)
    .join("\n");

  let extracted: { movimientos?: unknown[] };
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Hoy es ${new Date().toISOString().slice(0, 10)}. Estas son las filas del extracto (fila 0 = primera fila de datos):\n\n${serializedRows}`,
        },
      ],
    });
    extracted = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch (e) {
    console.error("Error analizando extracto:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Ahora mismo no podemos analizar el extracto. Inténtalo de nuevo más tarde." },
      { status: 502 },
    );
  }

  const rawRows = Array.isArray(extracted.movimientos) ? extracted.movimientos : [];

  const normalized: NormalizedRow[] = rawRows.map((raw, i) => {
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const fecha = isValidIsoDate(r.fecha) ? r.fecha : null;
    const tipo: "expense" | "income" = r.tipo === "income" ? "income" : "expense";
    const catRaw = String(r.categoria ?? "").toLowerCase();
    const categoria = tipo === "income" ? null : CATEGORY_KEYS.includes(catRaw as (typeof CATEGORY_KEYS)[number]) ? catRaw : "otros";
    return {
      fila: Number(r.fila) || i,
      fecha,
      descripcion: String(r.descripcion ?? "").slice(0, 240),
      importe: Math.abs(Number(r.importe) || 0),
      tipo,
      categoria,
      posible_duplicado: false,
      fecha_invalida: fecha === null,
    };
  }).filter((r) => r.importe > 0 || r.descripcion !== "");

  // Detección de posibles duplicados contra transacciones ya existentes.
  const datedRows = normalized.filter((r) => r.fecha !== null);
  if (datedRows.length > 0) {
    const dates = datedRows.map((r) => r.fecha as string).sort();
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const { data: existing } = await supabaseAdmin()
      .from("transactions")
      .select("amount, occurred_at, type")
      .eq("user_id", userId)
      .gte("occurred_at", minDate)
      .lte("occurred_at", maxDate);

    if (existing && existing.length > 0) {
      for (const row of datedRows) {
        row.posible_duplicado = existing.some(
          (tx) =>
            tx.occurred_at === row.fecha &&
            tx.type === row.tipo &&
            Math.abs(Number(tx.amount) - row.importe) < AMOUNT_EPSILON,
        );
      }
    }
  }

  return NextResponse.json({ rows: normalized, totalFilas: normalized.length });
}
