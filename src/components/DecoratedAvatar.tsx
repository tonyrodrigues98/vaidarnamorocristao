import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchDecorationCatalog, assetFor, type Decoration } from "@/lib/decorations";

// Fração do canvas (1024) ocupada pelo "buraco" interno de cada moldura.
// Usada para escalar a imagem da moldura de forma que o círculo interno
// se alinhe exatamente ao círculo da foto.
const FRAME_INNER_RATIO: Record<string, number> = {
  "frame-alianca-ouro.png": 0.78,
  "frame-coroa-espinhos.png": 0.62,
  "frame-louros-dourados.png": 0.55,
  "frame-floral-rosa.png": 0.55,
  "frame-vitral-sagrado.png": 0.55,
};
const DEFAULT_FRAME_INNER_RATIO = 0.6;

export type DecoratedAvatarProps = {
  photoUrl?: string | null;
  fallback?: string;
  size?: number;
  className?: string;
  frameId?: string | null;
  auraId?: string | null;
  stickerId?: string | null;
  alt?: string;
};

let cachedCatalog: Decoration[] | null = null;
const listeners = new Set<(c: Decoration[]) => void>();

function ensureCatalog(): Decoration[] | null {
  if (cachedCatalog) return cachedCatalog;
  fetchDecorationCatalog()
    .then((c) => {
      cachedCatalog = c;
      listeners.forEach((fn) => fn(c));
    })
    .catch(() => {});
  return null;
}

export function DecoratedAvatar({
  photoUrl,
  fallback,
  size = 96,
  className,
  frameId,
  auraId,
  // stickerId mantido na API para compatibilidade, mas não é renderizado por enquanto.
  stickerId: _stickerId,
  alt = "",
}: DecoratedAvatarProps) {
  void _stickerId;
  const hasAny = !!(frameId || auraId);
  const [catalog, setCatalog] = useState<Decoration[] | null>(cachedCatalog);

  useEffect(() => {
    if (!hasAny || catalog) return;
    const sync = ensureCatalog();
    if (sync) {
      setCatalog(sync);
      return;
    }
    const handler = (c: Decoration[]) => setCatalog(c);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [hasAny, catalog]);

  const find = (id: string | null | undefined) =>
    id && catalog ? catalog.find((d) => d.id === id) ?? null : null;
  const frame = find(frameId);
  const aura = find(auraId);

  const initial = fallback ?? "?";

  return (
    <div
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {aura?.css_value && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              inset: `-${Math.round(size * 0.3)}px`,
              background: `radial-gradient(circle, ${aura.css_value} 0%, ${aura.css_value}CC 35%, ${aura.css_value}66 60%, transparent 78%)`,
              filter: `blur(${Math.max(12, size * 0.18)}px)`,
              zIndex: 0,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              inset: `-${Math.round(size * 0.12)}px`,
              background: `radial-gradient(circle, ${aura.css_value}EE 0%, ${aura.css_value}88 50%, transparent 75%)`,
              filter: `blur(${Math.max(6, size * 0.08)}px)`,
              zIndex: 1,
            }}
          />
        </>
      )}
      <div
        className="relative h-full w-full overflow-hidden rounded-full bg-muted"
        style={{ zIndex: 10 }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-love font-semibold text-white"
            style={{ fontSize: Math.max(14, size * 0.4) }}
          >
            {initial}
          </div>
        )}
      </div>
      {frame && assetFor(frame) && (() => {
        const ratio =
          (frame.image_url && FRAME_INNER_RATIO[frame.image_url]) ||
          DEFAULT_FRAME_INNER_RATIO;
        const frameSize = size / ratio;
        const offset = (size - frameSize) / 2;
        return (
          <img
            src={assetFor(frame)!}
            alt=""
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              top: offset,
              left: offset,
              width: frameSize,
              height: frameSize,
              zIndex: 20,
            }}
          />
        );
      })()}
    </div>
  );
}