"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MovementsFilters({
  monthOptions,
}: {
  monthOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const type = params.get("type") ?? "all";
  const category = params.get("category") ?? "";
  const month = params.get("month") ?? monthOptions[0]?.value;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  const types = [
    { key: "all", label: "Todos" },
    { key: "expense", label: "Gastos" },
    { key: "income", label: "Ingresos" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-full bg-muted p-1">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => setParam("type", t.key === "all" ? null : t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              type === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setParam("category", e.target.value || null)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-colors focus:border-primary/50",
            category
              ? "border-primary/40 bg-accent text-accent-foreground"
              : "border-border bg-card text-foreground",
          )}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setParam("month", e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
