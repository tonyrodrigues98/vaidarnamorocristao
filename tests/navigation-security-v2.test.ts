import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import {
  INTERNAL_NAVIGATION_PREFIXES,
  resolveInternalDestination,
} from "../src/v2/platform/navigation/internal-destination";
import {
  CLEAR_PRIVATE_CACHES_MESSAGE,
  isPrivateBrowserCacheName,
} from "../src/v2/app/auth/private-cache";

const projectRoot = process.cwd();
const workerPolicySource = readFileSync(
  join(projectRoot, "public", "vdn-navigation-policy.js"),
  "utf8",
);
const serviceWorkerSource = readFileSync(join(projectRoot, "public", "sw.js"), "utf8");

type WorkerPolicy = {
  allowedPrefixes: readonly string[];
  resolve(value: unknown, origin: string, fallback: string): string;
};

function loadWorkerPolicy(): WorkerPolicy {
  const workerScope: { VDN_NAVIGATION_POLICY?: WorkerPolicy } = {};
  const context = vm.createContext({ self: workerScope, URL });
  new vm.Script(workerPolicySource).runInContext(context);
  if (!workerScope.VDN_NAVIGATION_POLICY) {
    throw new Error("Worker navigation policy was not installed.");
  }
  return workerScope.VDN_NAVIGATION_POLICY;
}

const fixtures = [
  "/v2/configuracoes?origem=push#conta",
  "https://vaidarnamoro.com/conta",
  "https://evil.example/conta",
  "//evil.example/conta",
  "javascript:alert(1)",
  "data:text/html,hello",
  "/api/public/hooks/push-dispatch",
  "/rota-inexistente",
  "/perfil\\@evil.example",
] as const;

describe("V2 internal navigation and private cache security", () => {
  it("accepts relative and absolute same-origin allowlisted destinations", () => {
    expect(resolveInternalDestination(fixtures[0])).toEqual({
      ok: true,
      destination: fixtures[0],
    });
    expect(resolveInternalDestination(fixtures[1])).toMatchObject({
      ok: true,
      destination: "/conta",
    });
  });

  it("rejects external origins, protocols, endpoints, malformed and unknown paths", () => {
    for (const fixture of fixtures.slice(2)) {
      expect(resolveInternalDestination(fixture, { fallback: "/notificacoes" }).destination).toBe(
        "/notificacoes",
      );
    }
  });

  it("keeps the client and service-worker policies equivalent", () => {
    const workerPolicy = loadWorkerPolicy();
    expect([...workerPolicy.allowedPrefixes]).toEqual([...INTERNAL_NAVIGATION_PREFIXES]);
    for (const fixture of fixtures) {
      const client = resolveInternalDestination(fixture, {
        origin: "https://vaidarnamoro.com",
        fallback: "/notificacoes",
      }).destination;
      expect(
        workerPolicy.resolve(fixture, "https://vaidarnamoro.com", "/notificacoes"),
        fixture,
      ).toBe(client);
    }
  });

  it("uses the canonical policy before notification window navigation", () => {
    expect(serviceWorkerSource).toContain('importScripts("/vdn-navigation-policy.js")');
    expect(serviceWorkerSource).toContain("self.VDN_NAVIGATION_POLICY.resolve");
    expect(serviceWorkerSource).toContain("clients.openWindow(url)");
    expect(serviceWorkerSource).not.toContain("new URL(targetUrl, self.location.origin)");
  });

  it("never stores signed or authenticated pet media in a shared cache", () => {
    expect(serviceWorkerSource).toContain("object\\/public\\/pets\\/");
    expect(serviceWorkerSource).not.toContain("(sign|public|authenticated)");
    expect(serviceWorkerSource).not.toContain("url.origin}${url.pathname");
    expect(serviceWorkerSource).toContain("PET_PUBLIC_IMG_CACHE");
  });

  it("clears legacy private cache names without touching the public pet cache", () => {
    expect(isPrivateBrowserCacheName("vaidarnamoro-pwa-v3-pet-images")).toBe(true);
    expect(isPrivateBrowserCacheName("vdn-private-user-a")).toBe(true);
    expect(isPrivateBrowserCacheName("vaidarnamoro-pwa-v4-pet-public")).toBe(false);
    expect(serviceWorkerSource).toContain(CLEAR_PRIVATE_CACHES_MESSAGE);
  });
});
