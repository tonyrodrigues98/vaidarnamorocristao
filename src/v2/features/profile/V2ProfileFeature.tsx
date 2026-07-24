import type { ProfileRepository } from "./contracts";
import { supabaseProfileRepository } from "./repository";
import { V2Profile } from "./V2Profile";

export function V2ProfileFeature({
  userId,
  profileUserId,
  repository = supabaseProfileRepository,
}: {
  readonly userId: string;
  readonly profileUserId?: string;
  readonly repository?: ProfileRepository;
}) {
  return <V2Profile userId={userId} profileUserId={profileUserId} repository={repository} />;
}
