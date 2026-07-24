import { sanitizeInternalDestination } from "@/v2/platform/navigation/internal-destination";

export const NOTIFICATION_CATEGORIES = [
  "community",
  "conversations",
  "dating",
  "purpose",
  "content",
  "cinema",
  "pets",
  "economy",
  "security",
  "support",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface TrustNotification {
  readonly id: string;
  readonly category: NotificationCategory;
  readonly title: string;
  readonly body: string;
  readonly destination: string | null;
  readonly readAt: string | null;
  readonly createdAt: string;
  readonly sensitive: boolean;
}

export interface NotificationPreference {
  readonly category: NotificationCategory;
  readonly inboxEnabled: boolean;
  readonly pushEnabled: boolean;
  readonly digestEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly essential: boolean;
}

export interface SupportTicketSummary {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly status: string;
  readonly lastMessageAt: string;
}

export interface TrustCenterSnapshot {
  readonly notifications: readonly TrustNotification[];
  readonly preferences: readonly NotificationPreference[];
  readonly supportTickets: readonly SupportTicketSummary[];
  readonly unreadCount: number;
  readonly blockedCount: number;
  readonly mutedCount: number;
  readonly photoVerification: "not-started" | "pending" | "approved" | "action-required";
}

export interface TrustCenterRepository {
  loadCenter(userId: string): Promise<TrustCenterSnapshot>;
  markRead(userId: string, notificationId: string): Promise<void>;
  savePreference(userId: string, preference: NotificationPreference): Promise<void>;
}

const TYPE_CATEGORY: Readonly<Record<string, NotificationCategory>> = {
  message: "conversations",
  interest: "dating",
  match: "dating",
  purpose: "purpose",
  devotional: "content",
  cinema: "cinema",
  pet: "pets",
  coins: "economy",
  security: "security",
  support: "support",
};

export function classifyNotificationType(type: string): NotificationCategory {
  const normalized = type.toLowerCase();
  const direct = TYPE_CATEGORY[normalized];
  if (direct) return direct;
  const prefix = Object.keys(TYPE_CATEGORY).find((candidate) =>
    normalized.startsWith(`${candidate}_`),
  );
  return prefix ? TYPE_CATEGORY[prefix] : "community";
}

export function normalizeNotificationDestination(
  destination: unknown,
  origin = "https://vaidarnamoro.com",
): string | null {
  if (typeof destination !== "string") return null;
  return sanitizeInternalDestination(destination, { origin, fallback: null });
}

export function canDisablePreference(preference: NotificationPreference): boolean {
  return !preference.essential && preference.category !== "security";
}

export const trustBoundaryContract = Object.freeze({
  blockIsGlobal: true,
  muteIsNotBlock: true,
  reportDoesNotBlockAutomatically: true,
  securityInboxCanBeDisabled: false,
  aiFailureApprovesIdentity: false,
  notificationEventSeparatedFromDelivery: true,
  supportHistoryPreserved: true,
});
