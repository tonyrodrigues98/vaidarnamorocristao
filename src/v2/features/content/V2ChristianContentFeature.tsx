import type { ChristianContentRepository } from "./contracts";
import { supabaseChristianContentRepository } from "./repository";
import { V2ChristianContentHub } from "./V2ChristianContentHub";

export function V2ChristianContentFeature({
  userId,
  repository = supabaseChristianContentRepository,
}: {
  readonly userId: string;
  readonly repository?: ChristianContentRepository;
}) {
  return <V2ChristianContentHub userId={userId} repository={repository} />;
}
