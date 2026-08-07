import { cn } from "@/lib/utils";

type OrhaMarkProps = {
  size?: "compact" | "display";
  className?: string;
  tagLine?: boolean;
  tone?: "auto" | "ink";
};

/** Official ORHA wordmark assets. The mirrored R is part of the supplied artwork. */
export function OrhaMark({
  size = "compact",
  className,
  tagLine = false,
  tone = "auto",
}: OrhaMarkProps) {
  return (
    <div
      className={cn(
        "orha-mark",
        `orha-mark--${size}`,
        tone === "ink" && "orha-mark--ink",
        className,
      )}
      aria-label="ORHA"
    >
      <img
        src="/brand/orha-mark-ink.png"
        className="orha-mark__image orha-mark__image--ink"
        alt=""
        aria-hidden="true"
      />
      <img
        src="/brand/orha-mark-light.png"
        className="orha-mark__image orha-mark__image--light"
        alt=""
        aria-hidden="true"
      />
      {tagLine && <span className="orha-mark__tagline">CONEXÕES · PRESENÇA · PROPÓSITO</span>}
    </div>
  );
}
