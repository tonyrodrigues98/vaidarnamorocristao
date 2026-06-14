import { cn } from "@/lib/utils";
import type { PetMood } from "@/lib/petMood";

const TONE: Record<PetMood["tone"], string> = {
  good: "text-emerald-700",
  ok: "text-neutral-600",
  low: "text-amber-700",
  critical: "text-red-600",
};

export function PetMoodLine({
  name,
  mood,
  className,
}: {
  name: string;
  mood: PetMood;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[12px] font-medium leading-snug",
        TONE[mood.tone],
        className,
      )}
      aria-live="polite"
    >
      <span aria-hidden className="text-base leading-none">{mood.emoji}</span>
      <span className="truncate">
        <span className="text-neutral-500">{name} está</span> {mood.label}
      </span>
    </p>
  );
}