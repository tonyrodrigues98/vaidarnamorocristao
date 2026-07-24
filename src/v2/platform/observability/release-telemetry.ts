export const RELEASE_EVENT_KINDS = [
  "frontend_error",
  "server_error",
  "auth_failure",
  "database_failure",
  "storage_failure",
  "realtime_failure",
  "notification_failure",
  "service_worker_failure",
  "offline_sync_failure",
  "health_check",
] as const;

export type ReleaseEventKind = (typeof RELEASE_EVENT_KINDS)[number];
export type ReleaseSeverity = "info" | "warning" | "critical" | "security";

export interface ReleaseTelemetryInput {
  kind: ReleaseEventKind;
  severity: ReleaseSeverity;
  buildCommit: string;
  buildChannel: string;
  route?: string;
  operation?: string;
  statusCode?: number;
  durationMs?: number;
  online?: boolean;
  errorCode?: string;
}

export interface SanitizedReleaseEvent {
  schemaVersion: 1;
  kind: ReleaseEventKind;
  severity: ReleaseSeverity;
  buildCommit: string;
  buildChannel: string;
  route?: string;
  operation?: string;
  statusCode?: number;
  durationMs?: number;
  online?: boolean;
  errorCode?: string;
}

const SAFE_IDENTIFIER = /[^a-zA-Z0-9._:/-]/g;
const MAX_IDENTIFIER_LENGTH = 96;

function sanitizeIdentifier(value: string): string {
  return value.replace(SAFE_IDENTIFIER, "_").slice(0, MAX_IDENTIFIER_LENGTH);
}

export function sanitizeRoute(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const path = value.split(/[?#]/u, 1)[0];
  if (!path.startsWith("/") || path.startsWith("//")) return undefined;

  return path
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (/^\d+$/u.test(segment) || /^[0-9a-f-]{16,}$/iu.test(segment)) {
        return ":id";
      }
      return sanitizeIdentifier(segment);
    })
    .join("/")
    .slice(0, 160);
}

export function createSanitizedReleaseEvent(input: ReleaseTelemetryInput): SanitizedReleaseEvent {
  const event: SanitizedReleaseEvent = {
    schemaVersion: 1,
    kind: input.kind,
    severity: input.severity,
    buildCommit: sanitizeIdentifier(input.buildCommit),
    buildChannel: sanitizeIdentifier(input.buildChannel),
  };

  const route = sanitizeRoute(input.route);
  if (route) event.route = route;
  if (input.operation) event.operation = sanitizeIdentifier(input.operation);
  if (Number.isInteger(input.statusCode)) event.statusCode = input.statusCode;
  if (Number.isFinite(input.durationMs)) {
    event.durationMs = Math.max(0, Math.round(input.durationMs ?? 0));
  }
  if (typeof input.online === "boolean") event.online = input.online;
  if (input.errorCode) event.errorCode = sanitizeIdentifier(input.errorCode);

  return event;
}

export const RELEASE_TELEMETRY_POLICY = {
  retentionDays: 30,
  forbiddenFields: [
    "access_token",
    "refresh_token",
    "authorization",
    "cookie",
    "email",
    "phone",
    "message",
    "report_content",
    "signed_url",
  ],
  sampling: {
    critical: 1,
    security: 1,
    warning: 1,
    info: 0.1,
  },
} as const;

export const RELEASE_ALERT_LEVELS = {
  info: "Informational signal with no immediate intervention.",
  warning: "Actionable degradation with an assigned owner and response window.",
  critical: "Availability or integrity incident requiring immediate triage.",
  security: "Potential confidentiality, integrity or access-control incident.",
} as const;
