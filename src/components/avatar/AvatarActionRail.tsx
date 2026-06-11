import { Heart, Info, RotateCcw, Shuffle } from "lucide-react";

type AvatarActionRailProps = {
  isFavorite: boolean;
  onRandomize: () => void;
  onReset: () => void;
  onToggleFavorite: () => void;
  onOpenDetails: () => void;
};

export function AvatarActionRail({
  isFavorite,
  onRandomize,
  onReset,
  onToggleFavorite,
  onOpenDetails,
}: AvatarActionRailProps) {
  const actions = [
    { label: "Aleatório", Icon: Shuffle, onClick: onRandomize },
    { label: "Redefinir", Icon: RotateCcw, onClick: onReset },
    { label: "Favorito", Icon: Heart, onClick: onToggleFavorite, active: isFavorite },
    { label: "Detalhes", Icon: Info, onClick: onOpenDetails },
  ];

  return (
    <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
      {actions.map(({ label, Icon, onClick, active }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-label={label}
          className={`grid h-11 w-11 place-items-center rounded-2xl border text-stone-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl transition active:scale-95 ${
            active
              ? "border-rose-200 bg-[#ff5c70] text-white"
              : "border-white/80 bg-white/75 hover:bg-white"
          }`}
        >
          <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
        </button>
      ))}
    </div>
  );
}
