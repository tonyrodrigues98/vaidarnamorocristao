import darkWordmark from "@/assets/brand/orha-wordmark-dark.png";
import lightWordmark from "@/assets/brand/orha-wordmark-light.png";
import { cn } from "@/lib/utils";

import "./brand-logo.css";

export function BrandLogo({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span
      className={cn("vdn-brand-logo", className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "VaiDarNamoro"}
      aria-hidden={decorative || undefined}
      data-vdn-brand-logo
    >
      <img
        className="vdn-brand-logo__image vdn-brand-logo__image--light"
        src={lightWordmark}
        alt=""
      />
      <img
        className="vdn-brand-logo__image vdn-brand-logo__image--dark"
        src={darkWordmark}
        alt=""
      />
    </span>
  );
}
