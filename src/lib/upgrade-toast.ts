import { toast } from "sonner";

interface RouterLike {
  push: (href: string) => void;
}

/** Toast de bloqueo por plan gratuito, con acción directa a /dashboard/plus. */
export function upgradeToast(message: string | undefined, router: RouterLike) {
  toast.error(message ?? "Esta función es de Nexo Plus", {
    action: { label: "Ver Nexo Plus", onClick: () => router.push("/dashboard/plus") },
  });
}
