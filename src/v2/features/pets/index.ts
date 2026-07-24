import "./styles.css";

export {
  PET_ARCADE_GAME_IDS,
  PET_ARCADE_MANIFEST,
  PET_CARE_KINDS,
  clampPetNeed,
  createPetCommandKey,
  derivePetNeedAtServerTime,
  isPetArcadeGameId,
  isPetCareKind,
  safePetAssetUrl,
  type PetArcadeGameId,
  type PetArcadeManifestEntry,
  type PetArcadeSnapshot,
  type PetCareAnchor,
  type PetCareConfig,
  type PetCareItem,
  type PetCareKind,
  type PetCareReceipt,
  type PetIdentity,
  type PetPlatformRepository,
  type PetPlatformSnapshot,
} from "./contracts";
export {
  parsePetArcadeSnapshot,
  parsePetCareReceipt,
  parsePetPlatformSnapshot,
  petRepositoryBoundaries,
  supabasePetPlatformRepository,
} from "./repository";
export { V2PetsFeature } from "./V2PetsFeature";
