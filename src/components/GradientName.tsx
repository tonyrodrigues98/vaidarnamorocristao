import { nameGradientStyle, type NameGradient } from "@/lib/nameGradients";
import { cn } from "@/lib/utils";

type GradientNameProps = {
  name: string | null | undefined;
  gradient?: Pick<NameGradient, "color_a" | "color_b"> | null;
  fallback?: string;
  className?: string;
};

export function GradientName({
  name,
  gradient,
  fallback = "Usuário",
  className,
}: GradientNameProps) {
  return (
    <span className={cn("font-black", className)} style={nameGradientStyle(gradient ?? null)}>
      {name || fallback}
    </span>
  );
}
