import { usePetDayNight } from "@/lib/petDayNight";
import type { PetBackground } from "@/types/petBackground";

/**
 * Renders the day/night images of a pet background as two cross-fading layers.
 * Returns null when no background is equipped.
 */
export function PetBackgroundLayer({
  background,
  className,
}: {
  background: PetBackground | null;
  className?: string;
}) {
  const { dayOpacity } = usePetDayNight();
  if (!background) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {background.image_url_day && (
        <img
          src={background.image_url_day}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: dayOpacity, transition: "opacity 600ms ease-in-out" }}
        />
      )}
      {background.image_url_night && (
        <img
          src={background.image_url_night}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 1 - dayOpacity, transition: "opacity 600ms ease-in-out" }}
        />
      )}
    </div>
  );
}