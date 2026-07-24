import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2Surface,
  V2Text,
  V2ThemeScope,
} from "@/v2/design-system";
import { DatingOptInFlow, datingOptInRepository } from "@/v2/features/onboarding";
import { v2FeatureFlags } from "@/v2/platform/feature-flags";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/onboarding/namoro")({
  component: DatingOptInRoute,
});

function DatingOptInRoute() {
  const { user, loading, profileStatus, refreshRole } = useAuth();
  const navigate = useNavigate();

  if (!v2FeatureFlags.dating) return <Navigate to="/inicio" />;
  if (loading) {
    return (
      <V2ThemeScope className="grid min-h-dvh place-items-center">
        <V2LoadingIndicator label="Restaurando sua sessão" visibleLabel />
      </V2ThemeScope>
    );
  }
  if (!user) return <Navigate to="/auth/login" />;
  if (profileStatus !== "approved") {
    return (
      <V2ThemeScope className="grid min-h-dvh place-items-center px-4">
        <main>
          <V2Surface tone="elevated" elevation="one" padding="large">
            <div className="grid max-w-lg gap-4">
              <V2Heading level={1} size="large">
                Namoro ainda indisponível
              </V2Heading>
              <V2Text tone="secondary">
                Conclua o perfil comunitário e aguarde a aprovação antes de ativar esta área.
              </V2Text>
              <V2Button onClick={() => navigate({ to: "/inicio" })}>Voltar à comunidade</V2Button>
            </div>
          </V2Surface>
        </main>
      </V2ThemeScope>
    );
  }

  return (
    <V2ThemeScope>
      <DatingOptInFlow
        userId={user.id}
        repository={datingOptInRepository}
        onClose={() => navigate({ to: "/inicio" })}
        onMembershipChanged={() => {
          void refreshRole();
        }}
      />
    </V2ThemeScope>
  );
}
