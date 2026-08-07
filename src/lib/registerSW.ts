// Registers the app Service Worker required for Web Push.
// Safe in production and on any HTTPS/localhost context. Skips Lovable
// preview iframes and dev to avoid stale caches in the editor.

function isUnsafeContext() {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  try {
    if (window.top !== window.self) return true; // iframe (Lovable preview)
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host.endsWith(".lovableproject.com") || host === "lovableproject.com") return true;
  if (host.endsWith(".lovableproject-dev.com")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

export async function registerAppServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (isUnsafeContext()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.warn("[sw] register failed", err);
    return null;
  }
}
