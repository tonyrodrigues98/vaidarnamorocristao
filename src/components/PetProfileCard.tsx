import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, PawPrint, Sparkles } from "lucide-react";

import { resolvePetDisplayImage } from "@/lib/petCatalog";
import { managedPetQueryOptions, petBenefitsQueryOptions } from "@/lib/petQueries";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  /** When true, the whole card links to /meu-pet (own profile view). */
  linkToManager?: boolean;
  className?: string;
};

/**
 * Visual rich card showing the user's equipped pet with a
 * cutout-style image, neon glow, breed/life-stage line, personality chip,
 * and the list of active benefits resolved from the catalog.
 *
 * Renders nothing when the user has no pet (or, for public viewers, the
 * pet is private — enforced by RLS on the managed-pet table).
 */
export function PetProfileCard({ userId, linkToManager = false, className }: Props) {
  const petQuery = useQuery(managedPetQueryOptions(userId));
  const pet = petQuery.data ?? null;
  const benefitsQuery = useQuery(
    petBenefitsQueryOptions({
      categoryId: pet?.category?.id ?? null,
      speciesId: pet?.species?.id ?? null,
      variantId: pet?.variant?.id ?? null,
    }),
  );
  const benefits = benefitsQuery.data ?? [];

  if (petQuery.isLoading || !pet) return null;

  const stageKind = pet.life_stage?.kind ?? null;
  const image =
    resolvePetDisplayImage(pet.variant, stageKind) ??
    resolvePetDisplayImage(pet.species, stageKind) ??
    pet.category?.image_url ??
    null;
  const subtitle = [pet.variant?.name ?? pet.species?.name, pet.life_stage?.name]
    .filter(Boolean)
    .join(" • ");

  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 via-card to-card p-3 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] dark:border-neutral-700/60 dark:from-neutral-800/40 dark:via-card dark:to-card",
        className,
      )}
    >
      <div className="flex items-stretch gap-3">
        {/* Pet artwork with neon disc */}
        <div className="relative flex h-[110px] w-[110px] shrink-0 items-end justify-center">
          {/* ground shadow disc — cinza, sutil */}
          <div
            aria-hidden
            className="absolute inset-x-3 bottom-1 h-3 rounded-[50%] bg-neutral-900/25 blur-lg"
          />
          <div
            aria-hidden
            className="absolute inset-x-5 bottom-2 h-1 rounded-[50%] bg-neutral-900/30 blur-[2px]"
          />
          {image ? (
            <img
              src={image}
              alt={pet.custom_name || pet.variant?.name || "Pet"}
              className="relative h-[100px] w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.22)] transition-transform duration-300 group-hover:-translate-y-0.5"
              draggable={false}
              loading="lazy"
            />
          ) : (
            <PawPrint className="relative h-12 w-12 text-neutral-400" aria-hidden />
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <PawPrint className="h-3 w-3" aria-hidden />
              Meu Pet
            </div>
            {linkToManager && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="truncate text-base font-bold text-foreground">
              {pet.custom_name || pet.variant?.name || "Pet"}
            </span>
            <span className="text-neutral-400">♥</span>
          </div>

          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}

          {pet.personality && (
            <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700/40 dark:text-neutral-200">
              <Sparkles className="h-3 w-3" aria-hidden />
              {pet.personality.name}
            </span>
          )}
        </div>
      </div>

      {benefits.length > 0 && (
        <div className="mt-3 border-t border-neutral-200/70 pt-2.5 dark:border-neutral-700/40">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Benefícios ativos
          </p>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {benefits.slice(0, 4).map((b) => (
              <li key={b.id} className="flex items-center gap-1.5 text-[11px] text-foreground">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-500/15 text-neutral-600 dark:text-neutral-300">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden />
                </span>
                <span className="truncate">{b.perk_label || b.name}</span>
              </li>
            ))}
          </ul>
          {benefits.length > 4 && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              +{benefits.length - 4} outros benefícios
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (linkToManager) {
    return (
      <Link to="/meu-pet" className="app-pressable block">
        {inner}
      </Link>
    );
  }
  return inner;
}
