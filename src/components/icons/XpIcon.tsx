import capsulaXpImg from "@/assets/caixas/capsula_xp.png";
import { cn } from "@/lib/utils";

/**
 * Ícone canônico de XP — usa a arte da Cápsula de XP (mesma da roleta).
 * Substitui Sparkles/Zap em badges de recompensa para garantir consistência visual.
 */
export function XpIcon({ className }: { className?: string }) {
  return (
    <img
      src={capsulaXpImg}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("inline-block object-contain", className)}
    />
  );
}
