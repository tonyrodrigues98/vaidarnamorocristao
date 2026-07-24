import "./styles.css";

export {
  ADMIN_MODULE_IDS,
  ADMIN_MODULES,
  adminModulesForRole,
  adminSafetyContract,
} from "./contracts";
export type {
  AdminConsoleRepository,
  AdminConsoleSnapshot,
  AdminHealthMetric,
  AdminModuleDescriptor,
  AdminModuleId,
} from "./contracts";
export {
  adminRepositoryBoundaries,
  parseAdminConsole,
  supabaseAdminConsoleRepository,
} from "./repository";
export { V2AdminFeature } from "./V2AdminFeature";
