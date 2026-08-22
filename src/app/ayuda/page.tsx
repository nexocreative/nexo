import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { faqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Ayuda · Nexo",
  description: "Preguntas frecuentes sobre Nexo: precio, IA, privacidad y gastos compartidos.",
};

export default function AyudaPage() {
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
          Ayuda
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Las preguntas más frecuentes sobre Nexo.</p>

        <div className="mt-10 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">¿No has encontrado lo que buscabas?</p>
          <Link
            href="/contacto"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:underline"
          >
            Contacta con nosotros
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
