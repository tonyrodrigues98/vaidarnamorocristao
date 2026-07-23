import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  processPushDispatchBatchWithDependencies,
  type ClaimedPushQueueItem,
  type PushDispatchBatchDependencies,
  type PushSubscriptionRecord,
} from "../src/lib/pushDispatchBatchCore.server";

const migration = readFileSync(
  resolve("supabase/migrations/20260723000002_v2_atomic_push_dispatch.sql"),
  "utf8",
);

function claimed(overrides: Partial<ClaimedPushQueueItem> = {}): ClaimedPushQueueItem {
  return {
    queue_id: "queue-1",
    lease_token: "lease-1",
    user_id: "user-1",
    title: "Nova mensagem",
    body: "Você recebeu uma mensagem.",
    url: "/conversas/match-1",
    attempts: 1,
    ...overrides,
  };
}

function subscription(overrides: Partial<PushSubscriptionRecord> = {}): PushSubscriptionRecord {
  return {
    user_id: "user-1",
    endpoint: "https://push.example.test/subscription-1",
    p256dh: "public-key",
    auth: "auth-key",
    ...overrides,
  };
}

function dependencies(
  overrides: Partial<PushDispatchBatchDependencies> = {},
): PushDispatchBatchDependencies {
  return {
    claimBatch: vi.fn().mockResolvedValue([claimed()]),
    loadSubscriptions: vi.fn().mockResolvedValue([subscription()]),
    send: vi.fn().mockResolvedValue({
      endpoint: "https://push.example.test/subscription-1",
      ok: true,
    }),
    removeSubscriptions: vi.fn().mockResolvedValue(undefined),
    completeItem: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("atomic push migration", () => {
  it("claims rows in one locked statement and gives every claim a token", () => {
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("SET claim_token = gen_random_uuid()");
    expect(migration).toContain("claimed_at = now()");
    expect(migration).toContain("queue_row.claim_token = _lease_token");
  });

  it("provides bounded leases, retries, TTL and terminal state", () => {
    expect(migration).toContain("_lease_seconds < 15 OR _lease_seconds > 600");
    expect(migration).toContain("next_attempt_at");
    expect(migration).toContain("interval '28 days'");
    expect(migration).toContain("dead_lettered_at");
    expect(migration).toContain("power(2, greatest(0, queue_row.attempts - 1))");
  });

  it("keeps claim and completion unavailable to browser roles", () => {
    for (const signature of [
      "claim_push_dispatch_batch(integer, integer)",
      "complete_push_dispatch_item(uuid, uuid, text, text)",
    ]) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION public.${signature}\n  FROM PUBLIC, anon, authenticated`,
      );
      expect(migration).toMatch(
        new RegExp(
          `GRANT EXECUTE ON FUNCTION public\\.${signature.replace(/[(),]/g, "\\$&").replace(/\s+/g, "\\s+")}\\s+TO service_role`,
        ),
      );
    }
  });

  it("is additive and does not delete queue data", () => {
    expect(migration).not.toMatch(/\b(?:DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM)\b/i);
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS claim_token");
    expect(migration).toContain("SET search_path = pg_catalog, public");
  });
});

describe("atomic push batch core", () => {
  it("returns an empty aggregate without loading private subscriptions", async () => {
    const deps = dependencies({ claimBatch: vi.fn().mockResolvedValue([]) });

    await expect(processPushDispatchBatchWithDependencies(deps)).resolves.toEqual({
      processed: 0,
      sent: 0,
      removed: 0,
      failed: 0,
    });
    expect(deps.loadSubscriptions).not.toHaveBeenCalled();
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("completes a delivered item with its exact lease token", async () => {
    const deps = dependencies();

    await expect(processPushDispatchBatchWithDependencies(deps)).resolves.toEqual({
      processed: 1,
      sent: 1,
      removed: 0,
      failed: 0,
    });
    expect(deps.claimBatch).toHaveBeenCalledWith(50);
    expect(deps.completeItem).toHaveBeenCalledWith("queue-1", "lease-1", "success");
  });

  it("completes an item with no subscriptions without sending", async () => {
    const deps = dependencies({ loadSubscriptions: vi.fn().mockResolvedValue([]) });

    const result = await processPushDispatchBatchWithDependencies(deps);

    expect(result).toEqual({ processed: 1, sent: 0, removed: 0, failed: 0 });
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.completeItem).toHaveBeenCalledWith("queue-1", "lease-1", "success");
  });

  it("removes invalid subscriptions and does not retry an all-invalid item", async () => {
    const deps = dependencies({
      send: vi.fn().mockResolvedValue({
        endpoint: "https://push.example.test/subscription-1",
        ok: false,
        removed: true,
        errorCode: "subscription_gone",
      }),
    });

    const result = await processPushDispatchBatchWithDependencies(deps);

    expect(result).toEqual({ processed: 1, sent: 0, removed: 1, failed: 0 });
    expect(deps.removeSubscriptions).toHaveBeenCalledWith([
      "https://push.example.test/subscription-1",
    ]);
    expect(deps.completeItem).toHaveBeenCalledWith("queue-1", "lease-1", "success");
  });

  it("retries a delivery failure using only a categorical error", async () => {
    const deps = dependencies({
      send: vi.fn().mockResolvedValue({
        endpoint: "https://push.example.test/subscription-1",
        ok: false,
        errorCode: "push_rejected",
      }),
    });

    const result = await processPushDispatchBatchWithDependencies(deps);

    expect(result.failed).toBe(1);
    expect(deps.completeItem).toHaveBeenCalledWith("queue-1", "lease-1", "retry", "push_rejected");
  });

  it("turns unexpected transport exceptions into a retry without leaking details", async () => {
    const deps = dependencies({
      send: vi.fn().mockRejectedValue(new Error("credential and endpoint details")),
    });

    await processPushDispatchBatchWithDependencies(deps);

    expect(deps.completeItem).toHaveBeenCalledWith(
      "queue-1",
      "lease-1",
      "retry",
      "push_transport_error",
    );
  });

  it("preserves successful delivery when another subscription fails", async () => {
    const deps = dependencies({
      loadSubscriptions: vi.fn().mockResolvedValue([
        subscription(),
        subscription({
          endpoint: "https://push.example.test/subscription-2",
          p256dh: "public-key-2",
          auth: "auth-key-2",
        }),
      ]),
      send: vi
        .fn()
        .mockResolvedValueOnce({
          endpoint: "https://push.example.test/subscription-1",
          ok: true,
        })
        .mockResolvedValueOnce({
          endpoint: "https://push.example.test/subscription-2",
          ok: false,
          errorCode: "push_rejected",
        }),
    });

    const result = await processPushDispatchBatchWithDependencies(deps);

    expect(result).toEqual({ processed: 1, sent: 1, removed: 0, failed: 0 });
    expect(deps.completeItem).toHaveBeenCalledWith("queue-1", "lease-1", "success");
  });
});

describe("push logging boundary", () => {
  it("does not log endpoint, provider body, stack or raw delivery errors", () => {
    const source = readFileSync(resolve("src/lib/pushDispatch.server.ts"), "utf8");

    expect(source).not.toContain("endpoint.slice");
    expect(source).not.toContain("err.body");
    expect(source).not.toContain("err.stack");
    expect(source).not.toContain("console.error");
    expect(source).toContain('"subscription_gone"');
    expect(source).toContain('"push_rejected"');
    expect(source).toContain('"transport_error"');
  });
});
