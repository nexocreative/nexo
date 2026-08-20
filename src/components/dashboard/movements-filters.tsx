"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCategories } from "@/components/dashboard/categories-provider";
import { cn } from "@/lib/utils";

export function MovementsFilters({
  monthOptions,
}: {
  monthOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const categories = useCategories();

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex self-start rounded-full bg-muted p-1 sm:self-auto">
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

      <div className="flex gap-2 sm:ml-auto">
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            value={category}
            onChange={(e) => setParam("category", e.target.value || null)}
            className={cn(
              "w-full appearance-none rounded-full border py-2 pl-4 pr-9 text-sm font-semibold outline-none transition-colors focus:border-primary/50",
              category
                ? "border-primary/40 bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            value={month}
            onChange={(e) => setParam("month", e.target.value)}
            className="w-full appearance-none rounded-full border border-border bg-card py-2 pl-4 pr-9 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
