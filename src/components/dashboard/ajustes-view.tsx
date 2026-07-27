"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { changePassword, updateNotificationPrefs } from "@/app/dashboard/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationPrefs {
  grupo_invite: boolean;
  grupo_gasto: boolean;
}

export function AjustesView({ notificationPrefs }: { notificationPrefs: NotificationPrefs }) {
  return (
    <div className="space-y-6 pt-4">
      <PasswordSection />
      <NotificationsSection initial={notificationPrefs} />
    </div>
  );
}

function PasswordSection() {
  const [loading, setLoading] = React.useState(false);
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
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar contraseña
        </Button>
      </form>
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
