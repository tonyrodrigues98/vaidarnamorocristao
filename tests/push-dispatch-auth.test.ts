import { describe, expect, it, vi } from "vitest";
import {
  handlePushDispatchMethodNotAllowed,
  handlePushDispatchPost,
} from "../src/lib/pushDispatchAuth.server";

const SECRET = "dispatch-secret-with-at-least-32-characters";

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function makeRequest(authorization?: string) {
  return new Request("https://example.test/api/public/hooks/push-dispatch", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

function makeOptions(overrides: Record<string, unknown> = {}) {
  return {
    env: {
      PUSH_DISPATCH_ENABLED: "true",
      PUSH_DISPATCH_SECRET: SECRET,
    },
    logger: makeLogger(),
    now: vi.fn().mockReturnValueOnce(1_000).mockReturnValueOnce(1_025),
    requestId: () => "request-test-id",
    runBatch: vi.fn().mockResolvedValue({
      processed: 2,
      sent: 1,
      removed: 0,
      failed: 1,
    }),
    ...overrides,
  };
}

describe("push dispatch authentication", () => {
  it("rejects GET with 405 and never needs a batch processor", async () => {
    const logger = makeLogger();
    const response = handlePushDispatchMethodNotAllowed({
      logger,
      requestId: () => "request-get",
    });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "method_not_allowed",
    });
  });

  it("stays closed when the kill switch is absent", async () => {
    const options = makeOptions({ env: {} });
    const response = await handlePushDispatchPost(makeRequest(`Bearer ${SECRET}`), options);

    expect(response.status).toBe(503);
    expect(options.runBatch).not.toHaveBeenCalled();
  });

  it("stays closed when the dedicated secret is absent or too short", async () => {
    const options = makeOptions({
      env: {
        PUSH_DISPATCH_ENABLED: "true",
        PUSH_DISPATCH_SECRET: "too-short",
      },
    });
    const response = await handlePushDispatchPost(makeRequest("Bearer too-short"), options);

    expect(response.status).toBe(503);
    expect(options.runBatch).not.toHaveBeenCalled();
  });

  it("rejects a missing credential without running the batch", async () => {
    const options = makeOptions();
    const response = await handlePushDispatchPost(makeRequest(), options);

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(options.runBatch).not.toHaveBeenCalled();
  });

  it("rejects an invalid credential without running the batch", async () => {
    const options = makeOptions();
    const invalidCredential = "a-different-secret-that-is-long-enough";
    const response = await handlePushDispatchPost(
      makeRequest(`Bearer ${invalidCredential}`),
      options,
    );
    const logLine = options.logger.warn.mock.calls[0]?.[0];

    expect(response.status).toBe(401);
    expect(options.runBatch).not.toHaveBeenCalled();
    expect(JSON.parse(logLine)).toMatchObject({
      component: "push_dispatch",
      event: "request_rejected",
      reason: "unauthorized",
      status: 401,
    });
    expect(logLine).not.toContain(SECRET);
    expect(logLine).not.toContain(invalidCredential);
  });

  it("runs the preserved batch exactly once for an authorized POST", async () => {
    const options = makeOptions();
    const response = await handlePushDispatchPost(makeRequest(`Bearer ${SECRET}`), options);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBe("request-test-id");
    expect(options.runBatch).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      processed: 2,
      sent: 1,
      removed: 0,
      failed: 1,
    });
  });

  it("does not leak internal errors or credentials", async () => {
    const internalMessage = `database failed with ${SECRET}`;
    const options = makeOptions({
      runBatch: vi.fn().mockRejectedValue(new Error(internalMessage)),
    });
    const response = await handlePushDispatchPost(makeRequest(`Bearer ${SECRET}`), options);
    const body = JSON.stringify(await response.json());
    const logs = [
      ...options.logger.info.mock.calls,
      ...options.logger.warn.mock.calls,
      ...options.logger.error.mock.calls,
    ]
      .flat()
      .join("\n");

    expect(response.status).toBe(500);
    expect(body).toBe(JSON.stringify({ ok: false, error: "internal_error" }));
    expect(body).not.toContain(internalMessage);
    expect(body).not.toContain(SECRET);
    expect(logs).not.toContain(internalMessage);
    expect(logs).not.toContain(SECRET);
  });
});
