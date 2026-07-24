import "./styles.css";

export {
  NOTIFICATION_CATEGORIES,
  canDisablePreference,
  classifyNotificationType,
  normalizeNotificationDestination,
  trustBoundaryContract,
} from "./contracts";
export type {
  NotificationCategory,
  NotificationPreference,
  SupportTicketSummary,
  TrustCenterRepository,
  TrustCenterSnapshot,
  TrustNotification,
} from "./contracts";
export {
  parseTrustCenter,
  supabaseTrustCenterRepository,
  trustRepositoryBoundaries,
} from "./repository";
export { V2TrustCenterFeature } from "./V2TrustCenterFeature";
