import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  fetchDecorationRenderCatalog,
  assetFor,
  resolveAuraCssRender,
  type Decoration,
} from "@/lib/decorations";
import { useSignedPhotoUrlResult } from "@/lib/photoUrl";
import commitmentRing from "@/assets/commitment-ring.webp";
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
const DEFAULT_DECORATION_CANVAS_SCALE = 1 / DEFAULT_FRAME_PLACEMENT.photoScale;
const AURA_SCALE = 2.05;
const COMMITMENT_RING_SCALE = 0.36;

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

function publishCatalog(catalog: Decoration[]) {
  cachedCatalog = catalog;
  listeners.forEach((fn) => fn(catalog));
}

function hasDecorationIds(catalog: Decoration[] | null, ids: Array<string | null | undefined>) {
  const wanted = ids.filter(Boolean);
  if (!wanted.length) return true;
  if (!catalog) return false;
  return wanted.every((id) => catalog.some((decoration) => decoration.id === id));
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
  const refreshedMissingKey = useRef<string | null>(null);
  const {
    url: resolvedPhoto,
    loading: photoLoading,
    refresh: refreshPhoto,
  } = useSignedPhotoUrlResult(photoUrl ?? null);

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

  useEffect(() => {
    if (!hasAny || !catalog || hasDecorationIds(catalog, [frameId, auraId])) return;
    const missingKey = `${frameId ?? ""}:${auraId ?? ""}`;
    if (refreshedMissingKey.current === missingKey) return;
    refreshedMissingKey.current = missingKey;
    let cancelled = false;
    fetchDecorationRenderCatalog(true)
      .then((nextCatalog) => {
        if (cancelled) return;
        publishCatalog(nextCatalog);
        setCatalog(nextCatalog);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hasAny, catalog, frameId, auraId]);

  const find = (id: string | null | undefined) =>
    id && catalog ? (catalog.find((d) => d.id === id) ?? null) : null;
  const frame = find(frameId);
  const aura = find(auraId);

  const initial = fallback ?? "?";
  const frameAsset = frame ? assetFor(frame) : null;
  const auraAsset = aura ? assetFor(aura) : null;
  const auraCss = resolveAuraCssRender(aura?.css_value);
  const placement = frame?.image_url
    ? (FRAME_PLACEMENT[frame.image_url] ?? DEFAULT_FRAME_PLACEMENT)
    : DEFAULT_FRAME_PLACEMENT;
  // `size` representa o diâmetro da FOTO (constante). Quando existe moldura,
  // o canvas externo cresce para `size / photoScale` para acomodar a moldura
  // ao redor sem encolher a foto.
  const photoSize = size;
  const frameCanvas = frameAsset ? size / placement.photoScale : 0;
  const needsDecorationSpace = Boolean(
    frameId || auraId || frameAsset || auraAsset || auraCss || isCommitted,
  );
  const canvas = needsDecorationSpace
    ? Math.max(frameCanvas, size * DEFAULT_DECORATION_CANVAS_SCALE)
    : size;
  const frameOffsetX = frameAsset ? (canvas - frameCanvas) / 2 : 0;
  const frameOffsetY = frameAsset ? (canvas - frameCanvas) / 2 : 0;
  const photoCenterX = frameAsset ? frameOffsetX + frameCanvas * placement.centerX : canvas / 2;
  const photoCenterY = frameAsset ? frameOffsetY + frameCanvas * placement.centerY : canvas / 2;
  const auraSize = photoSize * AURA_SCALE;
  const cssAuraPadding = Math.round(photoSize * 0.42);
  const ringSize = Math.max(20, photoSize * COMMITMENT_RING_SCALE);
  const ringLeft = photoCenterX + photoSize / 2 - ringSize * 0.66;
  const ringTop = photoCenterY + photoSize / 2 - ringSize * 0.66;

  return (
    <div
      className={cn("relative inline-block shrink-0 overflow-visible", className)}
      style={{ width: canvas, height: canvas }}
    >
      {/* Image auras take priority; css_value remains as fallback for older auras. */}
      {auraAsset ? (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: photoCenterX,
            top: photoCenterY,
            width: auraSize,
            height: auraSize,
            transform: "translate(-50%, -50%)",
            zIndex: 0,
          }}
        >
          <img
            src={auraAsset}
            alt=""
            aria-hidden
            className="h-full w-full object-contain"
            style={{
              filter: "drop-shadow(0 0 18px rgba(255,255,255,.18))",
            }}
          />
        </div>
      ) : auraCss ? (
        (() => {
          if (auraCss.kind === "box-shadow") {
            return (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: photoCenterX - photoSize / 2,
                  top: photoCenterY - photoSize / 2,
                  width: photoSize,
                  height: photoSize,
                  boxShadow: auraCss.value,
                  zIndex: 0,
                }}
              />
            );
          }
          if (auraCss.kind === "background") {
            return (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: photoCenterX - photoSize / 2 - cssAuraPadding,
                  top: photoCenterY - photoSize / 2 - cssAuraPadding,
                  width: photoSize + cssAuraPadding * 2,
                  height: photoSize + cssAuraPadding * 2,
                  background: auraCss.value,
                  filter: `blur(${Math.max(8, photoSize * 0.13)}px)`,
                  zIndex: 0,
                }}
              />
            );
          }
          return (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                left: photoCenterX - photoSize / 2 - cssAuraPadding,
                top: photoCenterY - photoSize / 2 - cssAuraPadding,
                width: photoSize + cssAuraPadding * 2,
                height: photoSize + cssAuraPadding * 2,
                background: `radial-gradient(circle, ${auraCss.value}66 0%, ${auraCss.value}33 45%, transparent 72%)`,
                filter: `blur(${Math.max(8, photoSize * 0.13)}px)`,
                zIndex: 0,
              }}
            />
          );
        })()
      ) : null}
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
            decoding="async"
            onError={refreshPhoto}
          />
        ) : photoUrl && photoLoading ? (
          <div className="h-full w-full animate-pulse bg-muted" />
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
          className="pointer-events-none absolute object-contain"
          style={{
            left: frameOffsetX,
            top: frameOffsetY,
            width: frameCanvas,
            height: frameCanvas,
            zIndex: 20,
          }}
        />
      )}
      {isCommitted && (
        <img
          src={commitmentRing}
          alt="Propósito Firmado"
          className="pointer-events-none absolute object-contain"
          style={{
            width: ringSize,
            height: ringSize,
            left: ringLeft,
            top: ringTop,
            zIndex: 50,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,.25))",
          }}
        />
      )}
    </div>
  );
}
