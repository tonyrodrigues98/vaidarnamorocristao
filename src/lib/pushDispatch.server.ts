import { sendNotification, WebPushError, type PushSubscription } from "web-push-neo";
import { getPushVapidDetails } from "@/lib/pushKeys.server";

type PushPayload = {
  title: string;
  body?: string;
  url?: string;
};

type Subscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendResult = {
  endpoint: string;
  ok: boolean;
  status: number;
  removed?: boolean;
  errorCode?: "subscription_gone" | "push_rejected" | "transport_error";
};

export async function sendPushToSubscription(
  sub: Subscription,
  payload: PushPayload,
): Promise<SendResult> {
  const pushSubscription: PushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  try {
    const vapidDetails = await getPushVapidDetails();

    const result = await sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24 * 28,
      urgency: "high",
      vapidDetails,
    });

    return { endpoint: sub.endpoint, ok: true, status: result.statusCode };
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : 0;
    const removed = status === 404 || status === 410;
    const errorCode = removed
      ? "subscription_gone"
      : err instanceof WebPushError
        ? "push_rejected"
        : "transport_error";

    return {
      endpoint: sub.endpoint,
      ok: false,
      status,
      removed,
      errorCode,
    };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const results = await Promise.all(
    data.map((row) =>
      sendPushToSubscription(
        { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
        payload,
      ),
    ),
  );

  const toRemove = results.filter((r) => r.removed).map((r) => r.endpoint);
  if (toRemove.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", toRemove);
  }
  return results;
}
