import type { PetPlatformRepository } from "./contracts";
import { supabasePetPlatformRepository } from "./repository";
import { V2PetsHub } from "./V2PetsHub";

export function V2PetsFeature({
  userId,
  repository = supabasePetPlatformRepository,
}: {
  readonly userId: string;
  readonly repository?: PetPlatformRepository;
}) {
  return <V2PetsHub userId={userId} repository={repository} />;
}
