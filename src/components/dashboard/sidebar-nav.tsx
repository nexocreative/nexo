"use client";

import { Fragment } from "react";
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
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { PALETTE } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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

/** Envuelve en tooltip solo cuando está colapsado: con el texto visible sobraría. */
function WithTooltip({ collapsed, label, children }: { collapsed: boolean; label: string; children: React.ReactElement }) {
  if (!collapsed) return <Fragment>{children}</Fragment>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Contenido del nav, compartido entre el sidebar de escritorio y el drawer
 * móvil. `collapsed`/`onToggleCollapsed` solo los pasa el sidebar de
 * escritorio (sidebar.tsx): el drawer móvil siempre se ve expandido y sin
 * botón de colapsar, no tiene sentido ahí.
 */
export function SidebarNav({
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col gap-8">
        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between px-1")}>
          {collapsed ? (
            <Link href="/dashboard" onClick={onNavigate} aria-label="Nexo" className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-nexo-mark.svg" alt="" width={17} height={32} className="block h-8 w-auto" />
            </Link>
          ) : (
            <Link href="/dashboard" onClick={onNavigate} className="min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-nexo.svg" alt="Nexo" width={120} height={39} className="block h-auto w-[120px] max-w-full" />
            </Link>
          )}
          {onToggleCollapsed && (
            <WithTooltip collapsed={collapsed} label="Expandir menú">
              <button
                onClick={onToggleCollapsed}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                title={collapsed ? undefined : "Colapsar menú"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
              </button>
            </WithTooltip>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <WithTooltip key={link.href} collapsed={collapsed} label={link.label}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
                  )}
                >
                  <link.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && link.label}
                </Link>
              </WithTooltip>
            );
          })}
        </nav>

        {/* Separado del resto: no es una sección más, es el upsell de la cuenta. */}
        <div className="border-t border-border/60 pt-3">
          <WithTooltip collapsed={collapsed} label="Nexo Plus">
            <Link
              href="/dashboard/plus"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition hover:brightness-90",
                collapsed && "justify-center px-0",
                pathname.startsWith("/dashboard/plus") && "ring-1 ring-primary/40",
              )}
              style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
            >
              <Sparkles className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && "Nexo Plus"}
            </Link>
          </WithTooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
