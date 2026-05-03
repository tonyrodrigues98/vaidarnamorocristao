import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Premium verification badge — small, modern check, blue glow on hover.
 * Shows "Perfil Verificado" tooltip on hover/touch.
 */
export function VerifiedBadge({ size = "md", className }: Props) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label="Perfil Verificado"
            className={cn(
              "inline-flex items-center justify-center align-middle text-sky-500",
              "transition-all duration-300 hover:text-sky-400",
              "drop-shadow-[0_0_4px_rgba(56,189,248,0.45)] hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.75)]",
              className,
            )}
          >
            <BadgeCheck className={cn(SIZE[size], "fill-sky-500/15")} strokeWidth={2.5} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-medium">
          Perfil Verificado
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}