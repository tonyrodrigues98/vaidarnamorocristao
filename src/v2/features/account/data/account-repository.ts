import type { AccountCommand, AccountLifecycle } from "../domain/account";

export interface AccountRepository {
  loadLifecycle(userId: string, signal?: AbortSignal): Promise<AccountLifecycle | null>;
  execute(command: AccountCommand): Promise<void>;
}

export const accountQueryKey = (userId: string) => ["v2", "account", "lifecycle", userId] as const;
