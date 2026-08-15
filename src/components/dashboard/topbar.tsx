"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, Users, AlertTriangle, Check, X } from "lucide-react";
import { UserNav } from "@/components/dashboard/user-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { respondToGrupoInvite, markNotificationsRead } from "@/app/dashboard/actions";
import { toast } from "sonner";
import type { GrupoInvite, AppNotification } from "@/types/database";

const titles: Record<string, string> = {
  "/dashboard": "Resumen",
  "/dashboard/anadir": "Añadir movimiento",
  "/dashboard/movimientos": "Movimientos",
  "/dashboard/limites": "Límites y alertas",
  "/dashboard/ahorro": "Ahorro",
  "/dashboard/graficas": "Gráficas",
  "/dashboard/juntos": "En conjunto",
  "/dashboard/vacaciones": "Vacaciones",
  "/dashboard/ajustes": "Ajustes",
  "/dashboard/plus": "Nexo Plus",
};

export function Topbar({
  name,
  email,
  image,
  pendingInvites = [],
  notifications = [],
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  pendingInvites?: GrupoInvite[];
  notifications?: AppNotification[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = titles[pathname] ?? "Nexo";
  const [open, setOpen] = React.useState(false);
  const [responding, setResponding] = React.useState<string | null>(null);
  // Ids marcados como leídos localmente (optimista, antes de que el servidor
  // confirme): así una notificación nueva que llegue después de abrir la
  // campanita una vez sigue mostrando el punto rojo.
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const ref = React.useRef<HTMLDivElement>(null);
  const hasUnread = pendingInvites.length > 0 || notifications.some((n) => !n.read && !readIds.has(n.id));

  function handleToggle() {
    setOpen((v) => {
      const next = !v;
      const unread = notifications.filter((n) => !n.read);
      if (next && unread.length > 0) {
        setReadIds((prev) => {
          const next = new Set(prev);
          unread.forEach((n) => next.add(n.id));
          return next;
        });
        markNotificationsRead().catch(() => {});
      }
      return next;
    });
  }

  // Cerrar al hacer clic fuera o al pulsar Escape
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  async function handleRespond(grupoId: string, accept: boolean) {
    setResponding(grupoId);
    const res = await respondToGrupoInvite(grupoId, accept);
    setResponding(null);
    if (res.ok) {
      toast.success(accept ? "Te has unido al grupo" : "Invitación rechazada");
      setOpen(false);
      if (accept) router.push("/dashboard/juntos");
      else router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8 lg:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Campanita con dropdown */}
        <div ref={ref} className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={handleToggle}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {hasUnread && (
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Notificaciones</p>
              </div>
              {pendingInvites.length === 0 && notifications.length === 0 ? (
                <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                  Sin notificaciones
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {pendingInvites.map((inv) => (
                    <li key={inv.grupo_id} className="flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          Invitación a &quot;{inv.grupo_name}&quot;
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {inv.invited_by_name ?? inv.invited_by_email ?? "Alguien"} te ha invitado
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleRespond(inv.grupo_id, true)}
                            disabled={responding === inv.grupo_id}
                            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                          >
                            <Check className="h-3 w-3" />
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleRespond(inv.grupo_id, false)}
                            disabled={responding === inv.grupo_id}
                            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                          >
                            <X className="h-3 w-3" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {notifications.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && !readIds.has(n.id) && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <UserNav name={name} email={email} image={image} />
      </div>
    </header>
  );
}
