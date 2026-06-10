import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, PauseCircle, PlayCircle, Trash2, Undo2 } from "lucide-react";

type AccountState = {
  deactivated_at: string | null;
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
};

export function AccountDangerZone() {
  const { user, signOut } = useAuth();
  const [state, setState] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDeactivate, setOpenDeactivate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("deactivated_at, deletion_requested_at, deletion_scheduled_for")
        .eq("id", user.id)
        .maybeSingle();
      if (alive) setState((data as AccountState) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const isDeactivated = !!state?.deactivated_at && !state?.deletion_requested_at;
  const isPendingDeletion = !!state?.deletion_requested_at;

  async function refresh() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("deactivated_at, deletion_requested_at, deletion_scheduled_for")
      .eq("id", user.id)
      .maybeSingle();
    setState((data as AccountState) ?? null);
  }

  async function handleDeactivate() {
    setLoading(true);
    const { error } = await supabase.rpc("request_account_deactivation");
    setLoading(false);
    if (error) {
      toast.error("Não foi possível desativar.");
      return;
    }
    setOpenDeactivate(false);
    toast.success("Conta desativada. Você pode reativar quando quiser.");
    await refresh();
  }

  async function handleReactivate() {
    setLoading(true);
    const { error } = await supabase.rpc("request_account_reactivation");
    setLoading(false);
    if (error) {
      toast.error("Não foi possível reativar.");
      return;
    }
    toast.success("Conta reativada.");
    await refresh();
  }

  async function handleDelete() {
    if (confirmText !== "CONFIRMO") {
      toast.error('Digite exatamente "CONFIRMO" para prosseguir.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("request_account_deletion", { _confirm: confirmText });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível agendar a exclusão.");
      return;
    }
    toast.success("Sua conta será excluída em 30 dias. Você ainda pode cancelar.");
    setOpenDelete(false);
    setDeleteStep(1);
    setConfirmText("");
    await refresh();
    await signOut();
  }

  async function handleCancelDeletion() {
    setLoading(true);
    const { error } = await supabase.rpc("cancel_account_deletion");
    setLoading(false);
    if (error) {
      toast.error("Não foi possível cancelar.");
      return;
    }
    toast.success("Exclusão cancelada. Bem-vindo(a) de volta!");
    await refresh();
  }

  return (
    <div className="space-y-4">
      {isPendingDeletion && state?.deletion_scheduled_for && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-soft dark:border-red-400/40 dark:bg-red-950/45 dark:text-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Exclusão agendada</p>
              <p className="mt-1">
                Sua conta será permanentemente excluída em{" "}
                <strong>
                  {new Date(state.deletion_scheduled_for).toLocaleDateString("pt-BR")}
                </strong>
                . Você ainda pode cancelar agora.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={handleCancelDeletion}
                disabled={loading}
              >
                <Undo2 className="mr-2 h-4 w-4" /> Cancelar exclusão
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDeactivated && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Sua conta está desativada</p>
          <p className="mt-1">Seu perfil não está visível. Reative para voltar à comunidade.</p>
          <Button size="sm" className="mt-3" onClick={handleReactivate} disabled={loading}>
            <PlayCircle className="mr-2 h-4 w-4" /> Reativar conta
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-soft">
        <h3 className="text-base font-semibold">Desativar conta</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu perfil ficará invisível e você não receberá novos interesses. Suas conversas ficam
          salvas e você pode reativar a qualquer momento.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setOpenDeactivate(true)}
          disabled={loading || isDeactivated || isPendingDeletion}
        >
          <PauseCircle className="mr-2 h-4 w-4" /> Desativar conta
        </Button>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950 shadow-soft dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-50">
        <h3 className="flex items-center gap-2 text-base font-semibold text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4" />
          Excluir conta
        </h3>
        <p className="mt-1 text-sm text-red-900/80 dark:text-red-100/80">
          Ação permanente. Após 30 dias seus dados serão removidos definitivamente. Você pode
          cancelar dentro desse prazo.
        </p>
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => {
            setDeleteStep(1);
            setConfirmText("");
            setOpenDelete(true);
          }}
          disabled={loading || isPendingDeletion}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Excluir conta
        </Button>
      </div>

      {/* Deactivate dialog */}
      <AlertDialog open={openDeactivate} onOpenChange={setOpenDeactivate}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar sua conta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Enquanto sua conta estiver desativada:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Seu perfil ficará invisível</li>
                  <li>Você não aparecerá em buscas</li>
                  <li>Não receberá novos interesses</li>
                  <li>Suas conversas ficam salvas</li>
                  <li>Você pode reativar a qualquer momento</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={loading}>
              Confirmar desativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog (3 steps) */}
      <AlertDialog
        open={openDelete}
        onOpenChange={(o) => {
          setOpenDelete(o);
          if (!o) {
            setDeleteStep(1);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              {deleteStep === 1 && "Excluir conta — etapa 1 de 3"}
              {deleteStep === 2 && "Confirme digitando — etapa 2 de 3"}
              {deleteStep === 3 && "Última confirmação — etapa 3 de 3"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-foreground/90">
                {deleteStep === 1 && (
                  <>
                    <p>
                      Esta ação é <strong>permanente</strong>. Você perderá:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Todos os seus matches</li>
                      <li>Todas as suas conversas</li>
                      <li>Seu progresso e conquistas</li>
                      <li>Suas fotos e dados de perfil</li>
                    </ul>
                    <p className="text-muted-foreground">
                      Você terá 30 dias para se arrepender e cancelar a exclusão.
                    </p>
                  </>
                )}
                {deleteStep === 2 && (
                  <>
                    <p>
                      Para continuar, digite exatamente <strong>CONFIRMO</strong> no campo abaixo.
                    </p>
                    <Input
                      autoFocus
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Digite CONFIRMO"
                      aria-label="Texto de confirmação"
                    />
                    {confirmText.length > 0 && confirmText !== "CONFIRMO" && (
                      <p className="text-xs text-red-600">
                        Texto incorreto. Digite CONFIRMO em maiúsculas.
                      </p>
                    )}
                  </>
                )}
                {deleteStep === 3 && (
                  <>
                    <p>
                      Tem certeza absoluta? Esta é sua última chance antes de iniciar o processo de
                      exclusão.
                    </p>
                    <p className="text-muted-foreground">
                      Sua conta será desativada agora e excluída permanentemente em 30 dias.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            {deleteStep === 1 && (
              <Button variant="destructive" onClick={() => setDeleteStep(2)}>
                Continuar
              </Button>
            )}
            {deleteStep === 2 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteStep(3)}
                disabled={confirmText !== "CONFIRMO"}
              >
                Continuar
              </Button>
            )}
            {deleteStep === 3 && (
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir permanentemente
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
