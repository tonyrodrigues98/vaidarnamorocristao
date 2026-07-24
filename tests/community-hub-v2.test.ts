import { describe, expect, it } from "vitest";
import {
  canManageCommunitySpace,
  formatCommunityEventTime,
  isCommunityMembershipState,
  isCommunitySpaceVisibility,
  sanitizeCommunityMessage,
} from "../src/v2/features/community/contracts";
import { parseCommunityHubPayload } from "../src/v2/features/community/repository";

describe("V2-011 community contracts", () => {
  it("keeps community space visibility independent from dating state", () => {
    expect(isCommunitySpaceVisibility("public")).toBe(true);
    expect(isCommunitySpaceVisibility("approval")).toBe(true);
    expect(isCommunitySpaceVisibility("dating")).toBe(false);
  });

  it("recognizes server-owned membership states", () => {
    for (const state of ["none", "requested", "invited", "active", "muted", "banned"]) {
      expect(isCommunityMembershipState(state)).toBe(true);
    }
    expect(isCommunityMembershipState("owner")).toBe(false);
  });

  it("allows local moderation only to active owners and moderators", () => {
    expect(canManageCommunitySpace("owner", "active")).toBe(true);
    expect(canManageCommunitySpace("moderator", "active")).toBe(true);
    expect(canManageCommunitySpace("moderator", "muted")).toBe(false);
    expect(canManageCommunitySpace("member", "active")).toBe(false);
  });

  it("sanitizes global chat messages without inventing persistence", () => {
    expect(sanitizeCommunityMessage("  Paz   e graça  ")).toBe("Paz e graça");
    expect(sanitizeCommunityMessage(" ".repeat(20))).toBe("");
    expect(sanitizeCommunityMessage("a".repeat(1200))).toHaveLength(1000);
  });

  it("formats events in their declared timezone with a safe fallback", () => {
    const instant = "2026-07-23T18:00:00.000Z";
    expect(formatCommunityEventTime(instant, "America/Sao_Paulo")).toContain("15:00");
    expect(formatCommunityEventTime(instant, "Not/AZone")).toContain("18:00");
    expect(formatCommunityEventTime("invalid", "UTC")).toBe("Horário a confirmar");
  });

  it("parses untrusted hub payloads and rejects incomplete rows", () => {
    const parsed = parseCommunityHubPayload({
      spaces: [
        {
          id: "space-1",
          slug: "jovens-na-fe",
          name: "Jovens na fé",
          visibility: "public",
          member_count: 12,
          membership_state: "active",
          member_role: "member",
        },
        { id: "", slug: "invalid", name: "Inválido" },
      ],
      events: [
        {
          id: "event-1",
          title: "Encontro de oração",
          starts_at: "2026-07-24T20:00:00.000Z",
          timezone: "UTC",
        },
      ],
      messages: [
        {
          id: "message-1",
          sender_id: "user-1",
          sender_name: "Ana",
          content: "Boa noite",
          created_at: "2026-07-23T20:00:00.000Z",
        },
      ],
      presence: [{ user_id: "user-2", name: "Rui", state: "online" }],
    });

    expect(parsed.spaces).toHaveLength(1);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.messages[0]?.senderName).toBe("Ana");
    expect(parsed.presence[0]?.state).toBe("online");
  });
});
