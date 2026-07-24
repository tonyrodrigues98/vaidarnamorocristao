import type { AppRole } from "@/lib/roles";
import type { AdminConsoleRepository } from "./contracts";
import { supabaseAdminConsoleRepository } from "./repository";
import { V2AdminConsole } from "./V2AdminConsole";

export function V2AdminFeature({
  role,
  repository = supabaseAdminConsoleRepository,
}: {
  readonly role: AppRole;
  readonly repository?: AdminConsoleRepository;
}) {
  return <V2AdminConsole role={role} repository={repository} />;
}
