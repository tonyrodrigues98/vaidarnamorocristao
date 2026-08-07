import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendPushToSubscription } from "@/lib/pushDispatch.server";
import type { PushDispatchBatchResult } from "@/lib/pushDispatchAuth.server";

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

export async function processPushDispatchBatch(): Promise<PushDispatchBatchResult> {
  const { data: items, error } = await supabaseAdmin
    .from("push_queue")
    .select("id, user_id, title, body, url, attempts")
    .is("processed_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw new Error(error.message);
  if (!items || items.length === 0) return { processed: 0, sent: 0, removed: 0 };

  const userIds = Array.from(new Set(items.map((i) => i.user_id)));
  const { data: subs, error: subErr } = await supabaseAdmin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (subErr) throw new Error(subErr.message);

  const subsByUser = new Map<string, typeof subs>();
  for (const s of subs ?? []) {
    const list = subsByUser.get(s.user_id) ?? [];
    list.push(s);
    subsByUser.set(s.user_id, list);
  }

  const toRemoveEndpoints = new Set<string>();
  const failedIds: { id: string; attempts: number; error: string }[] = [];
  const successIds: string[] = [];
  let sent = 0;

  for (const item of items) {
    const userSubs = subsByUser.get(item.user_id) ?? [];
    if (userSubs.length === 0) {
      // No subscriptions — mark processed so we don't loop.
      successIds.push(item.id);
      continue;
    }
    const payload = {
      title: item.title,
      body: item.body ?? undefined,
      url: item.url ?? undefined,
    };
    const results = await Promise.all(
      userSubs.map((s) =>
        sendPushToSubscription({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload),
      ),
    );
    const anyOk = results.some((r) => r.ok);
    for (const r of results) {
      if (r.ok) sent++;
      if (r.removed) toRemoveEndpoints.add(r.endpoint);
    }
    if (anyOk || results.every((r) => r.removed)) {
      successIds.push(item.id);
    } else {
      const errMsg = results.find((r) => !r.ok)?.error ?? "unknown";
      failedIds.push({ id: item.id, attempts: item.attempts + 1, error: errMsg.slice(0, 300) });
    }
  }

  if (toRemoveEndpoints.size > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", Array.from(toRemoveEndpoints));
  }

  if (successIds.length > 0) {
    await supabaseAdmin
      .from("push_queue")
      .update({ processed_at: new Date().toISOString() })
      .in("id", successIds);
  }

  for (const f of failedIds) {
    await supabaseAdmin
      .from("push_queue")
      .update({ attempts: f.attempts, last_error: f.error })
      .eq("id", f.id);
  }

  return {
    processed: items.length,
    sent,
    removed: toRemoveEndpoints.size,
    failed: failedIds.length,
  };
}
