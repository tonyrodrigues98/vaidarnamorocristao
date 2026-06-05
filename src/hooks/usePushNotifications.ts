import { useCallback, useEffect, useMemo, useState } from "react";

type PushStatus =
  | "checking"
  | "unsupported"
  | "needs-permission"
  | "denied"
  | "enabled"
  | "setup-needed";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined;
const PUSH_SUBSCRIPTION_ENDPOINT = import.meta.env.VITE_PUSH_SUBSCRIPTION_ENDPOINT as
  | string
  | undefined;

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

async function getExistingSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function saveSubscription(subscription: PushSubscription) {
  if (!PUSH_SUBSCRIPTION_ENDPOINT) return false;

  const response = await fetch(PUSH_SUBSCRIPTION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(subscription.toJSON()),
  });

  return response.ok;
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
      .then((subscription) => {
        if (subscription) {
          setStatus("enabled");
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

      if (!VAPID_PUBLIC_KEY || !PUSH_SUBSCRIPTION_ENDPOINT) {
        setStatus("setup-needed");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const saved = await saveSubscription(subscription);
      setStatus(saved ? "enabled" : "setup-needed");
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
    }),
    [busy, enable, permission, status],
  );
}
