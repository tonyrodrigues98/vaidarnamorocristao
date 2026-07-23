import { describe, expect, it } from "vitest";
import {
  buildLoginDestination,
  classifyRoute,
  readReturnTo,
  resolveRouteBoundaryDecision,
  resolveRouteRedirectDecision,
  sanitizeReturnTo,
  shouldMountPrivateProviders,
} from "../src/v2/app/routing/route-access";

describe("V2 route protection", () => {
  it("classifies public, visitor, private, onboarding, admin and endpoint routes", () => {
    expect(classifyRoute("/sobre")).toBe("public");
    expect(classifyRoute("/blog/artigo")).toBe("public");
    expect(classifyRoute("/auth/login")).toBe("visitor-only");
    expect(classifyRoute("/auth/reset-password")).toBe("public");
    expect(classifyRoute("/conversas/123")).toBe("authenticated");
    expect(classifyRoute("/onboarding/etapa-2")).toBe("authenticated-onboarding");
    expect(classifyRoute("/admin/fotos")).toBe("administrative");
    expect(classifyRoute("/api/public/hooks/push-dispatch")).toBe("server-endpoint");
  });

  it("keeps public routes mounted without an auth guard", () => {
    expect(resolveRouteBoundaryDecision({ kind: "public", status: "initializing" })).toEqual({
      action: "mount",
    });
    expect(resolveRouteBoundaryDecision({ kind: "public", status: "unauthenticated" })).toEqual({
      action: "mount",
    });
  });

  it("never mounts or redirects a private route while session resolution is pending", () => {
    expect(resolveRouteBoundaryDecision({ kind: "authenticated", status: "initializing" })).toEqual(
      { action: "wait" },
    );
    expect(
      resolveRouteBoundaryDecision({ kind: "authenticated", status: "recoverable-error" }),
    ).toEqual({ action: "wait" });
  });

  it("mounts private routes only for an authenticated user", () => {
    expect(
      resolveRouteBoundaryDecision({ kind: "authenticated", status: "authenticated" }),
    ).toEqual({ action: "mount" });
    expect(
      resolveRouteBoundaryDecision({ kind: "authenticated", status: "unauthenticated" }),
    ).toEqual({ action: "redirect-login" });
  });

  it("keeps authenticated private content closed until profile authorization resolves", () => {
    expect(
      resolveRouteBoundaryDecision({
        kind: "authenticated",
        status: "authenticated",
        authorizationReady: false,
      }),
    ).toEqual({ action: "wait" });
    expect(
      resolveRouteBoundaryDecision({
        kind: "authenticated",
        status: "authenticated",
        authorizationReady: true,
      }),
    ).toEqual({ action: "mount" });
  });

  it("does not confuse authenticated access with administrative authorization", () => {
    expect(classifyRoute("/admin")).toBe("administrative");
    expect(
      resolveRouteBoundaryDecision({ kind: "administrative", status: "authenticated" }),
    ).toEqual({ action: "mount" });
  });

  it("mounts private providers only after a resolved authenticated session", () => {
    expect(shouldMountPrivateProviders("initializing", false)).toBe(false);
    expect(shouldMountPrivateProviders("recoverable-error", false)).toBe(false);
    expect(shouldMountPrivateProviders("unauthenticated", false)).toBe(false);
    expect(shouldMountPrivateProviders("authenticated", false)).toBe(false);
    expect(shouldMountPrivateProviders("authenticated", true)).toBe(true);
  });

  it("redirects only once per unauthenticated period and rearms after recovery", () => {
    const first = resolveRouteRedirectDecision({
      target: "/auth/login?returnTo=%2Finicio",
      startedTarget: null,
    });
    const repeated = resolveRouteRedirectDecision({
      target: "/auth/login?returnTo=%2Finicio",
      startedTarget: first.startedTarget,
    });
    const rearmed = resolveRouteRedirectDecision({
      target: null,
      startedTarget: repeated.startedTarget,
    });
    const afterLogout = resolveRouteRedirectDecision({
      target: "/auth/login?returnTo=%2Finicio",
      startedTarget: rearmed.startedTarget,
    });

    expect(first.shouldNavigate).toBe(true);
    expect(repeated.shouldNavigate).toBe(false);
    expect(rearmed.startedTarget).toBe(null);
    expect(afterLogout.shouldNavigate).toBe(true);
  });
});

describe("V2 safe post-login destinations", () => {
  it("preserves an internal deep link including query and hash", () => {
    expect(sanitizeReturnTo("/conversas/123?tab=media#latest")).toBe(
      "/conversas/123?tab=media#latest",
    );
    expect(buildLoginDestination("/conversas/123")).toBe("/auth/login?returnTo=%2Fconversas%2F123");
  });

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "javascript:alert(1)",
    "/\\evil",
    "/auth/login",
    "/auth/reset-password",
    "/api/verify-photo",
    "/%2F%2Fevil.example",
    "/%5Cevil.example",
    "/%E0%A4%A",
    "\u0000/path",
  ])("rejects unsafe destination %j", (value) => {
    expect(sanitizeReturnTo(value)).toBe("/inicio");
  });

  it("rejects malformed and non-string destinations", () => {
    expect(sanitizeReturnTo(undefined)).toBe("/inicio");
    expect(sanitizeReturnTo({ path: "/perfil" })).toBe("/inicio");
    expect(sanitizeReturnTo("/".repeat(2050))).toBe("/inicio");
  });

  it("reads a safely encoded destination and falls back predictably", () => {
    expect(readReturnTo("?returnTo=%2Fperfil%3Ftab%3Dphotos")).toBe("/perfil?tab=photos");
    expect(readReturnTo("?returnTo=https%3A%2F%2Fevil.example")).toBe("/inicio");
    expect(readReturnTo("?returnTo=%2Fauth%2Fsignup")).toBe("/inicio");
    expect(readReturnTo("not valid search")).toBe("/inicio");
  });

  it("redirects an authenticated visitor away from visitor-only routes", () => {
    expect(resolveRouteBoundaryDecision({ kind: "visitor-only", status: "authenticated" })).toEqual(
      { action: "redirect-return" },
    );
    expect(
      resolveRouteBoundaryDecision({ kind: "visitor-only", status: "unauthenticated" }),
    ).toEqual({ action: "mount" });
  });
});
