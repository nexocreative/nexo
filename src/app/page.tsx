import Link from "next/link";
import {
  Camera,
  Mic,
  PiggyBank,
  ArrowRight,
  Check,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import DisplayCards from "@/components/ui/display-cards";
import { NexoOrbital } from "@/components/ui/nexo-orbital";
import { CardCarousel } from "@/components/ui/card-carousel";
import { ScrollReelTestimonials } from "@/components/ui/scroll-reel-testimonials";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PALETTE } from "@/lib/constants";
import { faqs } from "@/lib/faqs";

const heroBg = {
  backgroundColor: "hsl(var(--background))",
  backgroundImage: `radial-gradient(55% 50% at 12% 8%, ${PALETTE.lilaSoft}, transparent 60%), radial-gradient(50% 45% at 92% 4%, ${PALETTE.mintSoft}, transparent 60%), radial-gradient(45% 45% at 75% 95%, ${PALETTE.peachSoft}, transparent 65%)`,
};

const showcaseCards = [
  {
    icon: <Camera className="size-4" />,
    title: "Foto ticket",
    description: "Mercadona · −48,20 €",
    date: "Hace 2 min",
    iconClassName: "bg-[#ECE9FB] text-[#5F54AE]",
    titleClassName: "text-[#5F54AE]",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Mic className="size-4" />,
    title: "Por voz",
    description: "Café con Marta · −3,50 €",
    date: "Hoy",
    iconClassName: "bg-[#D8F3E7] text-[#2E8B6E]",
    titleClassName: "text-[#2E8B6E]",
    className:
      "[grid-area:stack] translate-x-14 translate-y-9 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <PiggyBank className="size-4" />,
    title: "Ahorro",
    description: "Vacaciones · +200 €",
    date: "Este mes",
    iconClassName: "bg-[#ECE9FB] text-[#5F54AE]",
    titleClassName: "text-[#5F54AE]",
    className: "[grid-area:stack] translate-x-28 translate-y-[4.5rem] hover:translate-y-10",
  },
];

const testimonials = [
  {
    quote: "Por fin sé en qué se me va el sueldo. Foto al ticket y a otra cosa.",
    author: "Lucía · Diseñadora",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop",
    alt: "Retrato de Lucía",
  },
  {
    quote: "Apuntar los gastos por voz mientras conduzco es magia. Ya no se me olvida nada.",
    author: "Diego · Comercial",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop",
    alt: "Retrato de Diego",
  },
  {
    quote: "Mi pareja y yo dejamos de discutir por dinero. Lo vemos todo en el mismo sitio.",
    author: "Marta · Enfermera",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80&auto=format&fit=crop",
    alt: "Retrato de Marta",
  },
  {
    quote: "Llevo mis ingresos y gastos al día sin esfuerzo. Nunca fue tan fácil.",
    author: "Carlos · Autónomo",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop",
    alt: "Retrato de Carlos",
  },
  {
    quote: "En tres meses ahorré para mis vacaciones casi sin enterarme. Brutal.",
    author: "Ana · Profesora",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format&fit=crop",
    alt: "Retrato de Ana",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header flotante */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 shadow-lg shadow-foreground/5 backdrop-blur-xl md:grid-cols-[1fr_auto_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-nexo.svg" alt="Nexo" width={96} height={31} className="h-auto w-[96px] justify-self-start" />
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#funciones" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Funciones</a>
            <a href="#opiniones" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Opiniones</a>
            <a href="#faq" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Preguntas</a>
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:block">
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 sm:hidden"
            >
              Entrar
            </Link>
            <Link
              href="/login?tab=register"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate -mt-[72px] flex min-h-dvh flex-col overflow-hidden pt-[72px]" style={heroBg}>
        <DottedSurface />
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" style={{ color: PALETTE.lilaInk }} />
            Finanzas con IA · solo o en grupo
          </span>
          <h1 className="mt-7 text-balance text-5xl font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-7xl">
            Haz una foto.
            <br />
            Nexo hace{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(110deg, ${PALETTE.lilaInk}, ${PALETTE.mintInk})` }}
            >
              las cuentas.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
            Registra cada gasto por foto o por voz, controla tus límites y mira crecer tu ahorro mes a
            mes. Las cuentas claras, sin esfuerzo.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
            >
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 text-sm font-medium text-muted-foreground">
            Gratis para empezar · Sin tarjeta · Listo en un minuto
          </p>
        </div>
      </section>

      {/* Punto de dolor + orbital */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              ¿A dónde se va el dinero cada mes?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Llegas a fin de mes y no sabes en qué se fue. Apuntar gastos a mano aguanta tres días. Y
              cada vez que toca hablar de dinero en pareja, acaba regular.{" "}
              <span className="font-semibold text-foreground">Nexo convierte ese caos en claridad.</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Ingresos, gastos, ahorro, vacaciones y la vista en conjunto: todo conectado en un mismo
              sitio. <span className="font-medium text-foreground">Toca cada órbita para verlo.</span>
            </p>
          </div>
          <div className="relative h-[420px] w-full sm:h-[520px]">
            <NexoOrbital />
          </div>
        </div>
      </section>

      {/* Showcase con DisplayCards */}
      <section className="overflow-hidden border-y border-border/60 bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 lg:grid-cols-2 lg:gap-10 lg:px-8">
          <div className="order-2 flex min-h-[18rem] items-center justify-center lg:order-none lg:justify-start lg:pl-10">
            <DisplayCards cards={showcaseCards} />
          </div>
          <div className="order-1 lg:order-none">
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: PALETTE.lilaInk }}>
              Registro sin fricción
            </span>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Apuntar un gasto, en dos segundos
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Foto al ticket, una nota de voz o dos toques. La IA de Nexo extrae el importe, el
              comercio y la categoría por ti. Tú solo confirmas.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Foto al ticket y la IA rellena todo",
                "Dicta el gasto y olvídate de escribir",
                "Cada euro, en su categoría. Automático",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-base font-medium text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/login?tab=register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              Probarlo gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funciones" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Todo lo que necesitas para llevar tu dinero al día
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Registrar, controlar y ahorrar. Sin hojas de cálculo, sin fricción.
            </p>
          </div>

          {/* Carrusel 3D de cards de funciones */}
          <div className="mt-12">
            <CardCarousel />
          </div>
        </div>
      </section>

      {/* Opiniones */}
      <section id="opiniones" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Gente que ya duerme tranquila
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Lo que dicen quienes dejaron el caos financiero atrás.
            </p>
          </div>
          <div className="mt-14 flex justify-center">
            <ScrollReelTestimonials testimonials={testimonials} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <h2 className="text-center text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-12 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                  {item.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-border/60 px-6 py-16 text-center shadow-lg sm:px-12" style={heroBg}>
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Tus cuentas claras empiezan hoy
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
              Crea tu cuenta gratis y registra tu primer gasto en menos de un minuto.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login?tab=register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-7 py-3.5 text-base font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Crear cuenta gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
              <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: PALETTE.mintInk }} /> Gratis para empezar</li>
              <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: PALETTE.mintInk }} /> Sin tarjeta</li>
              <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: PALETTE.mintInk }} /> Tus datos, privados</li>
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
