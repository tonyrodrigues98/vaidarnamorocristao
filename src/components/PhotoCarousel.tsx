import { useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignedPhotoUrlResult } from "@/lib/photoUrl";

interface Props {
  photos: string[];
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

export function PhotoCarousel({ photos, alt, fallback, className, imgClassName, eager }: Props) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);
  const total = photos.length;
  const has = total > 0;
  const { url: currentSrc, loading: photoLoading, refresh: refreshPhoto } = useSignedPhotoUrlResult(
    has ? photos[index] : null
  );

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const go = (next: number) => {
    if (!total) return;
    setIndex(((next % total) + total) % total);
  };

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (startX.current == null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(deltaX.current) > 40) {
      go(deltaX.current < 0 ? index + 1 : index - 1);
    }
    startX.current = null;
    deltaX.current = 0;
  };

  return (
    <div
      className={cn("relative h-full w-full select-none", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {has && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          onError={refreshPhoto}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : has ? (
        fallback ?? (
          <div
            aria-hidden
            className={cn(
              "h-full w-full bg-muted",
              photoLoading ? "animate-pulse" : "",
              imgClassName
            )}
          />
        )
      ) : (
        fallback
      )}

      {total > 1 && (
        <>
          {/* segmented progress bars (Tinder-style) */}
          <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex gap-1">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-opacity",
                  i === index ? "bg-white/95" : "bg-white/40"
                )}
              />
            ))}
          </div>

          {/* desktop arrows */}
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => { stop(e); go(index - 1); }}
            className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(e) => { stop(e); go(index + 1); }}
            className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* invisible tap zones for mobile (left/right halves) */}
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => { stop(e); go(index - 1); }}
            className="absolute left-0 top-0 z-10 h-full w-1/3 sm:hidden"
          />
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(e) => { stop(e); go(index + 1); }}
            className="absolute right-0 top-0 z-10 h-full w-1/3 sm:hidden"
          />
        </>
      )}
    </div>
  );
}
