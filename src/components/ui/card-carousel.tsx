"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Mic, PiggyBank, Bell, BarChart3, Users } from "lucide-react";
import { PALETTE } from "@/lib/constants";

interface Feature {
  icon: React.ElementType;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: Camera, title: "Registro por foto", desc: "Foto al ticket y la IA extrae importe, comercio y categoría." },
  { icon: Mic, title: "Registro por voz", desc: "Dicta el gasto. Whisper transcribe y GPT-4o lo ordena." },
  { icon: PiggyBank, title: "Ahorro por categorías", desc: "Aparta cada mes y mira crecer tu colchón sin pensarlo." },
  { icon: Bell, title: "Límites y alertas", desc: "Avisos al 75%, 90% y 100% de tu presupuesto." },
  { icon: BarChart3, title: "Gráficas claras", desc: "Ingresos vs gastos, categorías y tendencias de un vistazo." },
  { icon: Users, title: "En pareja", desc: "Vista conjunta del dinero de los dos, con consentimiento." },
];

export function CardCarousel() {
  const cardCount = FEATURES.length;
  const cardsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sceneRef = useRef<HTMLDivElement>(null);
  const frameId = useRef<number>(0);
  const progress = useRef<number>(0);

  const [metrics, setMetrics] = useState({ cardW: 300, cardH: 250 });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let cardW = Math.round(w * 0.7);
      cardW = Math.min(300, Math.max(240, cardW));
      setMetrics({ cardW, cardH: 250 });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const renderLoop = () => {
      progress.current += 0.0016;

      const cards = cardsRefs.current;
      const { cardW } = metrics;

      const continuousProgress = progress.current;
      const roundedIndex = Math.round(continuousProgress);
      const diffFromRound = continuousProgress - roundedIndex;
      // Imán: cada card "descansa" un instante en el centro para poder leerla.
      const easedDiff = (Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2)) / 2;
      const virtualActiveIndex = roundedIndex + easedDiff;

      const spacing = cardW * 0.6;

      for (let i = 0; i < cardCount; i++) {
        const card = cards[i];
        if (!card) continue;

        let offset = i - virtualActiveIndex;
        const halfCount = cardCount / 2;
        while (offset > halfCount) offset -= cardCount;
        while (offset < -halfCount) offset += cardCount;

        const absOffset = Math.abs(offset);
        const sign = Math.sign(offset);

        if (absOffset > 2.7) {
          card.style.visibility = "hidden";
          continue;
        }
        card.style.visibility = "visible";

        const clamped = Math.min(absOffset, 1);
        const x = offset * spacing;
        const rotY = -sign * clamped * 30; // giro suave; el texto sigue siendo legible
        const scale = 1 - Math.min(absOffset, 2) * 0.1;
        const z = -Math.min(absOffset, 2) * 120;
        const opacity = absOffset > 1.6 ? Math.max(0, (2.7 - absOffset) / 1.1) : 1;

        card.style.zIndex = Math.round(200 - absOffset * 10).toString();
        card.style.opacity = opacity.toFixed(2);
        card.style.transform = `translateX(${x.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      }

      frameId.current = requestAnimationFrame(renderLoop);
    };

    frameId.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(frameId.current);
  }, [metrics, cardCount]);

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden" style={{ height: metrics.cardH + 60 }}>
      <div
        ref={sceneRef}
        className="relative flex h-full w-full items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute"
          style={{ width: `${metrics.cardW}px`, height: `${metrics.cardH}px`, transformStyle: "preserve-3d" }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                ref={(el) => {
                  cardsRefs.current[i] = el;
                }}
                className="absolute inset-0 will-change-transform"
                style={{ width: `${metrics.cardW}px`, height: `${metrics.cardH}px` }}
              >
                <div className="flex h-full flex-col rounded-3xl border border-border/60 bg-card p-7 shadow-xl shadow-foreground/5">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: PALETTE.lilaSoft, color: PALETTE.lilaInk }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
