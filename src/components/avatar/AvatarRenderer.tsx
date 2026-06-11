import { memo } from "react";
import type { AvatarRendererLayer } from "@/types/avatar";

type Props = {
  baseUrl: string;
  baseAlt: string;
  layers: AvatarRendererLayer[];
};

/**
 * Layered 2D avatar renderer. Paints `baseUrl` then each layer in
 * zIndex order. Layer positions come from each layer's `slot` (percent
 * strings) so item PNGs sit at anatomically correct spots.
 *
 * Future: accepts pose/bodyType-aware slots once items carry that
 * metadata; today the route maps DB items via CATEGORY_SLUG_TO_LAYER.
 */
function AvatarRendererImpl({ baseUrl, baseAlt, layers }: Props) {
  return (
    <div className="relative h-[68%] w-auto" style={{ aspectRatio: "3 / 4" }}>
      <img
        src={baseUrl}
        alt={baseAlt}
        className="h-full w-auto object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.15)]"
        draggable={false}
      />
      {layers
        .filter((l) => l.visible !== false)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer) => (
          <img
            key={layer.id}
            src={layer.imageUrl}
            alt={layer.alt ?? ""}
            className="absolute object-contain"
            style={{
              top: layer.slot.top,
              left: layer.slot.left,
              width: layer.slot.width,
              height: layer.slot.height,
              zIndex: layer.zIndex,
            }}
            draggable={false}
            loading="lazy"
          />
        ))}
    </div>
  );
}

export const AvatarRenderer = memo(AvatarRendererImpl);
