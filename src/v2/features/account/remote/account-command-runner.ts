import { AccountOperationError, type AccountCommand } from "../domain/account";
import type { AccountRepository } from "../data/account-repository";

export interface AccountCommandRunner {
  run(command: AccountCommand): Promise<AccountCommand>;
  isRunning(): boolean;
}

export function createAccountCommandRunner({
  repository,
  isOnline,
}: {
  readonly repository: AccountRepository;
  readonly isOnline: () => boolean;
}): AccountCommandRunner {
  let inFlight: Promise<AccountCommand> | null = null;

  return {
    run(command) {
      if (inFlight) return inFlight;
      if (!isOnline()) {
        return Promise.reject(
          new AccountOperationError(
            "network",
            "Você está offline. Reconecte-se para alterar sua conta.",
            true,
          ),
        );
      }
      inFlight = repository
        .execute(command)
        .then(() => command)
        .finally(() => {
          inFlight = null;
        });
      return inFlight;
    },
    isRunning() {
      return inFlight !== null;
    },
  };
}
