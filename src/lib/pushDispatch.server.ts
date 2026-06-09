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
  try {
    const jwt = await signVapidJwt(sub.endpoint);
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const uaPublicKey = b64UrlToBytes(sub.p256dh);
    const authSecret = b64UrlToBytes(sub.auth);
    const { body } = await encryptPayload(payloadBytes, uaPublicKey, authSecret);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "2419200",
        Urgency: "normal",
      },
      body: body as unknown as BodyInit,
    });

    const removed = res.status === 404 || res.status === 410;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        endpoint: sub.endpoint,
        ok: false,
        status: res.status,
        removed,
        error: text.slice(0, 300),
      };
    }
    return { endpoint: sub.endpoint, ok: true, status: res.status };
  } catch (err) {
    return {
      endpoint: sub.endpoint,
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
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