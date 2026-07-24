import type { CommunityHubRepository } from "./contracts";
import { supabaseCommunityHubRepository } from "./repository";
import { V2CommunityHub } from "./V2CommunityHub";

export function V2CommunityHubFeature({
  userId,
  repository = supabaseCommunityHubRepository,
}: {
  readonly userId: string;
  readonly repository?: CommunityHubRepository;
}) {
  return <V2CommunityHub userId={userId} repository={repository} />;
}
