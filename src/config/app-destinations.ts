export type AppShellKind =
  | "public"
  | "app"
  | "admin"
  | "focused"
  | "immersive"
  | "api"
  | "compatibility";

export type AccessRequirement =
  | "public"
  | "authenticated"
  | "approved"
  | "staff"
  | "admin"
  | "support";

export type CurrentPrimaryTab = "inicio" | "devocional" | "conversas" | "pretendentes" | "perfil";

export type FuturePrimaryTab = "home" | "community" | "explore" | "messages" | "profile";

export type AppDestination = {
  id: string;
  pattern: string;
  match: "exact" | "prefix";
  priority?: number;
  shell: AppShellKind;
  access: AccessRequirement;
  currentTab?: CurrentPrimaryTab;
  futureTab?: FuturePrimaryTab;
  mobileAppShell: boolean;
  mobileBottomNav: boolean;
  mobileHeader: "global" | "contextual" | "hidden";
  footer: boolean;
  visualViewport: boolean;
  routeTransition: boolean;
  status: "active" | "redirect" | "api" | "legacy-v2";
};

export type DestinationBehavior = Omit<AppDestination, "id" | "pattern" | "match" | "priority"> & {
  destinationId: string;
};

const publicDefaults = {
  shell: "public",
  access: "public",
  mobileAppShell: false,
  mobileBottomNav: false,
  mobileHeader: "global",
  footer: true,
  visualViewport: false,
  routeTransition: true,
  status: "active",
} as const;

const appDefaults = {
  shell: "app",
  access: "authenticated",
  mobileAppShell: false,
  mobileBottomNav: false,
  mobileHeader: "global",
  footer: true,
  visualViewport: false,
  routeTransition: true,
  status: "active",
} as const;

const mobileAppDefaults = {
  ...appDefaults,
  mobileAppShell: true,
  mobileBottomNav: true,
  mobileHeader: "contextual",
} as const;

function exact(
  id: string,
  pattern: string,
  behavior: Omit<AppDestination, "id" | "pattern" | "match">,
): AppDestination {
  return { id, pattern, match: "exact", ...behavior };
}

function prefix(
  id: string,
  pattern: string,
  behavior: Omit<AppDestination, "id" | "pattern" | "match">,
): AppDestination {
  return { id, pattern, match: "prefix", ...behavior };
}

