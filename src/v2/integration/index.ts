import "./styles.css";

export { V2RuntimeErrorBoundary } from "./V2RuntimeErrorBoundary";
export { V2RuntimeShell, type V2RuntimeShellProps } from "./V2RuntimeShell";
export { V2RuntimeState, type V2RuntimeStateProps } from "./V2RuntimeState";
export { V2ShellRuntimeRoute } from "./V2ShellRuntimeRoute";
export {
  createV2ShellUser,
  performV2Logout,
  resolveV2RuntimeAccess,
  type V2RuntimeAccessDecision,
  type V2RuntimeAccessInput,
  type V2RuntimeIdentitySource,
} from "./contracts";
export {
  V2_RUNTIME_PRIMARY_NAVIGATION,
  V2_RUNTIME_SECONDARY_NAVIGATION,
  V2_RUNTIME_SLUGS,
  getV2RuntimeDocumentTitle,
  getV2RuntimeNavigation,
  getV2RuntimeRoute,
  isV2RuntimePath,
  type V2RuntimeRouteDescriptor,
  type V2RuntimeSlug,
} from "./route-registry";
