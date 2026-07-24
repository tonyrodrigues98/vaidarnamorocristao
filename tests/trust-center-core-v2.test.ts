import { describe, expect, it } from "vitest";
import {
  canDisablePreference,
  classifyNotificationType,
  normalizeNotificationDestination,
  trustBoundaryContract,
  type NotificationPreference,
} from "../src/v2/features/trust/contracts";

describe("V2-020 Trust Center contracts", () => {
  it("classifies domain notifications without making delivery the domain authority", () => {
    expect(classifyNotificationType("message")).toBe("conversations");
    expect(classifyNotificationType("cinema_invite")).toBe("cinema");
    expect(classifyNotificationType("security_login")).toBe("security");
    expect(classifyNotificationType("unknown-community-event")).toBe("community");
  });

  it("accepts only safe same-origin destinations", () => {
    expect(normalizeNotificationDestination("/v2/central")).toBe("/v2/central");
    expect(normalizeNotificationDestination("https://vaidarnamoro.com/suporte")).toBe("/suporte");
    expect(normalizeNotificationDestination("https://attacker.example/phish")).toBeNull();
    expect(normalizeNotificationDestination("//attacker.example")).toBeNull();
    expect(normalizeNotificationDestination("javascript:alert(1)")).toBeNull();
  });

  it("keeps essential security inbox notifications enabled", () => {
    const security: NotificationPreference = {
      category: "security",
      inboxEnabled: true,
      pushEnabled: true,
      digestEnabled: false,
      soundEnabled: false,
      essential: true,
    };
    expect(canDisablePreference(security)).toBe(false);
    expect(canDisablePreference({ ...security, category: "community", essential: false })).toBe(
      true,
    );
  });

  it("distinguishes blocking, muting and reporting", () => {
    expect(trustBoundaryContract).toMatchObject({
      blockIsGlobal: true,
      muteIsNotBlock: true,
      reportDoesNotBlockAutomatically: true,
      aiFailureApprovesIdentity: false,
      notificationEventSeparatedFromDelivery: true,
    });
  });
});
