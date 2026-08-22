import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nexo.svg" alt="Nexo" width={104} height={34} className="h-auto w-[104px]" />
            <p className="mt-4 text-sm text-muted-foreground">
              Las cuentas claras, sin esfuerzo. Registra con IA, controla tus límites y ahorra cada mes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 sm:gap-10">
            <FooterCol
              title="Producto"
              links={[
                { label: "Funciones", href: "/#funciones" },
                { label: "Entrar", href: "/login" },
              ]}
            />
            <FooterCol
              className="order-2 sm:order-3"
              title="Soporte"
              links={[
                { label: "Ayuda", href: "/ayuda" },
                { label: "Contacto", href: "/contacto" },
              ]}
            />
            {/* En móvil (2 columnas) va debajo, a ancho completo: si compartiera
                fila con Producto o Soporte (2 enlaces cada una), su altura de 4
                enlaces estiraría esa fila y dejaría un hueco raro encima de la
                otra columna. */}
            <FooterCol
              className="order-3 col-span-2 sm:order-2 sm:col-span-1"
              title="Legal"
              links={[
                { label: "Privacidad", href: "/privacidad" },
                { label: "Aviso legal", href: "/aviso-legal" },
                { label: "Términos y condiciones", href: "/terminos" },
                { label: "Cookies", href: "/cookies" },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 Nexo. Todos los derechos reservados.</p>
          <p>Hecho con cariño para tus finanzas.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  className,
}: {
  title: string;
  links: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
