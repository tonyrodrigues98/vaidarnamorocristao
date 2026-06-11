import { Camera, Crown, Heart, Info, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import roomAsset from "@/assets/avatar-room.png.asset.json";
import type { AvatarExpressionKey, AvatarPoseKey, AvatarRendererLayer } from "@/types/avatar";
import { MOCK_EXPRESSIONS, MOCK_POSES } from "@/data/avatarMockData";
import { AvatarRenderer } from "./AvatarRenderer";
import { ActionBubble, AvatarActionRail } from "./AvatarActionRail";

const ROOM_BG = roomAsset.url;

type Props = {
  baseUrl: string | null;
  baseAlt: string;
  layers: AvatarRendererLayer[];
  pose: AvatarPoseKey;
  expression: AvatarExpressionKey;
  onShuffle: () => void;
  onReset: () => void;
  onToggleFavoriteEquipped?: () => void;
  onOpenPoseExpression: () => void;
  onOpenDetails: () => void;
  onSaveLook: () => void;
};

export function AvatarStage({
  baseUrl,
  baseAlt,
  layers,
  pose,
  expression,
  onShuffle,
  onReset,
  onToggleFavoriteEquipped,
  onOpenPoseExpression,
  onOpenDetails,
  onSaveLook,
}: Props) {
  const poseLabel = MOCK_POSES.find((p) => p.key === pose)?.label ?? "Padrão";
  const expLabel = MOCK_EXPRESSIONS.find((e) => e.key === expression)?.label ?? "Sorriso suave";

  return (
    <div className="relative">
      <div
        className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden"
        style={{
          backgroundImage: `url(${ROOM_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {baseUrl && (
          // Pódio: o topo do disco branco fica a ~21% do bottom do container
          // (imagem 9:16 dentro de um quadro 3:4 com background-position top).
          <div className="absolute inset-x-0 bottom-[20%] flex justify-center">
            <AvatarRenderer baseUrl={baseUrl} baseAlt={baseAlt} layers={layers} />
          </div>
        )}

        <AvatarActionRail>
          <ActionBubble
            icon={<Shuffle className="h-4 w-4" />}
            onClick={onShuffle}
            ariaLabel="Aleatório"
          />
          <ActionBubble
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={onReset}
            ariaLabel="Redefinir"
          />
          <ActionBubble
            icon={<Heart className="h-4 w-4 fill-primary text-primary" />}
            label="Favorito"
            onClick={onToggleFavoriteEquipped}
          />
          <ActionBubble
            icon={<Sparkles className="h-4 w-4" />}
            label="Pose"
            onClick={onOpenPoseExpression}
          />
        </AvatarActionRail>

        <div className="absolute right-3 top-6 flex flex-col items-end gap-3">
          <div className="flex flex-col items-center rounded-2xl border border-amber-200 bg-white px-3 py-2 shadow-sm">
            <Crown className="h-5 w-5 text-amber-500" />
            <span className="mt-0.5 text-xs font-semibold leading-tight text-amber-700">
              Visual
            </span>
            <span className="text-xs font-semibold leading-tight text-amber-700">
              Premium
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
          {poseLabel} · {expLabel}
        </div>

        <div className="absolute right-3 bottom-24 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-foreground shadow-sm"
          >
            <Info className="h-4 w-4" />
            Detalhes
          </button>
          <button
            type="button"
            onClick={onSaveLook}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            <Camera className="h-4 w-4" />
            Salvar Look
          </button>
        </div>
      </div>
    </div>
  );
}
