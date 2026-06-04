import { useEffect } from "react";
import { GiftMedia } from "./GiftMedia";
import type { GiftRarity } from "@/lib/gifts";

type Props = {
  show: boolean;
  giftName?: string;
  emoji?: string | null;
  imageUrl?: string | null;
  rarity?: GiftRarity;
  onDone: () => void;
};

export function GiftSendAnimation({
  show,
  giftName,
  emoji,
  imageUrl,
  rarity = "rare",
  onDone,
}: Props) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative flex flex-col items-center">
        {/* particles */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
              style={
                {
                  background: i % 2 ? "#FF7BC3" : "#A855F7",
                  animation: `gift-particle 1.6s ease-out forwards`,
                  animationDelay: `${i * 0.04}s`,
                  ["--tx" as string]: `${Math.cos((i / 14) * Math.PI * 2) * 160}px`,
                  ["--ty" as string]: `${Math.sin((i / 14) * Math.PI * 2) * 160}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="animate-[gift-rise_1.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <GiftMedia emoji={emoji} imageUrl={imageUrl} rarity={rarity} size="xl" />
        </div>
        <p className="mt-6 text-center text-lg font-bold text-white drop-shadow-lg">
          {giftName ? `${giftName} enviado!` : "Presente enviado!"}
        </p>
      </div>
    </div>
  );
}
