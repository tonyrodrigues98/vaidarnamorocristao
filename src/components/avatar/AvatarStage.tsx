import { Crown, Share2, Sparkles } from "lucide-react";

import { AvatarActionRail } from "@/components/avatar/AvatarActionRail";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import type { AvatarAppearance, AvatarGender, AvatarItem } from "@/data/avatarMockData";

type AvatarStageProps = {
  gender: AvatarGender;
  equippedItem: AvatarItem | null;
  appearance: AvatarAppearance;
  isFavorite: boolean;
  onRandomize: () => void;
  onReset: () => void;
  onToggleFavorite: () => void;
  onOpenDetails: () => void;
};

export function AvatarStage({
  gender,
  equippedItem,
  appearance,
  isFavorite,
  onRandomize,
  onReset,
  onToggleFavorite,
  onOpenDetails,
}: AvatarStageProps) {
  return (
    <section className="mx-auto max-w-md px-4 py-4">
      <div className="relative min-h-[430px] overflow-hidden rounded-[34px] border border-white bg-gradient-to-b from-white via-[#fff8f5] to-[#f7ede7] shadow-[0_26px_70px_rgba(120,53,15,0.12)]">
        <div className="absolute inset-x-8 top-8 h-64 rounded-t-full bg-gradient-to-b from-white via-rose-100/60 to-transparent blur-sm" />
        <div className="absolute left-1/2 top-16 h-64 w-52 -translate-x-1/2 rounded-t-full border border-white/80 bg-white/30 shadow-inner backdrop-blur-sm" />
        <div className="absolute bottom-20 left-1/2 h-16 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-amber-200/55 to-transparent blur-xl" />
        <div className="absolute bottom-16 left-1/2 h-12 w-56 -translate-x-1/2 rounded-[100%] border border-white/80 bg-gradient-to-b from-white to-rose-100 shadow-[0_18px_35px_rgba(120,53,15,0.12)]" />

        <div className="absolute left-4 top-4 z-20 rounded-2xl border border-white/70 bg-white/55 px-3 py-2 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-rose-200 text-amber-700">
              <Crown className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-400">
                Visual Premium
              </p>
              <p className="text-xs font-bold text-stone-800">
                {equippedItem?.name ?? "Look em edição"}
              </p>
            </div>
          </div>
        </div>

        <AvatarActionRail
          isFavorite={isFavorite}
          onRandomize={onRandomize}
          onReset={onReset}
          onToggleFavorite={onToggleFavorite}
          onOpenDetails={onOpenDetails}
        />

        <div className="relative z-10 flex h-[350px] items-end justify-center px-14 pt-20">
          <AvatarRenderer gender={gender} equippedItem={equippedItem} appearance={appearance} />
        </div>

        <div className="relative z-20 mx-4 mb-4 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#ff5c70] px-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(255,92,112,0.28)] transition active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Salvar Look
          </button>
          <button
            type="button"
            className="grid h-[52px] w-[52px] place-items-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition active:scale-95"
            aria-label="Compartilhar look"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
