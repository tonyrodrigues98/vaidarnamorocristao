import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribePush, unsubscribePush } from "@/lib/push.functions";
import { VAPID_PUBLIC_KEY } from "@/lib/pushVapid";
import { registerAppServiceWorker } from "@/lib/registerSW";

type PushStatus =
  | "checking"
  | "unsupported"
  | "needs-permission"
  | "denied"
  | "enabled"
  | "setup-needed";

function hasPushSupport() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function matchesCurrentVapidKey(subscription: PushSubscription) {
  const serverKey = subscription.options?.applicationServerKey;
  if (!serverKey || !VAPID_PUBLIC_KEY) return true;
  const saved = new Uint8Array(serverKey as ArrayBuffer);
  const current = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  return saved.length === current.length && saved.every((value, index) => value === current[index]);
}

async function getExistingSubscription() {
  await registerAppServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription && !matchesCurrentVapidKey(subscription)) {
    await subscription.unsubscribe().catch(() => undefined);
    return null;
  }
  return subscription;
}

async function saveSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return false;
  try {
    await subscribePush({
      data: {
        endpoint,
        p256dh,
        auth,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });
    return true;
  } catch (err) {
    console.error("[push] subscribe failed", err);
    return false;
  }
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasPushSupport()) {
      setStatus("unsupported");
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    getExistingSubscription()
      .then(async (subscription) => {
        if (subscription) {
          const saved = await saveSubscription(subscription);
          setStatus(saved ? "enabled" : "setup-needed");
          return;
        }
        setStatus(Notification.permission === "granted" ? "setup-needed" : "needs-permission");
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  const enable = useCallback(async () => {
    if (!hasPushSupport()) {
      setStatus("unsupported");
      return;
    }

    setBusy(true);

    try {
      const nextPermission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      setPermission(nextPermission);

      if (nextPermission === "denied") {
        setStatus("denied");
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        setStatus("setup-needed");
        return;
      }

      await registerAppServiceWorker();
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing && !matchesCurrentVapidKey(existing)) {
        await existing.unsubscribe().catch(() => undefined);
      }
      const subscription =
        existing && matchesCurrentVapidKey(existing)
          ? existing
          : await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

      const saved = await saveSubscription(subscription);
      setStatus(saved ? "enabled" : "setup-needed");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (!hasPushSupport()) return;
    setBusy(true);
    try {
      await registerAppServiceWorker();
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const endpoint = existing.endpoint;
        await existing.unsubscribe();
        try {
          await unsubscribePush({ data: { endpoint } });
        } catch (err) {
          console.error("[push] server unsubscribe failed", err);
        }
      }
      setStatus(Notification.permission === "granted" ? "setup-needed" : "needs-permission");
    } finally {
      setBusy(false);
    }
  }, []);

  return useMemo(
    () => ({
      status,
      permission,
      busy,
      isSupported: status !== "unsupported",
      isEnabled: status === "enabled",
      needsBackendSetup: status === "setup-needed",
      enable,
      disable,
    }),
    [busy, disable, enable, permission, status],
  );
}
