"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";
import { UserNav } from "@/components/dashboard/user-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";

const titles: Record<string, string> = {
  "/dashboard": "Resumen",
  "/dashboard/anadir": "Añadir movimiento",
  "/dashboard/movimientos": "Movimientos",
  "/dashboard/limites": "Límites y alertas",
  "/dashboard/ahorro": "Ahorro",
  "/dashboard/graficas": "Gráficas",
  "/dashboard/juntos": "En conjunto",
  "/dashboard/vacaciones": "Vacaciones",
};

export function Topbar({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Overview";

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8 lg:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar..."
            className="h-10 w-56 rounded-full border border-border/70 bg-card pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <button
          type="button"
          aria-label="Notificaciones"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Ajustes"
          className="hidden h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>

        <UserNav name={name} email={email} image={image} />
      </div>
    </header>
  );
}
