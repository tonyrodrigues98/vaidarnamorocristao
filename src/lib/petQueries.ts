import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { getManagedPet, listBenefitsFor } from "@/lib/petCatalog";
import {
  getEquippedBackground,
  listCompatibleBackgroundsForPet,
  listMyBackgroundUnlocks,
} from "@/lib/petBackgrounds";
import { getEquippedPet } from "@/lib/pets";
import { getMyXpState } from "@/lib/xp";

/**
 * Shared TanStack Query keys + options for the pet feature.
 *
 * Centralizando aqui evitamos que `PetProfileCard`, `EquippedPetSidekick`,
 * `EquippedPetBadge` e a própria rota `/meu-pet` disparem fetches duplicados
 * para os mesmos dados — a cache do TanStack Query passa a ser fonte única,
 * com tempos longos de `staleTime` (pet/cenário mudam pouco entre telas).
 */
export const petKeys = {
  all: ["pet"] as const,
  managed: (userId: string | null | undefined) => ["pet", "managed", userId ?? null] as const,
  benefits: (categoryId: string | null, speciesId: string | null, variantId: string | null) =>
    ["pet", "benefits", categoryId, speciesId, variantId] as const,
  equippedV1: (userId: string | null | undefined) =>
    ["pet", "equipped-v1", userId ?? null] as const,
  sceneryList: (categoryId: string | null, speciesId: string | null) =>
    ["pet", "scenery", "list", categoryId, speciesId] as const,
  sceneryUnlocks: () => ["pet", "scenery", "unlocks"] as const,
  sceneryEquipped: () => ["pet", "scenery", "equipped"] as const,
  xpState: () => ["pet", "xp"] as const,
};

const PET_STALE_LONG = 5 * 60_000;
const PET_STALE_MED = 2 * 60_000;

export const managedPetQueryOptions = (userId: string | null | undefined) =>
  queryOptions({
    queryKey: petKeys.managed(userId),
    enabled: !!userId,
    staleTime: PET_STALE_LONG,
    gcTime: 30 * 60_000,
    queryFn: () => getManagedPet(userId!),
  });

export const petBenefitsQueryOptions = (opts: {
  categoryId: string | null;
  speciesId: string | null;
  variantId: string | null;
}) =>
  queryOptions({
    queryKey: petKeys.benefits(opts.categoryId, opts.speciesId, opts.variantId),
    enabled: !!opts.categoryId,
    staleTime: PET_STALE_LONG,
    gcTime: 30 * 60_000,
    queryFn: () =>
      listBenefitsFor({
        categoryId: opts.categoryId!,
        speciesId: opts.speciesId,
        variantId: opts.variantId,
      }),
  });

export const equippedPetV1QueryOptions = (userId: string | null | undefined) =>
  queryOptions({
    queryKey: petKeys.equippedV1(userId),
    enabled: !!userId,
    staleTime: PET_STALE_LONG,
    gcTime: 30 * 60_000,
    queryFn: () => getEquippedPet(userId!),
  });

export const petSceneryListQueryOptions = (opts: {
  categoryId: string | null;
  speciesId: string | null;
}) =>
  queryOptions({
    queryKey: petKeys.sceneryList(opts.categoryId, opts.speciesId),
    enabled: !!opts.categoryId,
    staleTime: PET_STALE_MED,
    gcTime: 30 * 60_000,
    queryFn: () =>
      listCompatibleBackgroundsForPet({
        categoryId: opts.categoryId!,
        speciesId: opts.speciesId,
      }),
  });

export const petSceneryUnlocksQueryOptions = () =>
  queryOptions({
    queryKey: petKeys.sceneryUnlocks(),
    staleTime: PET_STALE_MED,
    gcTime: 30 * 60_000,
    queryFn: () => listMyBackgroundUnlocks(),
  });

export const petSceneryEquippedQueryOptions = () =>
  queryOptions({
    queryKey: petKeys.sceneryEquipped(),
    staleTime: PET_STALE_MED,
    gcTime: 30 * 60_000,
    queryFn: () => getEquippedBackground(),
  });

export const petXpStateQueryOptions = () =>
  queryOptions({
    queryKey: petKeys.xpState(),
    staleTime: PET_STALE_MED,
    gcTime: 30 * 60_000,
    queryFn: () => getMyXpState().catch(() => null),
  });

/**
 * Pré-aquece a cache para os blocos de pet exibidos em `/perfil` e nos
 * cards do app. Idempotente — chamadas extras só revalidam quando o dado
 * está realmente velho. Use no `/perfil` (ou em qualquer tela "vizinha"
 * de `/meu-pet`) para que ao abrir o gerenciador a UI seja instantânea.
 */
export async function prefetchPetEssentials(
  qc: QueryClient,
  userId: string | null | undefined,
): Promise<void> {
  if (!userId) return;
  // 1. Garante o pet do usuário em cache.
  const pet = await qc.ensureQueryData(managedPetQueryOptions(userId));
  if (!pet?.category) return;
  // 2. Benefícios + cenário compatível em paralelo (não bloqueia o caller).
  void qc.prefetchQuery(
    petBenefitsQueryOptions({
      categoryId: pet.category.id,
      speciesId: pet.species?.id ?? null,
      variantId: pet.variant?.id ?? null,
    }),
  );
  void qc.prefetchQuery(
    petSceneryListQueryOptions({
      categoryId: pet.category.id,
      speciesId: pet.species?.id ?? null,
    }),
  );
  void qc.prefetchQuery(petSceneryUnlocksQueryOptions());
  void qc.prefetchQuery(petSceneryEquippedQueryOptions());
  void qc.prefetchQuery(petXpStateQueryOptions());
}
