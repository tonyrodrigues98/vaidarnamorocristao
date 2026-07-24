import { describe, expect, it } from "vitest";
import {
  V2_OFFLINE_POLICIES,
  V2_OUTBOX_BOUNDARIES,
  canQueueOffline,
  cancelOutboxItem,
  completeOutboxItem,
  createOutboxItem,
  isOutboxReplayDue,
  markOutboxConflict,
  retryDelayMs,
  scheduleOutboxRetry,
} from "../src/v2/platform/resilience";

const queued = () =>
  createOutboxItem({
    clientId: "a".repeat(16),
    idempotencyKey: "b".repeat(16),
    action: "content.progress",
    subjectScope: "a".repeat(32),
    createdAt: 1_000,
    serverIdempotencyConfirmed: true,
  });

describe("V2-022 honest offline and outbox contracts", () => {
  it("classifies every declared action without an implicit default", () => {
    expect(Object.values(V2_OFFLINE_POLICIES)).toHaveLength(17);
    expect(
      Object.values(V2_OFFLINE_POLICIES).every((policy) => policy.userMessage.length > 0),
    ).toBe(true);
  });

  it("blocks economy, Admin, Cinema, uploads and message sending", () => {
    for (const action of [
      "economy.purchase",
      "admin.command",
      "cinema.join",
      "storage.upload",
      "messaging.send",
    ] as const) {
      expect(V2_OFFLINE_POLICIES[action].behavior).toBe("blocked");
      expect(canQueueOffline(action)).toBe(false);
    }
  });

  it("queues only a capability with an explicit server-idempotency contract", () => {
    expect(canQueueOffline("content.progress")).toBe(false);
    expect(canQueueOffline("content.progress", true)).toBe(true);
    expect(() =>
      createOutboxItem({
        clientId: "a".repeat(16),
        idempotencyKey: "b".repeat(16),
        action: "economy.purchase",
        subjectScope: "a".repeat(32),
        createdAt: 1_000,
        serverIdempotencyConfirmed: true,
      }),
    ).toThrow("offline_action_not_queueable");
  });

  it("uses bounded exponential retry and deterministic replay eligibility", () => {
    const first = scheduleOutboxRetry(queued(), 2_000);
    expect(first).toMatchObject({ attempt: 1, nextAttemptAt: 3_000, state: "retrying" });
    expect(isOutboxReplayDue(first, 2_999)).toBe(false);
    expect(isOutboxReplayDue(first, 3_000)).toBe(true);
    expect(retryDelayMs(20)).toBe(300_000);
  });

  it("represents conflicts, cancellation and completion without silent success", () => {
    expect(markOutboxConflict(queued(), "server-version-changed")).toMatchObject({
      state: "conflict",
      conflictCode: "server-version-changed",
    });
    expect(cancelOutboxItem(queued()).state).toBe("cancelled");
    expect(completeOutboxItem(queued()).state).toBe("completed");
  });

  it("does not persist payloads or enable critical outboxes in this stage", () => {
    expect(V2_OUTBOX_BOUNDARIES).toEqual({
      payloadPersistenceEnabled: false,
      privateStorageRequiresEncryptionReview: true,
      serverIdempotencyRequired: true,
      economyEnabled: false,
      messagingEnabled: false,
      adminEnabled: false,
      cinemaEnabled: false,
    });
  });
});
