import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  processPushDispatchBatchWithDependencies,
  type ClaimedPushQueueItem,
  type PushCompletionOutcome,
  type PushSubscriptionRecord,
} from "@/lib/pushDispatchBatchCore.server";
import { sendPushToSubscription } from "@/lib/pushDispatch.server";
import type { PushDispatchBatchResult } from "@/lib/pushDispatchAuth.server";

export async function processPushDispatchBatch(): Promise<PushDispatchBatchResult> {
  return processPushDispatchBatchWithDependencies({
    claimBatch: async (limit) => {
      const { data, error } = await supabaseAdmin.rpc(
        "claim_push_dispatch_batch" as never,
        {
          _batch_limit: limit,
          _lease_seconds: 120,
        } as never,
      );
      if (error) throw new Error("push_claim_failed");
      return (data ?? []) as unknown as ClaimedPushQueueItem[];
    },
    loadSubscriptions: async (userIds) => {
      const { data, error } = await supabaseAdmin
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth")
        .in("user_id", userIds);
      if (error) throw new Error("push_subscription_load_failed");
      return (data ?? []) as PushSubscriptionRecord[];
    },
    send: sendPushToSubscription,
    removeSubscriptions: async (endpoints) => {
      const { error } = await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", endpoints);
      if (error) throw new Error("push_subscription_cleanup_failed");
    },
    completeItem: async (
      queueId: string,
      leaseToken: string,
      outcome: PushCompletionOutcome,
      errorCode?: string,
    ) => {
      const { data, error } = await supabaseAdmin.rpc(
        "complete_push_dispatch_item" as never,
        {
          _queue_id: queueId,
          _lease_token: leaseToken,
          _outcome: outcome,
          _error_code: errorCode ?? null,
        } as never,
      );
      if (error || data !== true) throw new Error("push_completion_failed");
    },
  });
}
