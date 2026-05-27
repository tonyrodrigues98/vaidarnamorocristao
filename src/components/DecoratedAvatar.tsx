import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchDecorationCatalog, assetFor, type Decoration } from "@/lib/decorations";

// `size` é o canvas total do componente. A moldura SEMPRE preenche esse
// canvas (assim os cards ficam com altura/largura estáveis e idênticas em
// todas as molduras). A foto é posicionada dentro do vão da moldura usando
// valores medidos diretamente dos PNGs (diâmetro e centro do furo).
const FRAME_PLACEMENT: Record<string, { photoScale: number; centerX: number; centerY: number }> = {
  "frame-alianca-ouro.png":    { photoScale: 0.57, centerX: 0.501, centerY: 0.498 },
  "frame-coroa-espinhos.png":  { photoScale: 0.58, centerX: 0.504, centerY: 0.490 },
  "frame-louros-dourados.png": { photoScale: 0.50, centerX: 0.500, centerY: 0.500 },
  "frame-floral-rosa.png":     { photoScale: 0.38, centerX: 0.501, centerY: 0.506 },
  "frame-vitral-sagrado.png":  { photoScale: 0.48, centerX: 0.496, centerY: 0.479 },
};
const DEFAULT_FRAME_PLACEMENT = { photoScale: 0.56, centerX: 0.5, centerY: 0.5 };

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
  const frameAsset = frame ? assetFor(frame) : null;
  const placement = frame?.image_url
    ? FRAME_PLACEMENT[frame.image_url] ?? DEFAULT_FRAME_PLACEMENT
    : DEFAULT_FRAME_PLACEMENT;
  // `size` representa o diâmetro da FOTO (constante). Quando existe moldura,
  // o canvas externo cresce para `size / photoScale` para acomodar a moldura
  // ao redor sem encolher a foto.
  const photoSize = size;
  const canvas = frameAsset ? size / placement.photoScale : size;
  const photoCenterX = canvas * placement.centerX;
  const photoCenterY = canvas * placement.centerY;

  return (
    <div
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: canvas, height: canvas }}
    >
      {aura?.css_value && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: `-${Math.round(canvas * 0.1)}px`,
            background: `radial-gradient(circle, ${aura.css_value}66 0%, ${aura.css_value}33 45%, transparent 72%)`,
            filter: `blur(${Math.max(6, canvas * 0.09)}px)`,
            zIndex: 0,
          }}
        />
      )}
      <div
        className="absolute overflow-hidden rounded-full bg-muted"
        style={{
          top: photoCenterY - photoSize / 2,
          left: photoCenterX - photoSize / 2,
          width: photoSize,
          height: photoSize,
          zIndex: 10,
        }}
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
      {frameAsset && (
        <img
          src={frameAsset}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: 20 }}
        />
      )}
    </div>
  );
}