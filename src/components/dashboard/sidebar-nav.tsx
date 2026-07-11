"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ArrowLeftRight,
  Gauge,
  BarChart3,
  Users,
  Palmtree,
  PiggyBank,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/anadir", label: "Añadir movimiento", icon: PlusCircle },
  { href: "/dashboard/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/dashboard/limites", label: "Límites", icon: Gauge },
  { href: "/dashboard/ahorro", label: "Ahorro", icon: PiggyBank },
  { href: "/dashboard/graficas", label: "Gráficas", icon: BarChart3 },
  { href: "/dashboard/juntos", label: "En conjunto", icon: Users },
  { href: "/dashboard/vacaciones", label: "Vacaciones", icon: Palmtree },
];

/** Contenido del nav, compartido entre el sidebar de escritorio y el drawer móvil. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-8">
      <Link href="/dashboard" onClick={onNavigate} className="px-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nexo.svg" alt="Nexo" width={120} height={39} className="block h-auto w-[120px] max-w-full" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
              )}
            >
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
