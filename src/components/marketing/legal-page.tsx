import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LEGAL } from "@/lib/legal";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-nexo.svg" alt="Nexo" width={96} height={31} className="h-auto w-[96px]" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 lg:px-0">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {LEGAL.ultimaActualizacion}
        </p>
        <div className="legal-prose mt-10">{children}</div>
      </article>

      <SiteFooter />
    </main>
  );
}
