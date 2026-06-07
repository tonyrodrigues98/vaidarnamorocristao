import { Bell, BellRing, CheckCircle2, ShieldAlert, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendTestPush } from "@/lib/push.functions";

export function EnableNotificationsCard() {
  const { busy, enable, isEnabled, isSupported, needsBackendSetup, permission, status } =
    usePushNotifications();

  if (!isSupported) return null;

  const denied = permission === "denied" || status === "denied";
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const { results } = await sendTestPush();
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      if (results.length === 0) {
        toast.error("Nenhum dispositivo inscrito para este usuário.");
      } else if (fail === 0) {
        toast.success(`Push enviado para ${ok} dispositivo(s).`);
      } else {
        toast.warning(`Enviado para ${ok}, falhou em ${fail}.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar push.");
    } finally {
      setTesting(false);
    }
  };

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
        {isEnabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{testing ? "Enviando..." : "Testar"}</span>
          </Button>
        )}
      </div>
    </section>
  );
}
