import { z } from "zod";

export const ACCOUNT_DELETION_CONFIRMATION = "CONFIRMO";

export type AccountLifecycleStatus = "active" | "deactivated" | "deletion-pending";

export interface AccountLifecycle {
  readonly status: AccountLifecycleStatus;
  readonly deactivatedAt: string | null;
  readonly deletionRequestedAt: string | null;
  readonly deletionScheduledFor: string | null;
}

export type AccountCommand =
  | Readonly<{ type: "request-deactivation" }>
  | Readonly<{ type: "request-reactivation" }>
  | Readonly<{ type: "cancel-deletion" }>
  | Readonly<{ type: "request-deletion"; confirmation: string }>;

export type AccountOperationErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "conflict"
  | "network"
  | "invalid-response"
  | "unexpected";

export class AccountOperationError extends Error {
  readonly code: AccountOperationErrorCode;
  readonly retryable: boolean;

  constructor(code: AccountOperationErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "AccountOperationError";
    this.code = code;
    this.retryable = retryable;
  }
}

const accountLifecycleRecordSchema = z.object({
  deactivated_at: z.string().datetime({ offset: true }).nullable(),
  deletion_requested_at: z.string().datetime({ offset: true }).nullable(),
  deletion_scheduled_for: z.string().datetime({ offset: true }).nullable(),
});

export function parseAccountLifecycleRecord(value: unknown): AccountLifecycle {
  const parsed = accountLifecycleRecordSchema.safeParse(value);
  if (!parsed.success) {
    throw new AccountOperationError(
      "invalid-response",
      "Os dados da conta chegaram em um formato inesperado.",
    );
  }

  const status: AccountLifecycleStatus = parsed.data.deletion_requested_at
    ? "deletion-pending"
    : parsed.data.deactivated_at
      ? "deactivated"
      : "active";

  return {
    status,
    deactivatedAt: parsed.data.deactivated_at,
    deletionRequestedAt: parsed.data.deletion_requested_at,
    deletionScheduledFor: parsed.data.deletion_scheduled_for,
  };
}

export type AccountConfirmationResult =
  | Readonly<{ ok: true; value: typeof ACCOUNT_DELETION_CONFIRMATION }>
  | Readonly<{ ok: false; message: string }>;

export function validateAccountDeletionConfirmation(value: string): AccountConfirmationResult {
  if (value !== ACCOUNT_DELETION_CONFIRMATION) {
    return {
      ok: false,
      message: `Digite exatamente ${ACCOUNT_DELETION_CONFIRMATION} para continuar.`,
    };
  }
  return { ok: true, value: ACCOUNT_DELETION_CONFIRMATION };
}

export function formatAccountDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
