import { cn } from "@/lib/utils";

type OrhaMarkProps = {
  size?: "compact" | "display";
  className?: string;
  tagLine?: boolean;
};

/**
 * The ORHA wordmark is intentionally rendered as type instead of an image:
 * it is crisp at every PWA size and keeps the mirrored R integral to the mark.
 */
export function OrhaMark({ size = "compact", className, tagLine = false }: OrhaMarkProps) {
  return (
    <div className={cn("orha-mark", `orha-mark--${size}`, className)} aria-label="ORHA">
      <span className="orha-mark__word" aria-hidden="true">
        O<span className="orha-mark__reversed-r">R</span>HA
      </span>
      {tagLine && <span className="orha-mark__tagline">CONEXÕES · PRESENÇA · PROPÓSITO</span>}
    </div>
  );
}
