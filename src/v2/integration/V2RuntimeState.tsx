import { AlertTriangle, RotateCcw } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2Surface,
  V2Text,
  V2ThemeScope,
} from "@/v2/design-system";

export interface V2RuntimeStateProps {
  readonly kind: "loading" | "session-error" | "runtime-error" | "access-restricted";
  readonly onRetry?: () => void;
}

export function V2RuntimeState({ kind, onRetry }: V2RuntimeStateProps) {
  const loading = kind === "loading";
  const title = loading
    ? "Preparando sua comunidade"
    : kind === "session-error"
      ? "Sua sessão precisa de um instante"
      : kind === "access-restricted"
        ? "Esta área não está disponível"
        : "Não foi possível abrir esta área";
  const description = loading
    ? "Estamos restaurando sua sessão com segurança."
    : kind === "access-restricted"
      ? "Sua conta continua segura. Volte para uma área disponível ou revise suas configurações."
      : "Nada foi alterado. Tente novamente para continuar.";

  return (
    <V2ThemeScope className="vdn-v2-runtime-theme" data-vdn-v2-runtime-state="">
      <main className="vdn-v2-runtime-state" aria-busy={loading || undefined}>
        <V2Surface className="vdn-v2-runtime-state__surface" elevation="one">
          {loading ? (
            <V2LoadingIndicator label="Restaurando sessão" />
          ) : (
            <AlertTriangle aria-hidden="true" className="vdn-v2-runtime-state__icon" />
          )}
          <V2Heading level={1} size="medium">
            {title}
          </V2Heading>
          <V2Text tone="secondary">{description}</V2Text>
          {!loading && onRetry ? (
            <V2Button leadingIcon={<RotateCcw />} onClick={onRetry}>
              Tentar novamente
            </V2Button>
          ) : null}
        </V2Surface>
      </main>
    </V2ThemeScope>
  );
}
