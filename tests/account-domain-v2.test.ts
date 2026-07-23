import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  AccountOperationError,
  accountQueryKey,
  formatAccountDate,
  parseAccountLifecycleRecord,
  validateAccountDeletionConfirmation,
} from "../src/v2/features/account";

const timestamp = "2026-07-23T18:00:00.000Z";

describe("V2 account domain", () => {
  it("maps an active account without exposing the database shape", () => {
    expect(
      parseAccountLifecycleRecord({
        deactivated_at: null,
        deletion_requested_at: null,
        deletion_scheduled_for: null,
      }),
    ).toEqual({
      status: "active",
      deactivatedAt: null,
      deletionRequestedAt: null,
      deletionScheduledFor: null,
    });
  });

  it("maps deactivation and gives deletion precedence", () => {
    expect(
      parseAccountLifecycleRecord({
        deactivated_at: timestamp,
        deletion_requested_at: null,
        deletion_scheduled_for: null,
      }).status,
    ).toBe("deactivated");
    expect(
      parseAccountLifecycleRecord({
        deactivated_at: timestamp,
        deletion_requested_at: timestamp,
        deletion_scheduled_for: timestamp,
      }).status,
    ).toBe("deletion-pending");
  });

  it("rejects missing or malformed backend fields with a sanitized error", () => {
    expect(() => parseAccountLifecycleRecord({ deactivated_at: null })).toThrow(
      AccountOperationError,
    );
    try {
      parseAccountLifecycleRecord({
        deactivated_at: "not-a-date",
        deletion_requested_at: null,
        deletion_scheduled_for: null,
      });
    } catch (error) {
      expect(error).toMatchObject({ code: "invalid-response", retryable: false });
      expect(String(error)).not.toContain("not-a-date");
    }
  });

  it("requires the exact server confirmation contract", () => {
    expect(validateAccountDeletionConfirmation(ACCOUNT_DELETION_CONFIRMATION)).toEqual({
      ok: true,
      value: "CONFIRMO",
    });
    expect(validateAccountDeletionConfirmation("confirmo")).toMatchObject({ ok: false });
    expect(validateAccountDeletionConfirmation(" CONFIRMO ")).toMatchObject({ ok: false });
  });

  it("partitions the private query key by canonical user id", () => {
    expect(accountQueryKey("user-a")).not.toEqual(accountQueryKey("user-b"));
    expect(accountQueryKey("user-a")).toEqual(["v2", "account", "lifecycle", "user-a"]);
  });

  it("formats valid dates and safely ignores invalid optional dates", () => {
    expect(formatAccountDate(timestamp)).toMatch(/23 de julho de 2026/);
    expect(formatAccountDate(null)).toBeNull();
    expect(formatAccountDate("invalid")).toBeNull();
  });
});
