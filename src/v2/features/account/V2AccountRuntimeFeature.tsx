import type { V2ThemeName } from "@/v2/design-system";
import { supabaseAccountRepository } from "./data/supabase-account-repository";
import type { AccountNavigationTarget } from "./presentation/V2AccountSettings";
import { V2AccountFeature } from "./V2AccountFeature";

export interface V2AccountRuntimeFeatureProps {
  readonly userId: string;
  readonly theme: V2ThemeName;
  readonly logoutLoading: boolean;
  readonly onThemeChange: (theme: V2ThemeName) => void;
  readonly onNavigate: (target: AccountNavigationTarget) => void;
  readonly onLogout: () => void;
  readonly onDeletionRequested: () => void;
}

export function V2AccountRuntimeFeature(props: V2AccountRuntimeFeatureProps) {
  return <V2AccountFeature {...props} repository={supabaseAccountRepository} />;
}
