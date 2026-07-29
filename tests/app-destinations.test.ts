import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  appDestinations,
  getDestinationBehavior,
  matchDestination,
  normalizeDestinationPath,
  plannedPrimaryDestinations,
  unknownDestination,
  validateDestinationRegistry,
  type AppDestination,
} from "../src/config/app-destinations";

const expectedBehavior = {
  "/": ["public", false, "global", false, false, true, "active"],
  "/termos": ["public", false, "global", true, false, true, "active"],
  "/manual": ["public", false, "global", true, false, true, "active"],
  "/inicio": ["app", true, "contextual", true, false, true, "active"],
  "/explorar": ["app", false, "global", false, false, true, "active"],
  "/devocional": ["app", true, "contextual", true, false, true, "active"],
  "/conversas": ["app", true, "contextual", false, false, true, "active"],
  "/conversas/abc": ["focused", false, "contextual", false, true, false, "active"],
  "/conversas/comunidade": ["focused", true, "contextual", false, true, false, "active"],
  "/perfil": ["app", true, "contextual", false, false, true, "active"],
  "/loja": ["app", true, "contextual", false, false, true, "active"],
  "/conta": ["app", true, "contextual", false, false, true, "active"],
  "/suporte": ["app", false, "global", false, false, true, "active"],
  "/suporte/abc": ["app", false, "global", false, false, true, "active"],
  "/admin": ["admin", false, "global", false, false, true, "active"],
  "/admin/pets": ["admin", false, "global", false, false, true, "active"],
  "/auth/login": ["public", false, "global", false, false, true, "active"],
  "/onboarding": ["app", false, "global", false, false, true, "active"],
  "/comunidade": ["compatibility", false, "global", true, false, true, "redirect"],
  "/v2": ["compatibility", false, "global", false, false, false, "legacy-v2"],
  "/api/public/runtime-config": ["api", false, "hidden", false, false, false, "api"],
  "/rota-inexistente": ["public", false, "global", false, false, true, "active"],
} as const;

function behaviorTuple(pathname: string) {
  const behavior = getDestinationBehavior(pathname);
  return [
    behavior.shell,
    behavior.mobileBottomNav,
    behavior.mobileHeader,
    behavior.footer,
    behavior.visualViewport,
    behavior.routeTransition,
    behavior.status,
  ];
}

function representativePath(fullPath: string) {
  return fullPath.replace(/\$([A-Za-z0-9_]+)/g, "sample-$1").replace(/\/+$/, "") || "/";
}

describe("app destination registry", () => {
  it("normalizes query, hash, missing slash and trailing slash", () => {
    expect(normalizeDestinationPath("inicio/?tab=1#top")).toBe("/inicio");
    expect(matchDestination("/perfil/").id).toBe("app-profile");
  });

  it("uses deterministic exact and specific precedence", () => {
    expect(matchDestination("/conversas").id).toBe("app-conversations");
    expect(matchDestination("/conversas/alguem").id).toBe("app-private-chat");
    expect(matchDestination("/conversas/comunidade").id).toBe("app-community-chat");
    expect(matchDestination("/admin/pets").id).toBe("admin");
    expect(matchDestination("/api/public/runtime-config").id).toBe("api");
    expect(matchDestination("/v2/inicio").id).toBe("legacy-v2");
    expect(matchDestination("/comunidade").id).toBe("compatibility-community");
    expect(matchDestination("/sem-registro")).toBe(unknownDestination);
  });

  it.each(Object.entries(expectedBehavior))(
    "preserves critical behavior for %s",
    (path, expected) => {
      expect(behaviorTuple(path)).toEqual(expected);
    },
  );

  it("classifies all 69 generated routes without fallback", () => {
    const routeTree = readFileSync("src/routeTree.gen.ts", "utf8");
    const fullPaths = [...routeTree.matchAll(/fullPath:\s*'([^']+)'/g)].map((match) => match[1]!);
    expect(fullPaths).toHaveLength(69);

    const unclassified = fullPaths
      .map(representativePath)
      .filter((pathname) => matchDestination(pathname) === unknownDestination);
    expect(unclassified).toEqual([]);
  });

  it("keeps planned destinations serializable and inactive", () => {
    expect(plannedPrimaryDestinations).toEqual([
      { id: "home", path: "/inicio" },
      { id: "community", path: "/comunidade" },
      { id: "explore", path: "/explorar" },
      { id: "messages", path: "/conversas" },
      { id: "profile", path: "/perfil" },
    ]);
    expect(matchDestination("/explorar").id).toBe("app-explore");
    expect(getDestinationBehavior("/explorar")).toMatchObject({
      access: "approved",
      futureTab: "explore",
      mobileAppShell: false,
      mobileBottomNav: false,
      footer: false,
      status: "active",
    });
    expect(getDestinationBehavior("/comunidade")).toMatchObject({
      shell: "compatibility",
      futureTab: "community",
      status: "redirect",
    });
  });

  it("validates the canonical registry", () => {
    expect(validateDestinationRegistry()).toEqual([]);
  });

  it("detects duplicate, unreachable, conflicting and incompatible rules", () => {
    const base = appDestinations[0]!;
    const duplicate = { ...base };
    const prioritizedParent: AppDestination = {
      ...base,
      id: "priority-parent",
      pattern: "/priority",
      match: "prefix",
      priority: 5,
    };
    const prioritizedChild: AppDestination = {
      ...base,
      id: "priority-child",
      pattern: "/priority/child",
      match: "prefix",
      priority: 5,
    };
    const invalid: AppDestination = {
      ...base,
      id: "invalid-bottom-nav",
      pattern: "/invalid",
      mobileBottomNav: true,
      mobileAppShell: false,
    };
    const codes = validateDestinationRegistry([
      base,
      duplicate,
      prioritizedParent,
      prioritizedChild,
      invalid,
    ]).map((issue) => issue.code);

    expect(codes).toContain("duplicate-id");
    expect(codes).toContain("duplicate-pattern");
    expect(codes).toContain("unreachable");
    expect(codes).toContain("conflicting-priority");
    expect(codes).toContain("invalid");
  });

  it("stays framework-free and side-effect-free", () => {
    const source = readFileSync("src/config/app-destinations.ts", "utf8");
    expect(source).not.toMatch(/from\s+["']react/);
    expect(source).not.toMatch(/@tanstack\/react-router/);
    expect(source).not.toMatch(/@\/lib\/auth|supabase|feature-flags/);
  });
});
