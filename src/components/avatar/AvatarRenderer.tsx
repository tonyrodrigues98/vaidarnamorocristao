import { memo, type ReactNode } from "react";

import femaleAvatarBase from "@/assets/avatar/avatar-base-female.webp";
import maleAvatarBase from "@/assets/avatar/avatar-base-male.webp";
import {
  avatarLayerOrder,
  avatarLayerZIndex,
  avatarHairColors,
  avatarSkinTones,
  type AvatarAppearance,
  type AvatarGender,
  type AvatarItem,
  type AvatarLayerKey,
} from "@/data/avatarMockData";

type AvatarRendererProps = {
  gender: AvatarGender;
  equippedItem: AvatarItem | null;
  appearance: AvatarAppearance;
};

function Layer({ layer, children }: { layer: AvatarLayerKey; children: ReactNode }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: avatarLayerZIndex[layer] }}
      data-avatar-layer={layer}
    >
      {children}
    </div>
  );
}

function AvatarRendererBase({ gender, equippedItem, appearance }: AvatarRendererProps) {
  const avatarBase = gender === "masculino" ? maleAvatarBase : femaleAvatarBase;
  const skinTone = avatarSkinTones.find((tone) => tone.id === appearance.skinTone);
  const hairColor = avatarHairColors.find((tone) => tone.id === appearance.hairColor);
  const heightScale = 0.92 + (appearance.height / 100) * 0.16;
  const weightScale = 0.92 + (appearance.weight / 100) * 0.18;
  const hairMask =
    gender === "masculino"
      ? "left-[33%] top-[7%] h-[14%] w-[34%] rounded-t-full rounded-b-[42%]"
      : "left-[23%] top-[8%] h-[25%] w-[50%] rounded-t-full rounded-b-[48%]";

  return (
    <div className="relative mx-auto aspect-[0.56] h-full max-h-[430px] min-h-[312px] w-full max-w-[242px] overflow-visible">
      {avatarLayerOrder.map((layer) => (
        <Layer key={layer} layer={layer}>
          {layer === "background" && (
            <div className="h-[92%] w-[92%] rounded-full bg-gradient-to-b from-white/90 via-rose-100/35 to-transparent blur-2xl" />
          )}

          {layer === "body" && (
            <div
              className="relative h-full w-full origin-bottom overflow-visible"
              style={{
                transform: `scale(${weightScale}, ${heightScale})`,
                filter: skinTone?.filter,
              }}
            >
              <img
                src={avatarBase}
                alt={`Avatar base ${gender}`}
                className="h-full w-full object-contain drop-shadow-[0_24px_34px_rgba(120,53,15,0.20)]"
                draggable={false}
              />
              <div
                className="pointer-events-none absolute inset-x-[12%] top-[11%] h-[74%] rounded-[45%] opacity-20 mix-blend-soft-light"
                style={{ backgroundColor: skinTone?.color }}
              />
              <div
                className={`pointer-events-none absolute ${hairMask} opacity-45 mix-blend-multiply blur-[1px]`}
                style={{
                  background:
                    gender === "masculino"
                      ? hairColor?.color
                      : `radial-gradient(circle at 45% 30%, ${hairColor?.color}, transparent 70%)`,
                  filter: hairColor?.filter,
                }}
              />
            </div>
          )}

          {layer === "outfit" &&
            (equippedItem?.category === "roupas" ? (
              <div className="pointer-events-none absolute left-1/2 top-[42%] h-[21%] w-[52%] -translate-x-1/2 rounded-[38%] bg-gradient-to-b from-rose-200/45 via-white/10 to-amber-100/35 opacity-60 mix-blend-overlay" />
            ) : null)}

          {layer === "shoes" &&
            (equippedItem?.category === "calcados" ? (
              <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-8 w-[48%] -translate-x-1/2 rounded-full bg-white/70 opacity-70 mix-blend-screen" />
            ) : null)}

          {layer === "accessories" &&
            (equippedItem?.category === "acessorios" ? (
              <div className="relative h-full w-full">
                <div className="absolute left-[29%] top-[26%] h-2.5 w-2.5 rounded-full bg-amber-300 shadow" />
                <div className="absolute right-[29%] top-[26%] h-2.5 w-2.5 rounded-full bg-amber-300 shadow" />
              </div>
            ) : null)}

          {layer === "hairFront" &&
            (equippedItem?.category === "cabelo" ? (
              <div
                className={`pointer-events-none absolute ${hairMask} opacity-35 mix-blend-color`}
                style={{ backgroundColor: hairColor?.color }}
              />
            ) : null)}

          {layer === "pet" && equippedItem?.category === "especiais" && (
            <div className="absolute bottom-[18%] right-[10%] h-10 w-10 rounded-full bg-white/80 shadow-lg ring-1 ring-amber-200" />
          )}

          {layer === "effects" && (
            <div className="h-[88%] w-[88%] rounded-full border border-white/60 bg-gradient-to-b from-amber-100/30 via-transparent to-rose-100/20 shadow-[0_0_50px_rgba(255,111,120,0.18)]" />
          )}
        </Layer>
      ))}
    </div>
  );
}

export const AvatarRenderer = memo(AvatarRendererBase);
