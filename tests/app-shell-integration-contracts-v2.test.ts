import { describe, expect, it, vi } from "vitest";
import {
  createV2ShellUser,
  performV2Logout,
  resolveV2RuntimeAccess,
} from "../src/v2/integration/contracts";
import {
  V2_RUNTIME_PRIMARY_NAVIGATION,
  V2_RUNTIME_SECONDARY_NAVIGATION,
  V2_RUNTIME_SLUGS,
  getV2RuntimeDocumentTitle,
  getV2RuntimeRoute,
  isV2RuntimePath,
} from "../src/v2/integration/route-registry";

describe("V2 runtime integration contracts", () => {
  it("keeps the feature flag closed and distinguishes session states", () => {
    expect(resolveV2RuntimeAccess({ enabled: false, status: "authenticated", hasUser: true })).toBe(
      "legacy-fallback",
    );
    expect(resolveV2RuntimeAccess({ enabled: true, status: "initializing", hasUser: false })).toBe(
      "session-loading",
    );
    expect(
      resolveV2RuntimeAccess({ enabled: true, status: "recoverable-error", hasUser: false }),
    ).toBe("session-error");
    expect(
      resolveV2RuntimeAccess({ enabled: true, status: "unauthenticated", hasUser: false }),
    ).toBe("wait-for-route-boundary");
    expect(resolveV2RuntimeAccess({ enabled: true, status: "authenticated", hasUser: true })).toBe(
      "mount-shell",
    );
  });

  it("provides only safe visual identity data and predictable fallbacks", () => {
    const user = createV2ShellUser({
      user_metadata: {
        full_name: "Ana Ribeiro",
        avatar_url: "https://images.example/ana.png",
        email: "private@example.com",
        access_token: "must-not-leak",
      },
    });
    expect(user).toEqual({
      displayName: "Ana Ribeiro",
      supportingText: "Participante da comunidade",
      initials: "AR",
      avatarUrl: "https://images.example/ana.png",
      status: "online",
    });
    expect(JSON.stringify(user)).not.toMatch(/private@example|must-not-leak/);

    expect(createV2ShellUser(null)).toMatchObject({
      displayName: "Pessoa da comunidade",
      initials: "PD",
      avatarUrl: undefined,
    });
    expect(
      createV2ShellUser({
        user_metadata: { name: "Lia", picture: "javascript:alert(1)" },
      }).avatarUrl,
    ).toBeUndefined();
  });

  it("sanitizes logout failures without logging internal errors", async () => {
    const successful = vi.fn(async () => {});
    expect(await performV2Logout(successful)).toEqual({ ok: true });
    expect(successful).toHaveBeenCalledOnce();

    const failed = vi.fn(async () => {
      throw new Error("sensitive provider response");
    });
    const result = await performV2Logout(failed);
    expect(result).toEqual({
      ok: false,
      message: "Não foi possível sair agora. Tente novamente em instantes.",
    });
    expect(JSON.stringify(result)).not.toContain("sensitive provider response");
  });

  it("maps every runtime destination to a unique real /v2 URL", () => {
    const navigation = [...V2_RUNTIME_PRIMARY_NAVIGATION, ...V2_RUNTIME_SECONDARY_NAVIGATION];
    expect(navigation).toHaveLength(V2_RUNTIME_SLUGS.length);
    expect(new Set(navigation.map((item) => item.href)).size).toBe(navigation.length);
    expect(navigation.map((item) => item.href)).toEqual(
      V2_RUNTIME_SLUGS.map((slug) => `/v2/${slug}`),
    );
    for (const slug of V2_RUNTIME_SLUGS) {
      expect(getV2RuntimeRoute(slug)?.slug).toBe(slug);
    }
  });

  it("handles child deep links and localized unknown routes without catching legacy paths", () => {
    expect(isV2RuntimePath("/v2")).toBe(true);
    expect(isV2RuntimePath("/v2/comunidade")).toBe(true);
    expect(isV2RuntimePath("/v20")).toBe(false);
    expect(isV2RuntimePath("/inicio")).toBe(false);
    expect(getV2RuntimeRoute("inexistente")).toBeNull();
    expect(getV2RuntimeDocumentTitle("inexistente")).toContain("Área não encontrada");
  });
});
