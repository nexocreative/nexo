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
            <div className="mt-5 flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </a>
              <a href="#" aria-label="X" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <XIcon className="h-4 w-4" />
              </a>
              <a href="#" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <TikTokIcon className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Producto"
              links={[
                { label: "Funciones", href: "/#funciones" },
                { label: "Entrar", href: "/login" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: "Privacidad", href: "/privacidad" },
                { label: "Aviso legal", href: "/aviso-legal" },
                { label: "Términos y condiciones", href: "/terminos" },
                { label: "Cookies", href: "/cookies" },
              ]}
            />
            <FooterCol
              title="Soporte"
              links={[
                { label: "Ayuda", href: "/#faq" },
                { label: "Contacto", href: "mailto:hola@finanzasnexo.es" },
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
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
