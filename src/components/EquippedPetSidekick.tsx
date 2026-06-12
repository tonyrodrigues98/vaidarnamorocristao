import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { getMyPetV2 } from "@/lib/petCatalog";
import type { UserPetV2Full } from "@/types/petCatalog";
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
  size = 110,
  showHeartBubble = true,
  className,
}: Props) {
  const [pet, setPet] = useState<UserPetV2Full | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyPetV2(userId)
      .then((p) => {
        if (!cancelled) setPet(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const image =
    pet?.variant?.image_url ??
    pet?.species?.image_url ??
    pet?.category?.image_url ??
    null;

  if (!pet || !image) return null;

  const discWidth = Math.round(size * 0.72);
  const name = pet.custom_name || pet.variant?.name || "Pet";

  return (
    <div
      className={cn("pointer-events-none absolute", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Neon disc */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-rose-500/70 blur-md"
        style={{ width: discWidth, height: 10, bottom: -2 }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-rose-400/40 blur-xl"
        style={{ width: discWidth + 8, height: 18, bottom: -6 }}
      />

      {/* Pet artwork */}
      <img
        src={image}
        alt={name}
        className="relative h-full w-full select-none object-contain drop-shadow-[0_6px_12px_rgba(244,63,94,0.45)] animate-[pet-bob_4s_ease-in-out_infinite]"
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
          <Heart
            className="fill-white"
            style={{ width: size * 0.14, height: size * 0.14 }}
          />
        </div>
      )}

      <style>{`@keyframes pet-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>
  );
}