export const appDestinations: readonly AppDestination[] = [
  exact("public-home", "/", { ...publicDefaults, footer: false }),
  exact("public-how-it-works", "/como-funciona", publicDefaults),
  exact("public-testimonials", "/depoimentos", publicDefaults),
  exact("public-about", "/sobre", publicDefaults),
  exact("public-terms", "/termos", publicDefaults),
  exact("public-manual", "/manual", publicDefaults),
  exact("public-install", "/instalar", publicDefaults),
  exact("public-blog", "/blog", publicDefaults),
  prefix("public-blog-post", "/blog", publicDefaults),
  exact("public-news", "/noticias", publicDefaults),

  prefix("auth", "/auth", { ...publicDefaults, footer: false }),
  prefix("onboarding", "/onboarding", {
    ...appDefaults,
    footer: false,
  }),

  exact("app-home", "/inicio", {
    ...mobileAppDefaults,
    currentTab: "inicio",
    futureTab: "home",
  }),
  exact("app-explore", "/explorar", {
    ...appDefaults,
    access: "approved",
    futureTab: "explore",
    footer: false,
  }),
  exact("app-devotional", "/devocional", {
    ...mobileAppDefaults,
    currentTab: "devocional",
  }),
  exact("app-conversations", "/conversas", {
    ...mobileAppDefaults,
    currentTab: "conversas",
    futureTab: "messages",
    footer: false,
  }),
  exact("app-community-chat", "/conversas/comunidade", {
    ...mobileAppDefaults,
    shell: "focused",
    currentTab: "conversas",
    futureTab: "messages",
    footer: false,
    visualViewport: true,
    routeTransition: false,
    priority: 100,
  }),
  prefix("app-private-chat", "/conversas", {
    ...mobileAppDefaults,
    shell: "focused",
    currentTab: "conversas",
    futureTab: "messages",
    mobileBottomNav: false,
    footer: false,
    visualViewport: true,
    routeTransition: false,
  }),
  prefix("app-dating", "/pretendentes", {
    ...mobileAppDefaults,
    currentTab: "pretendentes",
  }),
  exact("app-profile", "/perfil", {
    ...mobileAppDefaults,
    currentTab: "perfil",
    futureTab: "profile",
    footer: false,
  }),
  exact("app-store", "/loja", {
    ...mobileAppDefaults,
    futureTab: "explore",
    footer: false,
  }),
  exact("app-notifications", "/notificacoes", {
    ...mobileAppDefaults,
    futureTab: "home",
    footer: false,
  }),
  exact("app-dashboard", "/dashboard", mobileAppDefaults),
  exact("app-interests", "/interesses", mobileAppDefaults),
  exact("app-matches", "/matches", mobileAppDefaults),
  prefix("app-gifts", "/presentes", { ...mobileAppDefaults, footer: false }),
  exact("app-anonymous-notes", "/recados", mobileAppDefaults),
  exact("app-prayers", "/oracoes", { ...mobileAppDefaults, footer: false }),
  exact("app-account", "/conta", {
    ...mobileAppDefaults,
    futureTab: "profile",
    footer: false,
  }),
  exact("app-blocked-users", "/bloqueados", { ...mobileAppDefaults, footer: false }),
  exact("app-verification", "/verificacao", { ...mobileAppDefaults, footer: false }),
  prefix("app-purpose", "/proposito", mobileAppDefaults),

  prefix("app-avatar", "/avatar", appDefaults),
  exact("app-boxes", "/caixas", appDefaults),
  exact("app-achievements", "/conquistas", appDefaults),
  exact("app-pet", "/meu-pet", {
    ...appDefaults,
    futureTab: "explore",
    footer: false,
  }),
  exact("app-pet-arcade", "/pet-arcade", {
    ...appDefaults,
    futureTab: "explore",
  }),
  exact("app-bible-quiz", "/quiz-biblico", appDefaults),

  prefix("support", "/suporte", {
    ...appDefaults,
    footer: false,
  }),
  prefix("admin", "/admin", {
    ...appDefaults,
    shell: "admin",
    access: "admin",
    footer: false,
  }),
  prefix("api", "/api", {
    ...publicDefaults,
    shell: "api",
    mobileHeader: "hidden",
    footer: false,
    routeTransition: false,
    status: "api",
  }),
  prefix("legacy-v2", "/v2", {
    ...appDefaults,
    shell: "compatibility",
    footer: false,
    routeTransition: false,
    status: "legacy-v2",
  }),
  exact("compatibility-community", "/comunidade", {
    ...appDefaults,
    shell: "compatibility",
    futureTab: "community",
    status: "redirect",
  }),
] as const;

export const plannedPrimaryDestinations = [
  { id: "home", path: "/inicio" },
  { id: "community", path: "/comunidade" },
  { id: "explore", path: "/explorar" },
  { id: "messages", path: "/conversas" },
  { id: "profile", path: "/perfil" },
] as const satisfies readonly { id: FuturePrimaryTab; path: string }[];

export const unknownDestination: AppDestination = {
  id: "public-unknown",
  pattern: "*",
  match: "exact",
  ...publicDefaults,
  footer: false,
};

