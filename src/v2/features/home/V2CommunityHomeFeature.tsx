import type { CommunityHomeRepository } from "./contracts";
import { supabaseCommunityHomeRepository } from "./repository";
import { V2CommunityHome } from "./V2CommunityHome";
import { V2PeopleDiscovery } from "./V2PeopleDiscovery";

export function V2CommunityHomeFeature({
  userId,
  datingEnabled,
  onOpenDating,
  repository = supabaseCommunityHomeRepository,
}: {
  readonly userId: string;
  readonly datingEnabled: boolean;
  readonly onOpenDating?: () => void;
  readonly repository?: CommunityHomeRepository;
}) {
  return (
    <V2CommunityHome
      userId={userId}
      datingEnabled={datingEnabled}
      repository={repository}
      onOpenDating={onOpenDating}
    />
  );
}

export function V2PeopleDiscoveryFeature({
  userId,
  repository = supabaseCommunityHomeRepository,
}: {
  readonly userId: string;
  readonly repository?: CommunityHomeRepository;
}) {
  return <V2PeopleDiscovery userId={userId} repository={repository} />;
}
