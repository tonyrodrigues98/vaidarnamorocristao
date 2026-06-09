import { sendNotification, WebPushError, type PushSubscription } from "web-push-neo";
import { VAPID_PUBLIC_KEY } from "@/lib/pushVapid";

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
  error?: string;
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
    const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
    const subject = process.env.WEB_PUSH_SUBJECT || "mailto:contato@vaidarnamoro.com";
    if (!privateKey) throw new Error("WEB_PUSH_PRIVATE_KEY missing");

    const result = await sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24 * 28,
      urgency: "high",
      vapidDetails: {
        subject,
        publicKey: VAPID_PUBLIC_KEY,
        privateKey,
      },
    });

    return { endpoint: sub.endpoint, ok: true, status: result.statusCode };
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : 0;
    const removed = status === 404 || status === 410;
    const error =
      err instanceof WebPushError
        ? `${err.message}${err.body ? `: ${err.body}` : ""}`
        : err instanceof Error
          ? err.message
          : String(err);

    return {
      endpoint: sub.endpoint,
      ok: false,
      status,
      removed,
      error: error.slice(0, 300),
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