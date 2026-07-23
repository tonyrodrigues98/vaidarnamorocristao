import { supabase } from "@/integrations/supabase/client";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  AccountOperationError,
  parseAccountLifecycleRecord,
  type AccountCommand,
} from "../domain/account";
import type { AccountRepository } from "./account-repository";

type BackendErrorLike = {
  readonly code?: string;
  readonly message?: string;
  readonly status?: number;
};

export function mapAccountBackendError(error: unknown): AccountOperationError {
  const issue =
    typeof error === "object" && error !== null ? (error as BackendErrorLike) : undefined;
  const code = issue?.code ?? "";
  const status = issue?.status;
  const message = issue?.message?.toLowerCase() ?? "";

  if (status === 401 || code === "PGRST301" || message.includes("jwt")) {
    return new AccountOperationError(
      "unauthenticated",
      "Sua sessão expirou. Entre novamente para continuar.",
    );
  }
  if (status === 403 || code === "42501" || message.includes("permission")) {
    return new AccountOperationError(
      "forbidden",
      "Sua conta não tem permissão para concluir esta ação.",
    );
  }
  if (status === 409 || code === "23505" || code === "40001") {
    return new AccountOperationError(
      "conflict",
      "O estado da conta mudou em outro lugar. Atualize e tente novamente.",
      true,
    );
  }
  if (message.includes("network") || message.includes("fetch") || error instanceof TypeError) {
    return new AccountOperationError(
      "network",
      "Não foi possível conectar. Verifique sua internet e tente novamente.",
      true,
    );
  }
  return new AccountOperationError(
    "unexpected",
    "Não foi possível concluir a ação agora. Tente novamente.",
    true,
  );
}

async function throwIfBackendError(error: unknown): Promise<void> {
  if (error) throw mapAccountBackendError(error);
}

export const supabaseAccountRepository: AccountRepository = {
  async loadLifecycle(userId, signal) {
    let query = supabase
      .from("profiles")
      .select("deactivated_at, deletion_requested_at, deletion_scheduled_for")
      .eq("id", userId);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query.maybeSingle();
    await throwIfBackendError(error);
    return data ? parseAccountLifecycleRecord(data) : null;
  },

  async execute(command: AccountCommand) {
    if (command.type === "request-deactivation") {
      const { error } = await supabase.rpc("request_account_deactivation");
      await throwIfBackendError(error);
      return;
    }
    if (command.type === "request-reactivation") {
      const { error } = await supabase.rpc("request_account_reactivation");
      await throwIfBackendError(error);
      return;
    }
    if (command.type === "cancel-deletion") {
      const { error } = await supabase.rpc("cancel_account_deletion");
      await throwIfBackendError(error);
      return;
    }
    if (command.confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
      throw new AccountOperationError("unexpected", "A confirmação de exclusão é inválida.");
    }
    const { error } = await supabase.rpc("request_account_deletion", {
      _confirm: command.confirmation,
    });
    await throwIfBackendError(error);
  },
};
