"use client";

import Link from "next/link";
import { Download, Lock } from "lucide-react";
import type { MovementRow } from "@/components/dashboard/movements-list";

/**
 * Neutraliza la inyección de fórmulas CSV: si Excel/Sheets abre una celda que
 * empieza por = + - @ (o tab/retorno de carro), la interpreta como fórmula en
 * vez de texto. El comercio/descripción puede venir de texto libre o de la IA,
 * así que se antepone un apóstrofo para forzar que se lea como texto literal.
 */
function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function toCsv(rows: MovementRow[]): string {
  const header = ["Fecha", "Tipo", "Categoría", "Comercio/Descripción", "Importe"];
  const lines = rows.map((r) => {
    const tipo = r.type === "income" ? "Ingreso" : r.type === "savings" ? "Ahorro" : "Gasto";
    const concepto = sanitizeCsvCell(r.merchant || r.description || "").replace(/"/g, '""');
    return [r.occurred_at, tipo, r.cat.label, `"${concepto}"`, r.amount.toFixed(2)].join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

export function ExportCsvButton({ rows, plan }: { rows: MovementRow[]; plan: "free" | "plus" }) {
  if (plan !== "plus") {
    return (
      <Link
        href="/dashboard/plus"
        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40"
        title="Exportar a CSV es una función de Nexo Plus"
      >
        <Lock className="h-4 w-4" /> Exportar CSV
      </Link>
    );
  }

  function download() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexo-movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
    >
      <Download className="h-4 w-4" /> Exportar CSV
    </button>
  );
}
