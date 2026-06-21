import Link from "next/link";
import {
  Camera,
  Mic,
  PiggyBank,
  ArrowRight,
  Check,
  Sparkles,
  Quote,
  ChevronDown,
} from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import DisplayCards from "@/components/ui/display-cards";
import { NexoOrbital } from "@/components/ui/nexo-orbital";
import { CardCarousel } from "@/components/ui/card-carousel";
import { PALETTE } from "@/lib/constants";

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
    quote: "Por fin sé en qué se me va el sueldo. Le hago una foto al ticket y a otra cosa.",
    name: "Lucía",
    role: "Diseñadora · 29",
  },
  {
    quote: "Apuntar los gastos por voz mientras conduzco es magia. Ya no se me olvida nada.",
    name: "Diego",
    role: "Comercial · 34",
  },
  {
    quote: "Mi pareja y yo dejamos de discutir por dinero. Ahora lo vemos todo en el mismo sitio.",
    name: "Marta",
    role: "Enfermera · 31",
  },
];

const faqs = [
  {
    q: "¿Cuánto cuesta Nexo?",
    a: "Puedes empezar gratis y registrar tus gastos sin límite. Sin tarjeta, sin compromiso.",
  },
  {
    q: "¿Cómo registra la IA mis gastos?",
    a: "Con una foto del ticket (GPT-4o Vision lee los datos) o por voz (Whisper transcribe y GPT-4o estructura importe, comercio y categoría). Siempre puedes revisarlo antes de guardar.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Cada persona solo ve su propia información y la vista en pareja requiere consentimiento explícito de ambas partes.",
  },
  {
    q: "¿Puedo usarlo con mi pareja?",
    a: "Claro. Con la vista 'Juntos' veis el dinero de los dos de forma consolidada, manteniendo cada uno su privacidad cuando queráis.",
  },
  {
    q: "¿Funciona en el móvil?",
    a: "Nexo está pensado para el móvil y funciona desde el navegador. Puedes añadirlo a tu pantalla de inicio y usarlo como una app más.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header flotante */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 shadow-lg shadow-foreground/5 backdrop-blur-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-nexo.svg" alt="Nexo" width={96} height={31} className="h-auto w-[96px]" />
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#funciones" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Funciones</a>
            <a href="#opiniones" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Opiniones</a>
            <a href="#faq" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:block">
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate -mt-[72px] overflow-hidden pt-[72px]" style={heroBg}>
        <DottedSurface />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center lg:pb-28 lg:pt-[70px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" style={{ color: PALETTE.lilaInk }} />
            Finanzas con IA · solo o en pareja
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
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-7 py-3.5 text-base font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-foreground/15 bg-background/70 px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-background"
            >
              Ver demo
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
              Ingresos, gastos, ahorro, vacaciones y la vista en pareja: todo conectado en un mismo
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
              href="/login"
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
      <section id="opiniones" className="bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Gente que ya duerme tranquila
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Lo que dicen quienes dejaron el caos financiero atrás.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-3xl border border-border/60 bg-card p-7 shadow-sm"
              >
                <Quote className="h-7 w-7" style={{ color: PALETTE.lila }} />
                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: PALETTE.mintSoft, color: PALETTE.mintInk }}
                  >
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
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
          <DottedSurface />
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Tus cuentas claras empiezan hoy
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
              Crea tu cuenta gratis y registra tu primer gasto en menos de un minuto.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
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

      {/* Footer */}
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
                  { label: "Funciones", href: "#funciones" },
                  { label: "Demo", href: "/dashboard" },
                  { label: "Entrar", href: "/login" },
                ]}
              />
              <FooterCol
                title="Legal"
                links={[
                  { label: "Privacidad", href: "#" },
                  { label: "Términos", href: "#" },
                  { label: "Cookies", href: "#" },
                ]}
              />
              <FooterCol
                title="Soporte"
                links={[
                  { label: "Ayuda", href: "#" },
                  { label: "Contacto", href: "#" },
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
    </main>
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
