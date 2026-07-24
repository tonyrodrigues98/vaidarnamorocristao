import { supabase } from "@/integrations/supabase/client";
import {
  classifyNotificationType,
  normalizeNotificationDestination,
  type NotificationPreference,
  type SupportTicketSummary,
  type TrustCenterRepository,
  type TrustCenterSnapshot,
  type TrustNotification,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível atualizar a Central de confiança agora.";

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function parseNotification(value: unknown): TrustNotification | null {
  const row = record(value);
  const id = text(row.id);
  if (!id) return null;
  return {
    id,
    category: classifyNotificationType(text(row.type)),
    title: text(row.title, "Atualização"),
    body: text(row.body),
    destination: normalizeNotificationDestination(row.link),
    readAt: optionalText(row.read_at),
    createdAt: text(row.created_at),
    sensitive: row.sensitive === true,
  };
}

function parsePreference(value: unknown): NotificationPreference | null {
  const row = record(value);
  const category = text(row.category) as NotificationPreference["category"];
  if (!category) return null;
  const essential = row.essential === true || category === "security";
  return {
    category,
    inboxEnabled: essential ? true : row.inbox_enabled !== false,
    pushEnabled: row.push_enabled !== false,
    digestEnabled: row.digest_enabled === true,
    soundEnabled: row.sound_enabled === true,
    essential,
  };
}

function parseTicket(value: unknown): SupportTicketSummary | null {
  const row = record(value);
  if (!text(row.id)) return null;
  return {
    id: text(row.id),
    title: text(row.title, "Atendimento"),
    category: text(row.category, "other"),
    status: text(row.status, "open"),
    lastMessageAt: text(row.last_message_at),
  };
}

export function parseTrustCenter(value: unknown): TrustCenterSnapshot {
  const row = record(value);
  const notifications = Array.isArray(row.notifications)
    ? row.notifications
        .map(parseNotification)
        .filter((item): item is TrustNotification => item !== null)
    : [];
  return {
    notifications,
    preferences: Array.isArray(row.preferences)
      ? row.preferences
          .map(parsePreference)
          .filter((item): item is NotificationPreference => item !== null)
      : [],
    supportTickets: Array.isArray(row.support_tickets)
      ? row.support_tickets
          .map(parseTicket)
          .filter((item): item is SupportTicketSummary => item !== null)
      : [],
    unreadCount:
      typeof row.unread_count === "number"
        ? Math.max(0, Math.trunc(row.unread_count))
        : notifications.filter((item) => !item.readAt).length,
    blockedCount: typeof row.blocked_count === "number" ? Math.max(0, row.blocked_count) : 0,
    mutedCount: typeof row.muted_count === "number" ? Math.max(0, row.muted_count) : 0,
    photoVerification:
      row.photo_verification === "approved" ||
      row.photo_verification === "pending" ||
      row.photo_verification === "action-required"
        ? row.photo_verification
        : "not-started",
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseTrustCenterRepository: TrustCenterRepository = {
  async loadCenter(_userId) {
    return parseTrustCenter(await rpc("get_trust_center_v2"));
  },
  async markRead(_userId, notificationId) {
    await rpc("mark_notification_read_v2", { _notification_id: notificationId });
  },
  async savePreference(_userId, preference) {
    await rpc("save_notification_preference_v2", {
      _category: preference.category,
      _inbox_enabled: preference.inboxEnabled,
      _push_enabled: preference.pushEnabled,
      _digest_enabled: preference.digestEnabled,
      _sound_enabled: preference.soundEnabled,
    });
  },
};

export const trustRepositoryBoundaries = Object.freeze({
  rawSessionExposed: false,
  pushQueueReadable: false,
  supportAttachmentsExposed: false,
  moderationEvidenceExposed: false,
  preferenceAuthorityServerSide: true,
});
