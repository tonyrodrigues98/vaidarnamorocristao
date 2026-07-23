import { beforeEach, describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    abortSignal: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.abortSignal.mockReturnValue(query);
  return {
    query,
    from: vi.fn(() => query),
    rpc: vi.fn(),
  };
});

vi.mock("../src/integrations/supabase/client", () => ({
  supabase: {
    from: backend.from,
    rpc: backend.rpc,
  },
}));

import {
  AccountOperationError,
  createAccountCommandRunner,
  mapAccountBackendError,
  supabaseAccountRepository,
} from "../src/v2/features/account";

const lifecycleRecord = {
  deactivated_at: null,
  deletion_requested_at: null,
  deletion_scheduled_for: null,
};

describe("V2 account Supabase adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backend.query.select.mockReturnValue(backend.query);
    backend.query.eq.mockReturnValue(backend.query);
    backend.query.abortSignal.mockReturnValue(backend.query);
    backend.query.maybeSingle.mockResolvedValue({ data: lifecycleRecord, error: null });
    backend.rpc.mockResolvedValue({ data: undefined, error: null });
  });

  it("loads only lifecycle fields for the authenticated query key owner", async () => {
    const controller = new AbortController();
    await expect(
      supabaseAccountRepository.loadLifecycle("canonical-user", controller.signal),
    ).resolves.toMatchObject({ status: "active" });
    expect(backend.from).toHaveBeenCalledWith("profiles");
    expect(backend.query.select).toHaveBeenCalledWith(
      "deactivated_at, deletion_requested_at, deletion_scheduled_for",
    );
    expect(backend.query.eq).toHaveBeenCalledWith("id", "canonical-user");
    expect(backend.query.abortSignal).toHaveBeenCalledWith(controller.signal);
  });

  it("treats an absent profile record as an explicit empty state", async () => {
    backend.query.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(supabaseAccountRepository.loadLifecycle("canonical-user")).resolves.toBeNull();
  });

  it("invokes identity-derived lifecycle RPCs without a client user id", async () => {
    await supabaseAccountRepository.execute({ type: "request-deactivation" });
    await supabaseAccountRepository.execute({ type: "request-reactivation" });
    await supabaseAccountRepository.execute({ type: "cancel-deletion" });

    expect(backend.rpc.mock.calls).toEqual([
      ["request_account_deactivation"],
      ["request_account_reactivation"],
      ["cancel_account_deletion"],
    ]);
  });

  it("passes only the exact confirmation to the deletion RPC", async () => {
    await supabaseAccountRepository.execute({
      type: "request-deletion",
      confirmation: "CONFIRMO",
    });
    expect(backend.rpc).toHaveBeenCalledWith("request_account_deletion", {
      _confirm: "CONFIRMO",
    });
  });

  it("never calls the backend for an invalid deletion confirmation", async () => {
    await expect(
      supabaseAccountRepository.execute({
        type: "request-deletion",
        confirmation: "confirmo",
      }),
    ).rejects.toBeInstanceOf(AccountOperationError);
    expect(backend.rpc).not.toHaveBeenCalled();
  });

  it("sanitizes authorization, conflict, network and unexpected errors", () => {
    expect(mapAccountBackendError({ code: "42501", message: "private detail" })).toMatchObject({
      code: "forbidden",
      retryable: false,
    });
    expect(mapAccountBackendError({ status: 409 })).toMatchObject({
      code: "conflict",
      retryable: true,
    });
    expect(mapAccountBackendError(new TypeError("fetch failed"))).toMatchObject({
      code: "network",
      retryable: true,
    });
    expect(mapAccountBackendError({ message: "database internals" }).message).not.toContain(
      "database",
    );
  });

  it("prevents duplicate command execution while one mutation is in flight", async () => {
    let finish: (() => void) | undefined;
    const execute = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const runner = createAccountCommandRunner({
      repository: {
        loadLifecycle: vi.fn(),
        execute,
      },
      isOnline: () => true,
    });
    const command = { type: "request-deactivation" } as const;
    const first = runner.run(command);
    const repeated = runner.run({ type: "request-reactivation" });

    expect(runner.isRunning()).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    finish?.();
    await expect(Promise.all([first, repeated])).resolves.toEqual([command, command]);
    expect(runner.isRunning()).toBe(false);
  });

  it("rejects offline commands before calling the repository", async () => {
    const execute = vi.fn();
    const runner = createAccountCommandRunner({
      repository: {
        loadLifecycle: vi.fn(),
        execute,
      },
      isOnline: () => false,
    });
    await expect(runner.run({ type: "request-deactivation" })).rejects.toMatchObject({
      code: "network",
    });
    expect(execute).not.toHaveBeenCalled();
  });
});
