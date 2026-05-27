import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchDecorationCatalog, assetFor, type Decoration } from "@/lib/decorations";

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
  stickerId,
  alt = "",
}: DecoratedAvatarProps) {
  const hasAny = !!(frameId || auraId || stickerId);
  const [catalog, setCatalog] = useState<Decoration[] | null>(cachedCatalog);

  useEffect(() => {
    if (!hasAny || catalog) return;
    ensureCatalog();
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
  const sticker = find(stickerId);

  const initial = fallback ?? "?";

  return (
    <div
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {aura?.css_value && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: `-${Math.round(size * 0.18)}px`,
            background: `radial-gradient(circle, ${aura.css_value}AA 0%, ${aura.css_value}55 45%, transparent 70%)`,
            filter: `blur(${Math.max(8, size * 0.12)}px)`,
            zIndex: 0,
          }}
        />
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
      {frame && assetFor(frame) && (
        <img
          src={assetFor(frame)!}
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: `-${Math.round(size * 0.1)}px`,
            left: `-${Math.round(size * 0.1)}px`,
            width: size * 1.2,
            height: size * 1.2,
            zIndex: 20,
          }}
        />
      )}
      {sticker && assetFor(sticker) && (
        <img
          src={assetFor(sticker)!}
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            width: size * 0.42,
            height: size * 0.42,
            right: -size * 0.04,
            bottom: -size * 0.04,
            zIndex: 30,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
          }}
        />
      )}
    </div>
  );
}