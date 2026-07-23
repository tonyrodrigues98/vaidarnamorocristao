import type { PushDispatchBatchResult } from "@/lib/pushDispatchAuth.server";

export type ClaimedPushQueueItem = {
  queue_id: string;
  lease_token: string;
  user_id: string;
  title: string;
  body: string | null;
  url: string | null;
  attempts: number;
};

export type PushSubscriptionRecord = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSendResult = {
  endpoint: string;
  ok: boolean;
  removed?: boolean;
  errorCode?: string;
};

export type PushCompletionOutcome = "success" | "retry" | "dead";

export type PushDispatchBatchDependencies = {
  claimBatch: (limit: number) => Promise<ClaimedPushQueueItem[]>;
  loadSubscriptions: (userIds: string[]) => Promise<PushSubscriptionRecord[]>;
  send: (
    subscription: Omit<PushSubscriptionRecord, "user_id">,
    payload: { title: string; body?: string; url?: string },
  ) => Promise<PushSendResult>;
  removeSubscriptions: (endpoints: string[]) => Promise<void>;
  completeItem: (
    queueId: string,
    leaseToken: string,
    outcome: PushCompletionOutcome,
    errorCode?: string,
  ) => Promise<void>;
};

const BATCH_SIZE = 50;

function groupSubscriptions(subscriptions: PushSubscriptionRecord[]) {
  const grouped = new Map<string, PushSubscriptionRecord[]>();
  for (const subscription of subscriptions) {
    const current = grouped.get(subscription.user_id) ?? [];
    current.push(subscription);
    grouped.set(subscription.user_id, current);
  }
  return grouped;
}

export async function processPushDispatchBatchWithDependencies(
  dependencies: PushDispatchBatchDependencies,
): Promise<PushDispatchBatchResult> {
  const items = await dependencies.claimBatch(BATCH_SIZE);
  if (items.length === 0) return { processed: 0, sent: 0, removed: 0, failed: 0 };

  const userIds = Array.from(new Set(items.map((item) => item.user_id)));
  const subscriptions = groupSubscriptions(await dependencies.loadSubscriptions(userIds));
  const invalidEndpoints = new Set<string>();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    const userSubscriptions = subscriptions.get(item.user_id) ?? [];
    if (userSubscriptions.length === 0) {
      await dependencies.completeItem(item.queue_id, item.lease_token, "success");
      continue;
    }

    let results: PushSendResult[];
    try {
      results = await Promise.all(
        userSubscriptions.map(({ user_id: _userId, ...subscription }) =>
          dependencies.send(subscription, {
            title: item.title,
            body: item.body ?? undefined,
            url: item.url ?? undefined,
          }),
        ),
      );
    } catch {
      failed += 1;
      await dependencies.completeItem(
        item.queue_id,
        item.lease_token,
        "retry",
        "push_transport_error",
      );
      continue;
    }

    for (const result of results) {
      if (result.ok) sent += 1;
      if (result.removed) invalidEndpoints.add(result.endpoint);
    }

    const anyDelivered = results.some((result) => result.ok);
    const allInvalid = results.every((result) => result.removed);
    if (anyDelivered || allInvalid) {
      await dependencies.completeItem(item.queue_id, item.lease_token, "success");
      continue;
    }

    failed += 1;
    const errorCode = results.find((result) => !result.ok)?.errorCode ?? "push_delivery_failed";
    await dependencies.completeItem(item.queue_id, item.lease_token, "retry", errorCode);
  }

  if (invalidEndpoints.size > 0) {
    await dependencies.removeSubscriptions(Array.from(invalidEndpoints));
  }

  return {
    processed: items.length,
    sent,
    removed: invalidEndpoints.size,
    failed,
  };
}
