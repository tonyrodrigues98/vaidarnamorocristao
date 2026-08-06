import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { resolvePetDisplayImage } from "@/lib/petCatalog";
import { myPetV2QueryOptions } from "@/lib/petQueries";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  /** Tamanho da arte do pet em px. */
  size?: number;
  /** Mostra o balãozinho de coração flutuando perto da cabeça. */
  showHeartBubble?: boolean;
  className?: string;
};

/**
 * Pet recortado para sobrepor à foto/avatar do perfil — como no mockup
 * "Pet em destaque". Espera que a arte do pet seja PNG transparente
 * (idealmente 1024×1024). Posicione o componente dentro de um container
 * `relative overflow-visible`.
 */
export function EquippedPetSidekick({
  userId,
  size = 138,
  showHeartBubble = true,
  className,
}: Props) {
  const { data: pet } = useQuery(myPetV2QueryOptions(userId));

  const stageKind = pet?.life_stage?.kind ?? null;
  const image =
    resolvePetDisplayImage(pet?.variant, stageKind) ??
    resolvePetDisplayImage(pet?.species, stageKind) ??
    pet?.category?.image_url ??
    null;

  if (!pet || !image) return null;

  const discWidth = Math.round(size * 0.72);
  const name = pet.custom_name || pet.variant?.name || "Pet";

  return (
    <div
      className={cn("pointer-events-none absolute z-30", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Subtle ground shadow (cinza escuro) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-neutral-900/35 blur-md"
        style={{ width: discWidth, height: 8, bottom: 0 }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-neutral-900/20 blur-lg"
        style={{ width: discWidth + 10, height: 14, bottom: -3 }}
      />

      {/* Pet artwork */}
      <img
        src={image}
        alt={name}
        className="relative h-full w-full select-none object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.28)] animate-[pet-bob_4s_ease-in-out_infinite]"
        draggable={false}
      />

      {/* Heart bubble */}
      {showHeartBubble && (
        <div
          className="absolute flex items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/40"
          style={{
            width: Math.round(size * 0.28),
            height: Math.round(size * 0.28),
            top: -4,
            right: -4,
          }}
        >
          <Heart className="fill-white" style={{ width: size * 0.14, height: size * 0.14 }} />
        </div>
      )}

      <style>{`@keyframes pet-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>
  );
}
