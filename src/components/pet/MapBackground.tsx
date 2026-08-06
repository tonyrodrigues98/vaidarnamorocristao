import dayAsset from "@/assets/pet-kingdom/kingdom-map-day.png.asset.json";
import nightAsset from "@/assets/pet-kingdom/kingdom-map-night.png.asset.json";
import { usePetDayNight } from "@/lib/petDayNight";

/**
 * Camada de fundo do reino. Faz cross-fade entre dia e noite usando o
 * mesmo `usePetDayNight()` do Quarto Vivo (Z1) — coerência diegética.
 */
export function MapBackground() {
  const { dayOpacity } = usePetDayNight();
  return (
    <div className="pointer-events-none absolute inset-0">
      <img
        src={nightAsset.url}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
      <img
        src={dayAsset.url}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-[1200ms]"
        style={{ opacity: dayOpacity }}
      />
    </div>
  );
}
