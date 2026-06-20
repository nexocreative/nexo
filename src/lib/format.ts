/** Utilidades de formato compartidas (moneda, fechas, meses). */

export function formatEUR(amount: number, opts?: { sign?: boolean }): string {
  const formatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  if (opts?.sign) {
    return `${amount < 0 ? "−" : "+"}${formatted}`;
  }
  return amount < 0 ? `−${formatted}` : formatted;
}

export function formatEURCompact(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Etiqueta corta para el eje Y de las gráficas: muestra el valor real
 *  (ej. "150 €") y usa "k" solo a partir de 1.000 (ej. "1,5k €"). */
export function formatAxisEUR(v: number): string {
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1).replace(".", ",")}k €`;
  }
  return `${Math.round(v)} €`;
}

/** "YYYY-MM" del mes de una fecha. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MONTHS_ES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function monthLabel(d: Date): string {
  return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthShort(d: Date): string {
  return MONTHS_ES_SHORT[d.getMonth()];
}

/** Fecha legible: "12 oct, 14:30" a partir de un ISO date/datetime. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ES_SHORT[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}