export function normalizeDestinationPath(pathname: string): string {
  const rawPath = pathname.split(/[?#]/, 1)[0]?.trim() || "/";
  const withLeadingSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  if (withLeadingSlash === "/") return "/";
  return withLeadingSlash.replace(/\/+$/, "");
}

function destinationMatches(destination: AppDestination, pathname: string) {
  if (destination.match === "exact") return pathname === destination.pattern;
  return pathname === destination.pattern || pathname.startsWith(`${destination.pattern}/`);
}

function destinationScore(destination: AppDestination) {
  return (
    (destination.priority ?? 0) * 1_000_000 +
    (destination.match === "exact" ? 100_000 : 0) +
    destination.pattern.length
  );
}

export function matchDestination(pathname: string): AppDestination {
  const normalizedPath = normalizeDestinationPath(pathname);
  const matches = appDestinations.filter((destination) =>
    destinationMatches(destination, normalizedPath),
  );
  if (matches.length === 0) return unknownDestination;
  return matches.reduce((best, candidate) =>
    destinationScore(candidate) > destinationScore(best) ? candidate : best,
  );
}

export function getDestinationBehavior(pathname: string): DestinationBehavior {
  const {
    id,
    pattern: _pattern,
    match: _match,
    priority: _priority,
    ...behavior
  } = matchDestination(pathname);
  return { destinationId: id, ...behavior };
}

export function getFuturePrimaryTab(pathname: string): FuturePrimaryTab | undefined {
  return getDestinationBehavior(pathname).futureTab;
}

export type RegistryValidationIssue = {
  code: "duplicate-id" | "duplicate-pattern" | "conflicting-priority" | "unreachable" | "invalid";
  destinationId: string;
  message: string;
};

export function validateDestinationRegistry(
  destinations: readonly AppDestination[] = appDestinations,
): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const ids = new Set<string>();
  const signatures = new Set<string>();

  for (const destination of destinations) {
    if (ids.has(destination.id)) {
      issues.push({
        code: "duplicate-id",
        destinationId: destination.id,
        message: `Duplicate destination id: ${destination.id}`,
      });
    }
    ids.add(destination.id);

    const signature = `${destination.match}:${destination.pattern}`;
    if (signatures.has(signature)) {
      issues.push({
        code: "duplicate-pattern",
        destinationId: destination.id,
        message: `Duplicate destination pattern: ${signature}`,
      });
      issues.push({
        code: "unreachable",
        destinationId: destination.id,
        message: `Duplicate rule is unreachable: ${signature}`,
      });
    }
    signatures.add(signature);

    if (destination.mobileBottomNav && !destination.mobileAppShell) {
      issues.push({
        code: "invalid",
        destinationId: destination.id,
        message: "Bottom navigation requires the mobile app shell.",
      });
    }
    if (destination.visualViewport && destination.routeTransition) {
      issues.push({
        code: "invalid",
        destinationId: destination.id,
        message: "Visual viewport destinations cannot use route transitions.",
      });
    }
    if (destination.status === "api" && destination.shell !== "api") {
      issues.push({
        code: "invalid",
        destinationId: destination.id,
        message: "API status requires the API shell.",
      });
    }
  }

  for (let index = 0; index < destinations.length; index += 1) {
    const left = destinations[index];
    if (!left) continue;
    for (let otherIndex = index + 1; otherIndex < destinations.length; otherIndex += 1) {
      const right = destinations[otherIndex];
      if (!right) continue;
      if (
        left.priority !== undefined &&
        left.priority === right.priority &&
        ((left.match === "prefix" &&
          (right.pattern === left.pattern || right.pattern.startsWith(`${left.pattern}/`))) ||
          (right.match === "prefix" &&
            (left.pattern === right.pattern || left.pattern.startsWith(`${right.pattern}/`))))
      ) {
        issues.push({
          code: "conflicting-priority",
          destinationId: right.id,
          message: `Ambiguous priority between ${left.id} and ${right.id}.`,
        });
      }

      const broader =
        left.match === "prefix" &&
        (right.pattern === left.pattern || right.pattern.startsWith(`${left.pattern}/`))
          ? left
          : right.match === "prefix" &&
              (left.pattern === right.pattern || left.pattern.startsWith(`${right.pattern}/`))
            ? right
            : undefined;
      const narrower = broader === left ? right : broader === right ? left : undefined;
      if (
        broader &&
        narrower?.match === "prefix" &&
        destinationScore(broader) > destinationScore(narrower)
      ) {
        issues.push({
          code: "unreachable",
          destinationId: narrower.id,
          message: `${narrower.id} is shadowed by ${broader.id}.`,
        });
      }
    }
  }

  return issues;
}
