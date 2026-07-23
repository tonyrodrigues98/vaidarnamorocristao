import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountOperationError, type AccountCommand } from "../domain/account";
import { accountQueryKey, type AccountRepository } from "../data/account-repository";
import { createAccountCommandRunner } from "./account-command-runner";

const SUCCESS_MESSAGES: Record<AccountCommand["type"], string> = {
  "request-deactivation": "Conta desativada. Você pode reativá-la quando quiser.",
  "request-reactivation": "Conta reativada com segurança.",
  "cancel-deletion": "A exclusão foi cancelada.",
  "request-deletion": "Exclusão agendada. Sua sessão será encerrada.",
};

function sanitizeOperationError(error: unknown): AccountOperationError {
  if (error instanceof AccountOperationError) return error;
  return new AccountOperationError(
    "unexpected",
    "Não foi possível concluir a ação agora. Tente novamente.",
    true,
  );
}

export interface UseAccountControllerOptions {
  readonly userId: string;
  readonly repository: AccountRepository;
  readonly isOnline: boolean;
  readonly onDeletionRequested: () => void | Promise<void>;
}

export function useAccountController({
  userId,
  repository,
  isOnline,
  onDeletionRequested,
}: UseAccountControllerOptions) {
  const queryClient = useQueryClient();
  const queryKey = accountQueryKey(userId);
  const [successMessage, setSuccessMessage] = useState("");
  const runner = useMemo(
    () =>
      createAccountCommandRunner({
        repository,
        isOnline: () => isOnline,
      }),
    [isOnline, repository],
  );

  const lifecycleQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => repository.loadLifecycle(userId, signal),
    enabled: isOnline,
    staleTime: 15_000,
    retry: (failureCount, error) => failureCount < 1 && sanitizeOperationError(error).retryable,
  });

  const mutation = useMutation({
    mutationFn: (command: AccountCommand) => runner.run(command),
    retry: false,
    onMutate: () => {
      setSuccessMessage("");
    },
    onSuccess: async (command) => {
      setSuccessMessage(SUCCESS_MESSAGES[command.type]);
      if (command.type === "request-deletion") {
        await queryClient.cancelQueries({ queryKey });
        queryClient.removeQueries({ queryKey });
        await onDeletionRequested();
        return;
      }
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const execute = useCallback(
    async (command: AccountCommand) => {
      if (mutation.isPending || runner.isRunning()) return;
      await mutation.mutateAsync(command).catch(() => undefined);
    },
    [mutation, runner],
  );

  const offlineError =
    !isOnline && lifecycleQuery.data === undefined
      ? new AccountOperationError(
          "network",
          "Você está offline. Reconecte-se para carregar os dados da conta.",
          true,
        )
      : null;

  return {
    lifecycle: lifecycleQuery.data ?? null,
    isLoading: lifecycleQuery.isLoading,
    isFetching: lifecycleQuery.isFetching,
    isEmpty: lifecycleQuery.isSuccess && lifecycleQuery.data === null,
    queryError: lifecycleQuery.error ? sanitizeOperationError(lifecycleQuery.error) : offlineError,
    mutationError: mutation.error ? sanitizeOperationError(mutation.error) : null,
    pendingCommand: mutation.isPending ? (mutation.variables?.type ?? null) : null,
    successMessage,
    retry: lifecycleQuery.refetch,
    execute,
  };
}
