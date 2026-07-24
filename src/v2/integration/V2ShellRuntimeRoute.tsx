import { useMemo, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { v2FeatureFlags } from "@/v2/platform/feature-flags";
import type { V2ShellNavigationItem } from "@/v2/app-shell";
import { V2AccountRuntimeFeature, type AccountNavigationTarget } from "@/v2/features/account";
import { V2CommunityHubFeature } from "@/v2/features/community";
import { V2ChristianContentFeature } from "@/v2/features/content";
import { V2ConversationsFeature } from "@/v2/features/conversations";
import { V2DatingFeature } from "@/v2/features/dating";
import { V2EconomyFeature } from "@/v2/features/economy";
import { V2CommunityHomeFeature, V2PeopleDiscoveryFeature } from "@/v2/features/home";
import { V2PetsFeature } from "@/v2/features/pets";
import { V2ProfileFeature } from "@/v2/features/profile";
import { V2RomanticContextFeature } from "@/v2/features/romantic-context";
import { createV2ShellUser, performV2Logout, resolveV2RuntimeAccess } from "./contracts";
import { getV2RuntimeNavigation, getV2RuntimeRoute } from "./route-registry";
import { V2RuntimeShell } from "./V2RuntimeShell";
import { V2RuntimeState } from "./V2RuntimeState";

export function V2ShellRuntimeRoute({ slug }: { readonly slug: string }) {
  const { user, status, signOut, identity, refreshRole } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const access = resolveV2RuntimeAccess({
    enabled: v2FeatureFlags.appShell,
    status,
    hasUser: !!user,
  });
  const shellUser = useMemo(() => createV2ShellUser(user), [user]);
  const route = getV2RuntimeRoute(slug);
  const navigation = useMemo(() => getV2RuntimeNavigation(identity.canEnter), [identity]);

  if (access === "session-loading") return <V2RuntimeState kind="loading" />;
  if (access === "session-error") {
    return <V2RuntimeState kind="session-error" onRetry={() => router.invalidate()} />;
  }
  if (access !== "mount-shell") return null;
  if (route && !identity.canEnter(route.requiredDomain)) {
    return <V2RuntimeState kind="access-restricted" />;
  }

  const handleNavigate = (item: V2ShellNavigationItem) => {
    void navigate({ to: item.href });
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError("");
    const result = await performV2Logout(signOut);
    if (!result.ok) {
      setLogoutError(result.message);
      setLogoutLoading(false);
    }
  };

  const handleAccountNavigation = (target: AccountNavigationTarget) => {
    switch (target) {
      case "profile":
        void navigate({ to: "/perfil" });
        return;
      case "verification":
        void navigate({ to: "/verificacao" });
        return;
      case "blocked":
        void navigate({ to: "/bloqueados" });
        return;
      case "notifications":
        void navigate({ to: "/notificacoes" });
        return;
      case "support":
        void navigate({ to: "/suporte" });
        return;
      case "manual":
        void navigate({ to: "/manual" });
        return;
      case "terms":
        void navigate({ to: "/termos" });
    }
  };

  const content = (() => {
    if (!user || !route) return undefined;
    if (route?.slug === "configuracoes") {
      return (
        <V2AccountRuntimeFeature
          userId={user.id}
          theme={theme}
          onThemeChange={setTheme}
          onNavigate={handleAccountNavigation}
          logoutLoading={logoutLoading}
          onLogout={handleLogout}
          onDeletionRequested={handleLogout}
        />
      );
    }
    if (v2FeatureFlags.community && route?.slug === "inicio") {
      return (
        <V2CommunityHomeFeature
          userId={user.id}
          datingEnabled={identity.canEnter("dating")}
          onOpenDating={() =>
            void navigate({ to: "/v2/$section", params: { section: "pretendentes" } })
          }
        />
      );
    }
    if (v2FeatureFlags.community && route?.slug === "explorar-pessoas") {
      return <V2PeopleDiscoveryFeature userId={user.id} />;
    }
    if (v2FeatureFlags.community && route?.slug === "comunidade") {
      return <V2CommunityHubFeature userId={user.id} />;
    }
    if (v2FeatureFlags.messaging && route?.slug === "conversas") {
      return <V2ConversationsFeature userId={user.id} />;
    }
    if (v2FeatureFlags.profile && route?.slug === "perfil") {
      return <V2ProfileFeature userId={user.id} />;
    }
    if (v2FeatureFlags.economy && route?.slug === "loja") {
      return <V2EconomyFeature userId={user.id} />;
    }
    if (v2FeatureFlags.pets && route?.slug === "meu-pet") {
      return <V2PetsFeature userId={user.id} />;
    }
    if (v2FeatureFlags.content && route?.slug === "verbo") {
      return <V2ChristianContentFeature userId={user.id} />;
    }
    if (v2FeatureFlags.dating && route?.slug === "pretendentes") {
      return (
        <V2DatingFeature
          userId={user.id}
          onReviewPreferences={() => void navigate({ to: "/onboarding/namoro" })}
          onMembershipExit={async () => {
            await refreshRole();
            await navigate({ to: "/v2/$section", params: { section: "inicio" } });
          }}
          onOpenConversations={() =>
            void navigate({ to: "/v2/$section", params: { section: "conversas" } })
          }
        />
      );
    }
    if (v2FeatureFlags.dating && (route?.slug === "proposito" || route?.slug === "recados")) {
      return (
        <V2RomanticContextFeature
          area={route.slug === "proposito" ? "purpose" : "anonymous"}
          userId={user.id}
          onOpenConversations={() =>
            void navigate({ to: "/v2/$section", params: { section: "conversas" } })
          }
        />
      );
    }
    return undefined;
  })();

  return (
    <V2RuntimeShell
      route={route}
      user={shellUser}
      theme={theme}
      logoutLoading={logoutLoading}
      statusMessage={logoutError}
      content={content}
      navigation={navigation.primary}
      secondaryNavigation={navigation.secondary}
      onNavigate={handleNavigate}
      onNavigateHome={() => void navigate({ to: "/v2/$section", params: { section: "inicio" } })}
      onBack={() => router.history.back()}
      onThemeChange={setTheme}
      onLogout={handleLogout}
    />
  );
}
