import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  V2_PRIVATE_STORAGE_PREFIX,
  assessPublicCacheRequest,
  createPrivateCacheDescriptor,
  createPublicCacheDescriptor,
  shouldClearPrivateCacheName,
  shouldClearPrivateStorageKey,
} from "../src/v2/platform/resilience";

const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const manifest = JSON.parse(
  readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
) as Record<string, unknown>;

describe("V2-022 cache and PWA policy", () => {
  it("partitions private cache descriptors by opaque subject and version", () => {
    const first = createPrivateCacheDescriptor("messages", "a".repeat(32), 60_000);
    const second = createPrivateCacheDescriptor("messages", "b".repeat(32), 60_000);
    expect(first.name).not.toBe(second.name);
    expect(first.audience).toBe("private");
    expect(() => createPrivateCacheDescriptor("messages", "user@example.com", 60_000)).toThrow(
      "invalid_private_cache_scope",
    );
  });

  it("keeps public and private namespaces separate", () => {
    const descriptor = createPublicCacheDescriptor("community-content", 300_000);
    expect(descriptor.name).toContain("-public-");
    expect(descriptor.name).not.toContain("-private-");
    expect(shouldClearPrivateCacheName(descriptor.name)).toBe(false);
    expect(shouldClearPrivateCacheName("vdn-v2-v1-private-aaaa-profile")).toBe(true);
    expect(shouldClearPrivateCacheName("vaidarnamoro-pwa-v3-pet-images")).toBe(true);
  });

  it("clears only namespaced private browser storage", () => {
    expect(shouldClearPrivateStorageKey(`${V2_PRIVATE_STORAGE_PREFIX}drafts`)).toBe(true);
    expect(shouldClearPrivateStorageKey("vdn-v2-public:content")).toBe(false);
  });

  it("does not admit signed, cross-origin or sensitive requests into public cache", () => {
    const base = {
      method: "GET",
      appOrigin: "https://vaidarnamoro.com",
      sensitive: false,
      explicitlyPublicStorage: false,
    };
    expect(
      assessPublicCacheRequest({
        ...base,
        requestUrl: "https://vaidarnamoro.com/assets/app.js",
      }),
    ).toEqual({ cacheable: true, reason: "public-same-origin" });
    expect(
      assessPublicCacheRequest({
        ...base,
        requestUrl: "https://storage.example/object?token=secret",
      }).reason,
    ).toBe("signed-url");
    expect(
      assessPublicCacheRequest({
        ...base,
        requestUrl: "https://example.org/image.png",
      }).reason,
    ).toBe("cross-origin");
    expect(
      assessPublicCacheRequest({
        ...base,
        requestUrl: "https://vaidarnamoro.com/perfil",
        sensitive: true,
      }).reason,
    ).toBe("sensitive-path");
  });

  it("keeps the service worker cache public-only and versioned", () => {
    expect(serviceWorker).toContain('CACHE_VERSION = "vaidarnamoro-pwa-v5"');
    expect(serviceWorker).toContain("publicPetImageStaleWhileRevalidate");
    expect(serviceWorker).toContain("/storage\\/v1\\/object\\/public\\/pets\\/");
    expect(serviceWorker).not.toMatch(/signedUrl|signed-url|searchParams\.delete/i);
    expect(serviceWorker).toContain("VDN_CLEAR_PRIVATE_CACHES");
  });

  it("keeps the manifest community-first and installable", () => {
    expect(manifest).toMatchObject({
      id: "/",
      start_url: "/inicio",
      scope: "/",
      display: "standalone",
      background_color: "#f7f7f5",
      theme_color: "#5b21b6",
      prefer_related_applications: false,
    });
    expect(String(manifest.description)).toMatch(/Comunidade crista/i);
    expect(manifest.icons).toEqual(
      expect.arrayContaining([expect.objectContaining({ sizes: "192x192" })]),
    );
  });
});
