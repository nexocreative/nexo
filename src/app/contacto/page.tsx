import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LifeBuoy, Mail } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contacto · Nexo",
  description: "Cómo contactar con el equipo de Nexo para soporte o cualquier otra consulta.",
};

export default function ContactoPage() {
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
          Contacto
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Escríbenos, te respondemos lo antes posible.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${LEGAL.emailSoporte}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-foreground/20"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#ECE9FB] text-[#5F54AE]">
              <LifeBuoy className="size-4" />
            </div>
            <p className="text-sm font-bold text-foreground">Soporte</p>
            <p className="text-sm text-muted-foreground">
              ¿Algo no funciona como esperabas o tienes un problema con tu cuenta o Nexo Plus?
            </p>
            <p className="text-sm font-semibold text-foreground group-hover:underline">{LEGAL.emailSoporte}</p>
          </a>

          <a
            href={`mailto:${LEGAL.email}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-foreground/20"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#D8F3E7] text-[#2E8B6E]">
              <Mail className="size-4" />
            </div>
            <p className="text-sm font-bold text-foreground">Contacto general</p>
            <p className="text-sm text-muted-foreground">
              Sugerencias, prensa o cualquier otra consulta que no sea de soporte.
            </p>
            <p className="text-sm font-semibold text-foreground group-hover:underline">{LEGAL.email}</p>
          </a>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          ¿Tienes una duda general sobre Nexo? Igual ya está respondida en la página de{" "}
          <Link href="/ayuda" className="font-semibold text-foreground hover:underline">
            ayuda
          </Link>
          .
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
