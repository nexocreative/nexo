import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Mic,
  PieChart,
  Target,
  Bell,
  Plane,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Registro por foto",
    description:
      "Haz una foto al ticket y la IA extrae importe, comercio y categoría automáticamente.",
  },
  {
    icon: Mic,
    title: "Registro por voz",
    description:
      "Dicta tus gastos e ingresos. Whisper transcribe y GPT-4o interpreta los datos.",
  },
  {
    icon: PieChart,
    title: "Gráficas claras",
    description:
      "Ingresos vs gastos, gasto por categoría, tendencias y proyección de cierre de mes.",
  },
  {
    icon: Bell,
    title: "Límites y alertas",
    description:
      "Avisos progresivos al 75%, 90% y bloqueo visual al 100% de tu presupuesto.",
  },
  {
    icon: Target,
    title: "Objetivo compartido",
    description:
      "Ahorro conjunto con fecha límite, progress ring y cálculo del ritmo necesario.",
  },
  {
    icon: Plane,
    title: "Modo vacaciones",
    description:
      "Presupuesto aparte para tus viajes, agrupado en una cápsula con resumen automático.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <span className="text-xl font-bold tracking-tight">Nexo</span>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Empezar</Link>
          </Button>
        </nav>
      </header>

      <section className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-4 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          Tus finanzas, sin esfuerzo
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Controla tus gastos hablando o sacando una foto
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Nexo registra tus gastos e ingresos con IA, te avisa antes de pasarte
          del presupuesto y te ayuda a alcanzar tus objetivos de ahorro.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/login">Crear cuenta gratis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">Ver demo</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border bg-card p-6 text-left text-card-foreground"
          >
            <feature.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Nexo · Hecho con Next.js, Supabase e IA
        </div>
      </footer>
    </main>
  );
}
