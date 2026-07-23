import type { V2ThemeName } from "@/v2/design-system";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { AccountRepository } from "./data/account-repository";
import { useAccountController } from "./remote/use-account-controller";
import { V2AccountSettings, type AccountNavigationTarget } from "./presentation/V2AccountSettings";

export interface V2AccountFeatureProps {
  readonly userId: string;
  readonly repository: AccountRepository;
  readonly theme: V2ThemeName;
  readonly onThemeChange: (theme: V2ThemeName) => void;
  readonly onNavigate: (target: AccountNavigationTarget) => void;
  readonly logoutLoading: boolean;
  readonly onLogout: () => void | Promise<void>;
  readonly onDeletionRequested: () => void | Promise<void>;
}

export function V2AccountFeature({
  userId,
  repository,
  theme,
  onThemeChange,
  onNavigate,
  logoutLoading,
  onLogout,
  onDeletionRequested,
}: V2AccountFeatureProps) {
  const { isOnline } = useNetworkStatus();
  const controller = useAccountController({
    userId,
    repository,
    isOnline,
    onDeletionRequested,
  });

  return (
    <V2AccountSettings
      {...controller}
      isOnline={isOnline}
      theme={theme}
      onThemeChange={onThemeChange}
      onNavigate={onNavigate}
      logoutLoading={logoutLoading}
      onLogout={onLogout}
      onRetry={() => {
        void controller.retry();
      }}
      onExecute={(command) => {
        void controller.execute(command);
      }}
    />
  );
}
