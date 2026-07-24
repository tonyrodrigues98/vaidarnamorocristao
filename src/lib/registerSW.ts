// Service Worker registration and controlled update coordination.
// The module is import-safe during SSR and never logs registration details.

export const ACTIVATE_WAITING_SERVICE_WORKER_MESSAGE = "VDN_ACTIVATE_WAITING_SERVICE_WORKER";
export const SERVICE_WORKER_ACTIVATED_MESSAGE = "VDN_SERVICE_WORKER_ACTIVATED";

export type AppServiceWorkerPhase =
  | "unsupported"
  | "idle"
  | "checking"
  | "ready"
  | "activating"
  | "error";

export interface AppServiceWorkerSnapshot {
  readonly phase: AppServiceWorkerPhase;
  readonly updateAvailable: boolean;
  readonly errorCode?: "registration_failed" | "activation_failed";
}

const listeners = new Set<() => void>();
const attachedRegistrations = new WeakSet<ServiceWorkerRegistration>();
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let lifecycleListenersAttached = false;
let reloadAfterActivation = false;
let snapshot: AppServiceWorkerSnapshot = Object.freeze({
  phase: "idle",
  updateAvailable: false,
});

function publish(next: AppServiceWorkerSnapshot): void {
  snapshot = Object.freeze(next);
  for (const listener of listeners) listener();
}

export function getAppServiceWorkerSnapshot(): AppServiceWorkerSnapshot {
  return snapshot;
}

export function getAppServiceWorkerServerSnapshot(): AppServiceWorkerSnapshot {
  return { phase: "unsupported", updateAvailable: false };
}

export function subscribeToAppServiceWorker(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isUnsafeServiceWorkerContext(input?: {
  readonly hasWindow: boolean;
  readonly hasServiceWorker: boolean;
  readonly inIframe: boolean;
  readonly hostname: string;
  readonly disabledByQuery: boolean;
}): boolean {
  if (input) {
    return (
      !input.hasWindow ||
      !input.hasServiceWorker ||
      input.inIframe ||
      input.disabledByQuery ||
      input.hostname.startsWith("id-preview--") ||
      input.hostname.startsWith("preview--") ||
      input.hostname.endsWith(".lovableproject.com") ||
      input.hostname === "lovableproject.com" ||
      input.hostname.endsWith(".lovableproject-dev.com")
    );
  }
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return true;
  let inIframe = true;
  try {
    inIframe = window.top !== window.self;
  } catch {
    return true;
  }
  return isUnsafeServiceWorkerContext({
    hasWindow: true,
    hasServiceWorker: true,
    inIframe,
    hostname: window.location.hostname,
    disabledByQuery: new URL(window.location.href).searchParams.get("sw") === "off",
  });
}

function inspectRegistration(registration: ServiceWorkerRegistration): void {
  if (registration.waiting && navigator.serviceWorker.controller) {
    publish({ phase: "ready", updateAvailable: true });
  }
}

function attachRegistration(registration: ServiceWorkerRegistration): void {
  if (attachedRegistrations.has(registration)) {
    inspectRegistration(registration);
    return;
  }
  attachedRegistrations.add(registration);
  inspectRegistration(registration);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    publish({ phase: "checking", updateAvailable: false });
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        publish({ phase: "ready", updateAvailable: true });
      }
    });
  });
}

function attachLifecycleListeners(): void {
  if (lifecycleListenersAttached || typeof navigator === "undefined") return;
  lifecycleListenersAttached = true;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    publish({ phase: "idle", updateAvailable: false });
    if (reloadAfterActivation && typeof window !== "undefined") {
      reloadAfterActivation = false;
      window.location.reload();
    }
  });
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent<unknown>) => {
    const data = event.data as { type?: unknown } | null;
    if (data?.type === SERVICE_WORKER_ACTIVATED_MESSAGE) {
      publish({ phase: "idle", updateAvailable: false });
    }
  });
}

export async function registerAppServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (isUnsafeServiceWorkerContext()) {
    publish({ phase: "unsupported", updateAvailable: false });
    return null;
  }
  if (registrationPromise) return registrationPromise;
  publish({ phase: "checking", updateAvailable: false });
  attachLifecycleListeners();
  const pendingRegistration = (async () => {
    try {
      const existing = await navigator.serviceWorker.getRegistration("/sw.js");
      const registration =
        existing ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      attachRegistration(registration);
      if (!registration.waiting) publish({ phase: "idle", updateAvailable: false });
      void registration.update().catch(() => {
        // The active worker remains valid when an update check fails.
      });
      return registration;
    } catch {
      publish({
        phase: "error",
        updateAvailable: false,
        errorCode: "registration_failed",
      });
      return null;
    }
  })();
  registrationPromise = pendingRegistration;
  const registration = await pendingRegistration;
  if (!registration) registrationPromise = null;
  return registration;
}

export async function activateAppServiceWorkerUpdate(): Promise<boolean> {
  const registration = await registerAppServiceWorker();
  if (!registration?.waiting) return false;
  try {
    reloadAfterActivation = true;
    publish({ phase: "activating", updateAvailable: true });
    registration.waiting.postMessage({ type: ACTIVATE_WAITING_SERVICE_WORKER_MESSAGE });
    return true;
  } catch {
    reloadAfterActivation = false;
    publish({
      phase: "error",
      updateAvailable: true,
      errorCode: "activation_failed",
    });
    return false;
  }
}

export function dismissAppServiceWorkerUpdate(): void {
  if (snapshot.phase === "ready") publish({ phase: "idle", updateAvailable: false });
}
