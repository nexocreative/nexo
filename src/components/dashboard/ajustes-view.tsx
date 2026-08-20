"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Sparkles, Plus, Pencil, Trash2 } from "lucide-react";
import { changePassword, updateNotificationPrefs } from "@/app/dashboard/settings-actions";
import { deleteCategory } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { CategoryFormDialog } from "@/components/dashboard/category-form-dialog";
import { PALETTE, type CategoryDef } from "@/lib/constants";
import { formatDate } from "@/lib/format";

interface NotificationPrefs {
  grupo_invite: boolean;
  grupo_gasto: boolean;
}

export function AjustesView({
  notificationPrefs,
  plan,
  currentPeriodEnd,
  hasPassword,
  customCategories,
}: {
  notificationPrefs: NotificationPrefs;
  plan: "free" | "plus";
  currentPeriodEnd: string | null;
  hasPassword: boolean;
  customCategories: CategoryDef[];
}) {
  return (
    <div className="space-y-6 pt-4">
      <PlanSection plan={plan} currentPeriodEnd={currentPeriodEnd} />
      {hasPassword ? (
        <PasswordSection />
      ) : (
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Contraseña</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Entraste con Google, así que no tienes contraseña que cambiar aquí. Sigue usando
            &quot;Continuar con Google&quot; para entrar en Nexo.
          </p>
        </section>
      )}
      <CategoriesSection initial={customCategories} />
      <NotificationsSection initial={notificationPrefs} />
    </div>
  );
}

function PlanSection({ plan, currentPeriodEnd }: { plan: "free" | "plus"; currentPeriodEnd: string | null }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {plan === "plus" ? "Nexo Plus" : "Plan gratuito"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {plan === "plus"
                ? currentPeriodEnd
                  ? `Se renueva el ${formatDate(currentPeriodEnd.slice(0, 10))}`
                  : "Tu suscripción está activa"
                : "Sin funciones de IA, historial limitado a 3 meses"}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/plus"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
        >
          {plan === "plus" ? "Gestionar suscripción" : "Hazte Plus"}
        </Link>
      </div>
    </section>
  );
}

function PasswordSection() {
  const [loading, setLoading] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const currentPassword = String(data.get("currentPassword"));
    const newPassword = String(data.get("newPassword"));
    const confirmPassword = String(data.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.ok) {
      toast.success("Contraseña actualizada");
      formRef.current?.reset();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Cambiar contraseña</h3>
      <p className="text-sm text-muted-foreground">
        Elige una contraseña de al menos 8 caracteres.
      </p>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-5 max-w-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Contraseña actual</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showCurrent ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showNew ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar contraseña
        </Button>
      </form>
    </section>
  );
}

/**
 * Categorías propias del usuario, además de las 10 por defecto (fijas, no
 * aparecen aquí). Crear/editar abre un modal con nombre + icono; borrar no
 * reasigna los gastos ya guardados con esa categoría, simplemente dejan de
 * reconocerse y se muestran como "Otros" (mismo fallback de getCategory()).
 */
function CategoriesSection({ initial }: { initial: CategoryDef[] }) {
  const router = useRouter();
  const [categories, setCategories] = React.useState(initial);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryDef | null>(null);
  const [deleting, setDeleting] = React.useState<CategoryDef | null>(null);
  const [deletingBusy, setDeletingBusy] = React.useState(false);

  React.useEffect(() => setCategories(initial), [initial]);

  async function handleDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    const res = await deleteCategory(deleting.key);
    setDeletingBusy(false);
    if (res.ok) {
      toast.success("Categoría eliminada");
      setDeleting(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Categorías</h3>
          <p className="text-sm text-muted-foreground">
            Además de las 10 categorías de Nexo, añade las tuyas propias para gastos más específicos.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nueva
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Aún no has añadido ninguna categoría propia.</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 p-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CategoryIcon category={c.key} categories={categories} className="h-[18px] w-[18px]" />
                </span>
                <span className="truncate text-sm font-semibold text-foreground">{c.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => { setEditing(c); setShowForm(true); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog open={showForm} onOpenChange={setShowForm} editing={editing} />

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h4 className="text-base font-bold text-foreground">¿Eliminar &ldquo;{deleting.label}&rdquo;?</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Los gastos que ya tengas con esta categoría no se borran, pero dejarán de mostrarla y pasarán a verse como &ldquo;Otros&rdquo;.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingBusy}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deletingBusy ? "..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function NotificationsSection({ initial }: { initial: NotificationPrefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = React.useState(initial);
  const [pending, setPending] = React.useState<keyof NotificationPrefs | null>(null);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPending(key);
    const res = await updateNotificationPrefs(next);
    setPending(null);

    if (res.ok) {
      router.refresh();
    } else {
      setPrefs(prefs);
      toast.error(res.error);
    }
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-foreground">Notificaciones por email</h3>
      <p className="text-sm text-muted-foreground">
        Elige qué avisos quieres recibir por email.
      </p>
      <ul className="mt-5 space-y-4">
        <li className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Invitaciones a grupos</p>
            <p className="text-xs text-muted-foreground">
              Cuando alguien te invita a un grupo compartido.
            </p>
          </div>
          <Switch
            checked={prefs.grupo_invite}
            disabled={pending === "grupo_invite"}
            onCheckedChange={(v) => toggle("grupo_invite", v)}
          />
        </li>
        <li className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Gastos nuevos en grupos</p>
            <p className="text-xs text-muted-foreground">
              Cuando se registra un gasto compartido en uno de tus grupos.
            </p>
          </div>
          <Switch
            checked={prefs.grupo_gasto}
            disabled={pending === "grupo_gasto"}
            onCheckedChange={(v) => toggle("grupo_gasto", v)}
          />
        </li>
      </ul>
    </section>
  );
}
