import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";

import { equippedPetV1QueryOptions } from "@/lib/petQueries";
import { classifyPetMediaSource } from "@/lib/petCatalog";
import { PET_RARITY_META } from "@/types/pet";
import { cn } from "@/lib/utils";

interface EquippedPetBadgeProps {
  userId: string;
  /** When true, clicking the badge navigates to `/meu-pet` (own profile). */
  linkToManager?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function EquippedPetBadge({
  userId,
  linkToManager = false,
  size = "md",
  className,
}: EquippedPetBadgeProps) {
  const { data: pet, isLoading } = useQuery(equippedPetV1QueryOptions(userId));
  if (isLoading || !pet) return null;

  const rarity = PET_RARITY_META[pet.pet.rarity];
  const displayName = pet.custom_name?.trim() || pet.pet.name;
  const imageUrl = classifyPetMediaSource(pet.pet.image_url).url;
  const avatarSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card/90 pl-1 pr-3 py-1 text-xs font-medium shadow-sm backdrop-blur",
        rarity.borderClass,
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-muted",
          avatarSize,
          rarity.ringClass,
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={pet.pet.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <PawPrint className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        )}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Pet</span>
        <span className="truncate max-w-[10rem] text-foreground">{displayName}</span>
      </span>
    </span>
  );

  if (linkToManager) {
    return (
      <Link to="/meu-pet" className="app-pressable inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}
