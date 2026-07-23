export type PushDispatchBatchResult = {
  processed: number;
  sent: number;
  removed: number;
  failed?: number;
};

type PushDispatchEnv = {
  PUSH_DISPATCH_ENABLED?: string;
  PUSH_DISPATCH_SECRET?: string;
};

type PushDispatchLogger = Pick<Console, "info" | "warn" | "error">;

type PushDispatchHandlerOptions = {
  env?: PushDispatchEnv;
  logger?: PushDispatchLogger;
  now?: () => number;
  requestId?: () => string;
  runBatch: () => Promise<PushDispatchBatchResult>;
};

type MethodNotAllowedOptions = Omit<PushDispatchHandlerOptions, "runBatch">;

const MIN_SECRET_LENGTH = 32;

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
  extraHeaders?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
      ...extraHeaders,
    },
  });
}

function writeLog(
  logger: PushDispatchLogger,
  level: keyof PushDispatchLogger,
  event: string,
  fields: Record<string, string | number>,
) {
  logger[level](
    JSON.stringify({
      component: "push_dispatch",
      event,
      ...fields,
    }),
  );
}

function getBearerCredential(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  return match?.[1] ?? null;
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(hash);
}

export async function constantTimeSecretEquals(candidate: string, expected: string) {
  const [candidateHash, expectedHash] = await Promise.all([digest(candidate), digest(expected)]);
  let difference = 0;

  for (let index = 0; index < expectedHash.length; index += 1) {
    difference |= candidateHash[index] ^ expectedHash[index];
  }

  return difference === 0;
}

function getRequestId(factory?: () => string) {
  return factory?.() ?? crypto.randomUUID();
}

export async function handlePushDispatchPost(
  request: Request,
  options: PushDispatchHandlerOptions,
) {
  const logger = options.logger ?? console;
  const now = options.now ?? Date.now;
  const requestId = getRequestId(options.requestId);
  const startedAt = now();
  const env = options.env ?? process.env;

  if (env.PUSH_DISPATCH_ENABLED !== "true") {
    writeLog(logger, "warn", "request_rejected", {
      request_id: requestId,
      reason: "disabled",
      status: 503,
    });
    return jsonResponse({ ok: false, error: "service_unavailable" }, 503, requestId);
  }

  const expectedSecret = env.PUSH_DISPATCH_SECRET ?? "";
  if (expectedSecret.length < MIN_SECRET_LENGTH) {
    writeLog(logger, "error", "request_rejected", {
      request_id: requestId,
      reason: "misconfigured",
      status: 503,
    });
    return jsonResponse({ ok: false, error: "service_unavailable" }, 503, requestId);
  }

  const candidate = getBearerCredential(request);
  if (!candidate || !(await constantTimeSecretEquals(candidate, expectedSecret))) {
    writeLog(logger, "warn", "request_rejected", {
      request_id: requestId,
      reason: "unauthorized",
      status: 401,
    });
    return jsonResponse({ ok: false, error: "unauthorized" }, 401, requestId, {
      "WWW-Authenticate": "Bearer",
    });
  }

  try {
    const result = await options.runBatch();
    writeLog(logger, "info", "batch_completed", {
      request_id: requestId,
      status: 200,
      duration_ms: Math.max(0, now() - startedAt),
      processed: result.processed,
      sent: result.sent,
      removed: result.removed,
      failed: result.failed ?? 0,
    });
    return jsonResponse({ ok: true, ...result }, 200, requestId);
  } catch {
    writeLog(logger, "error", "batch_failed", {
      request_id: requestId,
      status: 500,
      duration_ms: Math.max(0, now() - startedAt),
    });
    return jsonResponse({ ok: false, error: "internal_error" }, 500, requestId);
  }
}

export function handlePushDispatchMethodNotAllowed(options: MethodNotAllowedOptions = {}) {
  const logger = options.logger ?? console;
  const requestId = getRequestId(options.requestId);

  writeLog(logger, "warn", "request_rejected", {
    request_id: requestId,
    reason: "method_not_allowed",
    status: 405,
  });

  return jsonResponse({ ok: false, error: "method_not_allowed" }, 405, requestId, {
    Allow: "POST",
  });
}
