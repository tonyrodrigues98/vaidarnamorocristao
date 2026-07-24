import { useSyncExternalStore } from "react";
import {
  activateAppServiceWorkerUpdate,
  dismissAppServiceWorkerUpdate,
  getAppServiceWorkerServerSnapshot,
  getAppServiceWorkerSnapshot,
  subscribeToAppServiceWorker,
} from "@/lib/registerSW";
import { V2Button, V2Surface, V2Text } from "@/v2/design-system";
import "./styles.css";

export function V2ServiceWorkerUpdateNotice() {
  const state = useSyncExternalStore(
    subscribeToAppServiceWorker,
    getAppServiceWorkerSnapshot,
    getAppServiceWorkerServerSnapshot,
  );

  if (!state.updateAvailable) return null;

  const activating = state.phase === "activating";
  const activationFailed = state.phase === "error" && state.errorCode === "activation_failed";

  return (
    <V2Surface className="vdn-v2-update-notice" elevation="two" role="status" aria-live="polite">
      <div>
        <V2Text variant="label">Uma atualização segura está pronta</V2Text>
        <V2Text variant="caption" tone="secondary">
          {activationFailed
            ? "Não foi possível ativar agora. Você pode tentar novamente sem perder seu trabalho."
            : "Atualize quando quiser. A página só será recarregada após sua confirmação."}
        </V2Text>
      </div>
      <div className="vdn-v2-update-notice__actions">
        <V2Button
          size="small"
          loading={activating}
          disabled={activating}
          onClick={() => void activateAppServiceWorkerUpdate()}
        >
          Atualizar
        </V2Button>
        <V2Button
          size="small"
          variant="ghost"
          disabled={activating}
          onClick={dismissAppServiceWorkerUpdate}
        >
          Depois
        </V2Button>
      </div>
    </V2Surface>
  );
}
