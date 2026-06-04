import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchDecorationRenderCatalog, assetFor, type Decoration } from "@/lib/decorations";
import { useSignedPhotoUrl } from "@/lib/photoUrl";
import commitmentRing from "@/assets/commitment-ring.png";
// `size` é o canvas total do componente. A moldura SEMPRE preenche esse
// canvas (assim os cards ficam com altura/largura estáveis e idênticas em
// todas as molduras). A foto é posicionada dentro do vão da moldura usando
// valores medidos diretamente dos PNGs (diâmetro e centro do furo).
const FRAME_PLACEMENT: Record<string, { photoScale: number; centerX: number; centerY: number }> = {
  "frame-alianca-ouro.png": { photoScale: 0.57, centerX: 0.501, centerY: 0.498 },
  "frame-coroa-espinhos.png": { photoScale: 0.58, centerX: 0.504, centerY: 0.49 },
  "frame-louros-dourados.png": { photoScale: 0.5, centerX: 0.5, centerY: 0.5 },
  "frame-floral-rosa.png": { photoScale: 0.38, centerX: 0.501, centerY: 0.506 },
  "frame-vitral-sagrado.png": { photoScale: 0.48, centerX: 0.496, centerY: 0.479 },
  "frame-eclipse-dourado.png": { photoScale: 0.74, centerX: 0.5, centerY: 0.47 },
  "frame-neon-violeta.png": { photoScale: 0.62, centerX: 0.5, centerY: 0.5 },
  "frame-horizonte.png": { photoScale: 0.74, centerX: 0.5, centerY: 0.5 },
  "frame-cristal-do-rei.png": { photoScale: 0.52, centerX: 0.5, centerY: 0.49 },
  "frame-chama-sagrada.png": { photoScale: 0.58, centerX: 0.5, centerY: 0.5 },
  "frame-galaxia.png": { photoScale: 0.52, centerX: 0.5, centerY: 0.5 },
  "frame-aurora-boreal.png": { photoScale: 0.54, centerX: 0.5, centerY: 0.5 },
  "frame-minimalista-prata.png": { photoScale: 0.8, centerX: 0.5, centerY: 0.495 },
  "frame-coracao-radiante.png": { photoScale: 0.72, centerX: 0.5, centerY: 0.49 },
  "frame-vortice.png": { photoScale: 0.55, centerX: 0.5, centerY: 0.5 },
  "frame-folhas-oliveiras.png": { photoScale: 0.62, centerX: 0.5, centerY: 0.5 },
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
  isCommitted?: boolean;
};

let cachedCatalog: Decoration[] | null = null;
const listeners = new Set<(c: Decoration[]) => void>();

function ensureCatalog(): Decoration[] | null {
  if (cachedCatalog) return cachedCatalog;
  fetchDecorationRenderCatalog()
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
  isCommitted = false,
}: DecoratedAvatarProps) {
  void _stickerId;
  const hasAny = !!(frameId || auraId);
  const [catalog, setCatalog] = useState<Decoration[] | null>(cachedCatalog);
  const resolvedPhoto = useSignedPhotoUrl(photoUrl ?? null);

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
    id && catalog ? (catalog.find((d) => d.id === id) ?? null) : null;
  const frame = find(frameId);
  const aura = find(auraId);

  const initial = fallback ?? "?";
  const frameAsset = frame ? assetFor(frame) : null;
  const auraAsset = aura ? assetFor(aura) : null;
  const placement = frame?.image_url
    ? (FRAME_PLACEMENT[frame.image_url] ?? DEFAULT_FRAME_PLACEMENT)
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
      {auraAsset && (
        <img
          src={auraAsset}
          alt=""
          aria-hidden
          className="pointer-events-none absolute object-contain"
          style={{
            inset: `-${Math.round(canvas * 0.12)}px`,
            width: canvas * 1.24,
            height: canvas * 1.24,
            zIndex: 1,
            filter: "drop-shadow(0 0 18px rgba(255,255,255,.18))",
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
        {resolvedPhoto ? (
          <img
            src={resolvedPhoto}
            alt={alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
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
      {isCommitted && (
        <img
          src={commitmentRing}
          alt="Propósito Firmado"
          className="pointer-events-none absolute object-contain"
          style={{
            width: Math.max(24, canvas * 0.24),
            height: Math.max(24, canvas * 0.24),

            right: -2,
            bottom: -2,

            zIndex: 50,

            filter: "drop-shadow(0 2px 6px rgba(0,0,0,.25))",
          }}
        />
      )}
    </div>
  );
}
