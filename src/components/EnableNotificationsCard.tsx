import { Bell, BellRing, CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function EnableNotificationsCard() {
  const { busy, enable, isEnabled, isSupported, needsBackendSetup, permission, status } =
    usePushNotifications();

  if (!isSupported) return null;

  const denied = permission === "denied" || status === "denied";

  return (
    <section className="mobile-app-card mb-5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)] dark:bg-white/10">
          {isEnabled ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : denied ? (
            <ShieldAlert className="h-5 w-5" />
          ) : (
            <BellRing className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            {isEnabled
              ? "Notificacoes ativadas"
              : denied
                ? "Notificacoes bloqueadas"
                : "Ative notificacoes do app"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isEnabled
              ? "Voce ja permitiu notificacoes neste aparelho."
              : denied
                ? "Para ativar, libere as notificacoes nas configuracoes do navegador."
                : needsBackendSetup
                  ? "Permissao do aparelho pronta. Falta conectar o endpoint de Web Push para envio automatico."
                  : "Receba avisos quando tiver mensagens, interesses, matches e presentes."}
          </p>
        </div>
        {!isEnabled && !denied && (
          <Button
            type="button"
            size="sm"
            onClick={enable}
            disabled={busy}
            className="shrink-0 rounded-full"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{busy ? "Ativando..." : "Ativar"}</span>
          </Button>
        )}
      </div>
    </section>
  );
}
