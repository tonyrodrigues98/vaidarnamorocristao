import type { TrustCenterRepository } from "./contracts";
import { supabaseTrustCenterRepository } from "./repository";
import { V2TrustCenter } from "./V2TrustCenter";

export function V2TrustCenterFeature({
  userId,
  repository = supabaseTrustCenterRepository,
}: {
  readonly userId: string;
  readonly repository?: TrustCenterRepository;
}) {
  return <V2TrustCenter userId={userId} repository={repository} />;
}
