"use client";

import { ArrowUpRight, ArrowDownRight, PiggyBank, Palmtree, Users } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Ingresos",
    date: "Nómina",
    content: "Registra tu nómina y otros ingresos. Confírmalos cada mes con un solo toque.",
    category: "Ingresos",
    icon: ArrowUpRight,
    relatedIds: [2, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 2,
    title: "Gastos",
    date: "IA",
    content: "Apunta gastos por foto, voz o a mano. La IA los categoriza al instante.",
    category: "Gastos",
    icon: ArrowDownRight,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "Ahorro",
    date: "Colchón",
    content: "Aparta cada mes por categorías y mira crecer tu colchón. Se resta de tu balance.",
    category: "Ahorro",
    icon: PiggyBank,
    relatedIds: [2, 4],
    status: "completed" as const,
    energy: 80,
  },
  {
    id: 4,
    title: "Vacaciones",
    date: "Viajes",
    content: "Un presupuesto aparte para tus viajes, con resumen automático al cerrar.",
    category: "Vacaciones",
    icon: Palmtree,
    relatedIds: [3, 5],
    status: "completed" as const,
    energy: 65,
  },
  {
    id: 5,
    title: "Juntos",
    date: "Pareja",
    content: "La vista conjunta del dinero de los dos, con el consentimiento de ambos.",
    category: "Juntos",
    icon: Users,
    relatedIds: [4, 1],
    status: "completed" as const,
    energy: 75,
  },
];

export function NexoOrbital() {
  return <RadialOrbitalTimeline timelineData={timelineData} />;
}
