"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/app/dashboard/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryIcon } from "@/components/dashboard/category-icon";
import { CATEGORY_ICON_CHOICES, type CategoryDef } from "@/lib/constants";

/**
 * Modal de crear/editar una categoría propia. Se usa tanto desde Ajustes
 * (gestión completa) como desde cualquier selector de categoría (un "+" que
 * permite crearla al momento, sin salir del formulario en el que estás).
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CategoryDef | null;
  /** Se llama tras guardar con éxito, con la key de la categoría creada/editada. */
  onSaved?: (key: string) => void;
}) {
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [icon, setIcon] = React.useState<string>(CATEGORY_ICON_CHOICES[0]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setLabel(editing?.label ?? "");
      setIcon(editing?.icon ?? CATEGORY_ICON_CHOICES[0]);
    }
  }, [open, editing]);

  async function save() {
    if (!label.trim()) return;
    setSaving(true);
    if (editing) {
      const res = await updateCategory(editing.key, { label, icon });
      setSaving(false);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Categoría actualizada");
      onOpenChange(false);
      router.refresh();
      onSaved?.(editing.key);
    } else {
      const res = await createCategory({ label, icon });
      setSaving(false);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Categoría creada");
      onOpenChange(false);
      router.refresh();
      onSaved?.(res.id ?? "");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-label">Nombre</Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
              autoFocus
              className="mt-1.5"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Icono</p>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICON_CHOICES.map((name) => {
                const Icon = getCategoryIcon(name);
                const selected = icon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIcon(name)}
                    aria-label={name}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !label.trim()}
              className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
