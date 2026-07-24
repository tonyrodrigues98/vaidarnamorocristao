import { canQueueOffline, type V2OfflineAction } from "./offline-policy";

export type V2OutboxState = "queued" | "retrying" | "conflict" | "cancelled" | "completed";

export interface V2OutboxItem {
  readonly clientId: string;
  readonly idempotencyKey: string;
  readonly action: V2OfflineAction;
  readonly subjectScope: string;
  readonly createdAt: number;
  readonly attempt: number;
  readonly nextAttemptAt: number;
  readonly state: V2OutboxState;
  readonly conflictCode?: string;
}

const MAX_RETRY_DELAY_MS = 5 * 60_000;

export function createOutboxItem(input: {
  readonly clientId: string;
  readonly idempotencyKey: string;
  readonly action: V2OfflineAction;
  readonly subjectScope: string;
  readonly createdAt: number;
  readonly serverIdempotencyConfirmed: boolean;
}): V2OutboxItem {
  if (!canQueueOffline(input.action, input.serverIdempotencyConfirmed)) {
    throw new Error("offline_action_not_queueable");
  }
  if (!/^[a-f0-9-]{16,64}$/i.test(input.clientId)) throw new Error("invalid_client_id");
  if (!/^[a-f0-9-]{16,64}$/i.test(input.idempotencyKey)) {
    throw new Error("invalid_idempotency_key");
  }
  if (!/^[a-f0-9]{32,64}$/.test(input.subjectScope)) throw new Error("invalid_subject_scope");
  return Object.freeze({
    clientId: input.clientId,
    idempotencyKey: input.idempotencyKey,
    action: input.action,
    subjectScope: input.subjectScope,
    createdAt: input.createdAt,
    attempt: 0,
    nextAttemptAt: input.createdAt,
    state: "queued",
  });
}

export function retryDelayMs(attempt: number): number {
  if (!Number.isSafeInteger(attempt) || attempt < 1) throw new Error("invalid_retry_attempt");
  return Math.min(1_000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
}

export function scheduleOutboxRetry(item: V2OutboxItem, now: number): V2OutboxItem {
  const attempt = item.attempt + 1;
  return Object.freeze({
    ...item,
    attempt,
    nextAttemptAt: now + retryDelayMs(attempt),
    state: "retrying",
  });
}

export function markOutboxConflict(item: V2OutboxItem, conflictCode: string): V2OutboxItem {
  if (!/^[a-z0-9_-]{3,64}$/.test(conflictCode)) throw new Error("invalid_conflict_code");
  return Object.freeze({ ...item, state: "conflict", conflictCode });
}

export function cancelOutboxItem(item: V2OutboxItem): V2OutboxItem {
  return Object.freeze({ ...item, state: "cancelled" });
}

export function completeOutboxItem(item: V2OutboxItem): V2OutboxItem {
  return Object.freeze({ ...item, state: "completed" });
}

export function isOutboxReplayDue(item: V2OutboxItem, now: number): boolean {
  return (
    (item.state === "queued" || item.state === "retrying") &&
    item.nextAttemptAt <= now &&
    canQueueOffline(item.action, true)
  );
}

export const V2_OUTBOX_BOUNDARIES = Object.freeze({
  payloadPersistenceEnabled: false,
  privateStorageRequiresEncryptionReview: true,
  serverIdempotencyRequired: true,
  economyEnabled: false,
  messagingEnabled: false,
  adminEnabled: false,
  cinemaEnabled: false,
});
