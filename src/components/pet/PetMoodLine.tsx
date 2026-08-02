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
  const { Icon } = mood;
  return (
    <div
      className={cn(
        "flex items-start gap-1.5 text-[12px] font-medium leading-snug",
        TONE[mood.tone],
        className,
      )}
      aria-live="polite"
    >
      <Icon aria-hidden className="size-4 shrink-0 mt-px" strokeWidth={2} />
      <p className="min-w-0">
        <span className="text-neutral-500">{name} está</span>
        <br />
        {mood.label}
      </p>
    </div>
  );
}
