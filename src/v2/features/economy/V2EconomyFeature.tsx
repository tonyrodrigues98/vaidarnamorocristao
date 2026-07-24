import type { EconomyRepository } from "./contracts";
import { supabaseEconomyRepository } from "./repository";
import { V2EconomyHub } from "./V2EconomyHub";

export function V2EconomyFeature({
  userId,
  repository = supabaseEconomyRepository,
}: {
  readonly userId: string;
  readonly repository?: EconomyRepository;
}) {
  return <V2EconomyHub userId={userId} repository={repository} />;
}
