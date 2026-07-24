import { describe, expect, it } from "vitest";

import {
  RELEASE_TELEMETRY_POLICY,
  createSanitizedReleaseEvent,
  sanitizeRoute,
} from "../src/v2/platform/observability";

describe("release observability privacy boundary", () => {
  it("removes query strings and fragments from routes", () => {
    expect(sanitizeRoute("/conversas/123?token=secret#latest")).toBe("/conversas/:id");
  });

  it("rejects external or scheme-relative telemetry routes", () => {
    expect(sanitizeRoute("https://example.com/private")).toBeUndefined();
    expect(sanitizeRoute("//example.com/private")).toBeUndefined();
  });

  it("reduces UUID-like identifiers without retaining user identity", () => {
    expect(sanitizeRoute("/perfil/8c570dbd-cba7-43da-9169-5d084f83da51")).toBe("/perfil/:id");
  });

  it("creates an allowlisted event and drops undeclared input", () => {
    const input = {
      kind: "frontend_error" as const,
      severity: "critical" as const,
      buildCommit: "abc123",
      buildChannel: "validation",
      route: "/perfil/123?email=pessoa@example.invalid",
      operation: "route_render",
      statusCode: 500,
      durationMs: 10.6,
      email: "pessoa@example.invalid",
      message: "private content",
      access_token: "not-allowed",
    };

    expect(createSanitizedReleaseEvent(input)).toEqual({
      schemaVersion: 1,
      kind: "frontend_error",
      severity: "critical",
      buildCommit: "abc123",
      buildChannel: "validation",
      route: "/perfil/:id",
      operation: "route_render",
      statusCode: 500,
      durationMs: 11,
    });
  });

  it("defines bounded retention and explicit forbidden fields", () => {
    expect(RELEASE_TELEMETRY_POLICY.retentionDays).toBeLessThanOrEqual(30);
    expect(RELEASE_TELEMETRY_POLICY.forbiddenFields).toEqual(
      expect.arrayContaining(["access_token", "refresh_token", "email", "message", "signed_url"]),
    );
  });
});
