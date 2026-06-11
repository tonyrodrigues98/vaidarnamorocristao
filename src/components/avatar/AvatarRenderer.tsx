import { memo, type ReactNode } from "react";

import {
  avatarLayerOrder,
  avatarLayerZIndex,
  type AvatarGender,
  type AvatarItem,
  type AvatarLayerKey,
} from "@/data/avatarMockData";

type AvatarRendererProps = {
  gender: AvatarGender;
  equippedItem: AvatarItem | null;
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

function AvatarRendererBase({ gender, equippedItem }: AvatarRendererProps) {
  const outfitTone =
    equippedItem?.gender === "masculino"
      ? "from-slate-700 via-slate-600 to-slate-900"
      : equippedItem?.previewTone.includes("sky")
        ? "from-sky-300 via-white to-rose-200"
        : "from-rose-300 via-white to-amber-200";

  const hairTone = gender === "masculino" ? "bg-stone-800" : "bg-amber-700";
  const skinTone = gender === "masculino" ? "bg-amber-200" : "bg-rose-100";

  return (
    <div className="relative mx-auto aspect-[0.62] h-full max-h-[420px] min-h-[300px] w-full max-w-[250px] overflow-visible">
      {avatarLayerOrder.map((layer) => (
        <Layer key={layer} layer={layer}>
          {layer === "background" && (
            <div className="h-[92%] w-[92%] rounded-full bg-gradient-to-b from-white/80 via-rose-100/30 to-transparent blur-2xl" />
          )}

          {layer === "hairBack" && gender === "feminino" && (
            <div className={`mt-4 h-[34%] w-[48%] rounded-t-full ${hairTone} shadow-lg`} />
          )}

          {layer === "body" && (
            <div className="relative flex h-full w-full flex-col items-center">
              <div className={`mt-[8%] h-[17%] w-[30%] rounded-full ${skinTone} shadow-inner`} />
              <div className={`mt-[-2%] h-[9%] w-[16%] rounded-b-full ${skinTone}`} />
              <div
                className={`mt-[-1%] h-[30%] w-[44%] rounded-t-[42%] rounded-b-[28%] ${skinTone} shadow-sm`}
              />
              <div className="mt-[-2%] flex w-[62%] justify-between">
                <div className={`h-[32%] min-h-[88px] w-[18%] rounded-full ${skinTone}`} />
                <div className={`h-[32%] min-h-[88px] w-[18%] rounded-full ${skinTone}`} />
              </div>
              <div className="mt-[-7%] flex w-[44%] justify-between">
                <div className={`h-[34%] min-h-[112px] w-[30%] rounded-full ${skinTone}`} />
                <div className={`h-[34%] min-h-[112px] w-[30%] rounded-full ${skinTone}`} />
              </div>
            </div>
          )}

          {layer === "outfit" && (
            <div className="relative flex h-full w-full flex-col items-center">
              <div
                className={`mt-[37%] h-[34%] w-[50%] rounded-t-[42%] rounded-b-[26%] bg-gradient-to-b ${outfitTone} shadow-xl`}
              />
              {gender === "feminino" && (
                <div
                  className={`mt-[-5%] h-[20%] w-[66%] rounded-t-[24%] rounded-b-full bg-gradient-to-b ${outfitTone} opacity-95 shadow-lg`}
                />
              )}
            </div>
          )}

          {layer === "shoes" && (
            <div className="mt-[142%] flex w-[48%] justify-between">
              <div className="h-4 w-12 rounded-full bg-stone-700 shadow-md" />
              <div className="h-4 w-12 rounded-full bg-stone-700 shadow-md" />
            </div>
          )}

          {layer === "accessories" && (
            <div className="relative h-full w-full">
              <div className="absolute left-[28%] top-[29%] h-2 w-2 rounded-full bg-amber-300 shadow" />
              <div className="absolute right-[28%] top-[29%] h-2 w-2 rounded-full bg-amber-300 shadow" />
              <div className="absolute left-1/2 top-[46%] h-5 w-12 -translate-x-1/2 rounded-full border border-white/70 bg-white/30 backdrop-blur" />
            </div>
          )}

          {layer === "hairFront" && (
            <div className="relative h-full w-full">
              <div
                className={`absolute left-1/2 top-[7%] h-[13%] w-[34%] -translate-x-1/2 rounded-t-full rounded-b-[38%] ${hairTone} shadow-md`}
              />
              {gender === "feminino" && (
                <div
                  className={`absolute left-[33%] top-[13%] h-[18%] w-[12%] rounded-full ${hairTone} shadow-md`}
                />
              )}
            </div>
          )}

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
