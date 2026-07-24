import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ACTIVATE_WAITING_SERVICE_WORKER_MESSAGE,
  getAppServiceWorkerServerSnapshot,
  isUnsafeServiceWorkerContext,
} from "../src/lib/registerSW";
import { V2ServiceWorkerUpdateNotice } from "../src/v2/platform/resilience";

const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

describe("V2-022 controlled service worker updates", () => {
  it("keeps registration and the update notice SSR-safe", () => {
    expect(getAppServiceWorkerServerSnapshot()).toEqual({
      phase: "unsupported",
      updateAvailable: false,
    });
    expect(renderToStaticMarkup(<V2ServiceWorkerUpdateNotice />)).toBe("");
  });

  it("rejects preview, iframe, unsupported and opt-out contexts", () => {
    const safe = {
      hasWindow: true,
      hasServiceWorker: true,
      inIframe: false,
      hostname: "vaidarnamoro.com",
      disabledByQuery: false,
    };
    expect(isUnsafeServiceWorkerContext(safe)).toBe(false);
    expect(isUnsafeServiceWorkerContext({ ...safe, inIframe: true })).toBe(true);
    expect(isUnsafeServiceWorkerContext({ ...safe, hostname: "preview--app.example" })).toBe(true);
    expect(isUnsafeServiceWorkerContext({ ...safe, disabledByQuery: true })).toBe(true);
  });

  it("does not activate a waiting update during install", () => {
    const installBlock = serviceWorker.slice(
      serviceWorker.indexOf('self.addEventListener("install"'),
      serviceWorker.indexOf('self.addEventListener("activate"'),
    );
    expect(installBlock).not.toContain("skipWaiting");
  });

  it("activates only through the explicit application message", () => {
    expect(ACTIVATE_WAITING_SERVICE_WORKER_MESSAGE).toBe("VDN_ACTIVATE_WAITING_SERVICE_WORKER");
    expect(serviceWorker).toContain("event.data.type === ACTIVATE_WAITING_MESSAGE");
    expect(serviceWorker).toContain("event.waitUntil(self.skipWaiting())");
  });
});
