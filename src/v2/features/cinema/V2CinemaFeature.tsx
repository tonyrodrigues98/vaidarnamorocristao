import type { CinemaRepository } from "./contracts";
import { supabaseCinemaRepository } from "./repository";
import { V2CinemaHub } from "./V2CinemaHub";

export function V2CinemaFeature({
  userId,
  repository = supabaseCinemaRepository,
}: {
  readonly userId: string;
  readonly repository?: CinemaRepository;
}) {
  return <V2CinemaHub userId={userId} repository={repository} />;
}
