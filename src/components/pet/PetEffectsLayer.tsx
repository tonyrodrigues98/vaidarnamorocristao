import { useEffect, useMemo, useRef, useState } from "react";
import { usePetDayNight } from "@/lib/petDayNight";

type Props = {
  hygiene: number;
  happiness: number; // play
  affection: number;
  nocturnal: boolean;
};

// Keyframes injetados uma única vez no <head> (evita re-criação a cada render
// dos sub-componentes).
const PET_FX_KEYFRAMES = `
@keyframes pet-stink-rise {
  0% { transform: translate(0,0) scale(0.7); opacity: 0; }
  15% { opacity: 0.55; }
  50% { transform: translate(-8px,-32px) scale(1); opacity: 0.45; }
  100% { transform: translate(8px,-64px) scale(0.8); opacity: 0; }
}
@keyframes pet-heart-float {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateY(-80px) scale(1); opacity: 0; }
}
@keyframes pet-zzz-rise {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  25% { opacity: 0.9; }
  100% { transform: translateY(-40px) scale(1.1); opacity: 0; }
}
`;
let _petFxInjected = false;
function ensurePetFxStyles() {
  if (_petFxInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.setAttribute("data-pet-fx", "true");
  el.textContent = PET_FX_KEYFRAMES;
  document.head.appendChild(el);
  _petFxInjected = true;
}

/**
 * Camada de efeitos visuais sobre o pet (CSS/SVG, sem assets):
 * - Fedido (hygiene < 30): partículas verdes onduladas subindo.
 * - Feliz (humor > 85 E carência > 85): corações flutuando raros.
 * - Dormindo (pet diurno à noite, ou pet noturno de dia): "Zzz" azul fade in/out.
 */
export function PetEffectsLayer({ hygiene, happiness, affection, nocturnal }: Props) {
  const { phase } = usePetDayNight();
  useEffect(ensurePetFxStyles, []);
  const sleeping = nocturnal ? phase === "day" : phase === "night";
  const stinky = hygiene < 30;
  const happy = happiness > 85 && affection > 85;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {stinky && <StinkyParticles />}
      {happy && <HappyHearts />}
      {sleeping && <ZzzCloud />}
    </div>
  );
}

/* ---------- Fedido: 3 bolhas verdes onduladas subindo ---------- */
function StinkyParticles() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute h-3 w-3 rounded-full bg-lime-400/70 blur-[1px]"
          style={{
            left: `${40 + i * 8}%`,
            top: "32%",
            animation: `pet-stink-rise ${2.8 + i * 0.4}s ease-out ${i * 0.6}s infinite`,
            filter: "drop-shadow(0 0 4px rgba(132,204,22,0.55))",
          }}
        />
      ))}
    </>
  );
}

/* ---------- Feliz: corações raros ---------- */
function HappyHearts() {
  const [hearts, setHearts] = useState<{ id: number; left: number; dur: number }[]>([]);
  const next = useRef(0);

  useEffect(() => {
    let alive = true;
    function spawn() {
      if (!alive) return;
      const id = next.current++;
      const left = 28 + Math.random() * 44;
      const dur = 4 + Math.random() * 2;
      setHearts((h) => [...h, { id, left, dur }]);
      window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), dur * 1000);
      // Próximo entre 15s e 30s — partículas raras
      window.setTimeout(spawn, 15000 + Math.random() * 15000);
    }
    // Primeiro entre 2-6s após equilibrar
    const t = window.setTimeout(spawn, 2000 + Math.random() * 4000);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  return (
    <>
      {hearts.map((h) => (
        <svg
          key={h.id}
          aria-hidden
          viewBox="0 0 24 24"
          className="absolute h-4 w-4 text-rose-400"
          style={{
            left: `${h.left}%`,
            top: "40%",
            animation: `pet-heart-float ${h.dur}s ease-out forwards`,
            filter: "drop-shadow(0 1px 2px rgba(244,63,94,0.4))",
          }}
        >
          <path
            fill="currentColor"
            d="M12 21s-7-4.35-9.33-9.04C1.13 8.36 3.5 5 7 5c1.85 0 3.49 1 5 2.5C13.51 6 15.15 5 17 5c3.5 0 5.87 3.36 4.33 6.96C19 16.65 12 21 12 21z"
          />
        </svg>
      ))}
    </>
  );
}

/* ---------- Zzz: dormindo ---------- */
function ZzzCloud() {
  const items = useMemo(() => [0, 1, 2], []);
  return (
    <>
      {items.map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute font-bold tracking-tight text-sky-400/90"
          style={{
            top: "22%",
            right: `${24 + i * 6}%`,
            fontSize: `${12 + i * 4}px`,
            animation: `pet-zzz-rise 4s ease-in-out ${i * 1.2}s infinite`,
            filter: "drop-shadow(0 1px 2px rgba(56,189,248,0.45))",
          }}
        >
          z
        </span>
      ))}
    </>
  );
}
