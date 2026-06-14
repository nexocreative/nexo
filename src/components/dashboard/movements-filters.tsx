"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/dashboard/category-icon";
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
    <div className="space-y-4">
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
        <select
          value={month}
          onChange={(e) => setParam("month", e.target.value)}
          className="ml-auto rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setParam("category", null)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            !category ? "bg-foreground text-background" : "border border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          Todas
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setParam("category", category === c.key ? null : c.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              category === c.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
            )}
          >
            <CategoryIcon category={c.key} className="h-3.5 w-3.5" />
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
