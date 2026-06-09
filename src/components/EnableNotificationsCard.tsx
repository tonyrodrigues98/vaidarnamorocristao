import { BellRing, CheckCircle2, ShieldAlert, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendTestPush } from "@/lib/push.functions";

export function EnableNotificationsCard() {
  // IMPORTANT: all hooks must run unconditionally — never put hooks after an early return.
  const { busy, enable, disable, isEnabled, isSupported, needsBackendSetup, permission, status } =
    usePushNotifications();
  const [testing, setTesting] = useState(false);

  if (!isSupported) return null;

  const denied = permission === "denied" || status === "denied";

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await enable();
        if (Notification.permission === "denied") {
          toast.error("Permissão negada pelo navegador. Libere nas configurações do site.");
        } else if (Notification.permission !== "granted") {
          toast.warning("Permissão não concedida.");
        } else {
          toast.success("Notificações ativadas neste aparelho.");
        }
      } else {
        await disable();
        toast("Notificações desativadas neste aparelho.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar as notificações.");
    }
  };

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
        const first = results.find((r) => !r.ok);
        const detail = first
          ? `[${first.status || "?"}] ${first.error || "erro desconhecido"}`
          : "erro desconhecido";
        toast.warning(`Falhou em ${fail}/${results.length}: ${detail}`, { duration: 12000 });
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
              ? "Notificações ativadas"
              : denied
                ? "Notificações bloqueadas"
                : "Ative notificações do app"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isEnabled
              ? "Você já permitiu notificações neste aparelho."
              : denied
                ? "Para ativar, libere as notificações nas configurações do navegador."
                : needsBackendSetup
                  ? "Permissão pronta. Toque no botão novamente para concluir a inscrição."
                  : "Receba avisos quando tiver mensagens, interesses, matches e presentes."}
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={busy || denied}
          aria-label="Ativar notificações push"
          className="mt-1 shrink-0"
        />
      </div>
      {isEnabled && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="rounded-full"
          >
            <Send className="mr-1 h-4 w-4" />
            {testing ? "Enviando..." : "Enviar teste"}
          </Button>
        </div>
      )}
    </section>
  );
}
