import { describe, expect, it } from "vitest";
import {
  createCommandKey,
  isAnonymousNoteState,
  isPurposeState,
  safeRomanticMediaUrl,
  sanitizeRomanticText,
} from "../src/v2/features/romantic-context/contracts";
import {
  parseAnonymousCenter,
  parsePurposeSnapshot,
} from "../src/v2/features/romantic-context/repository";

describe("V2-015 romantic-context contracts", () => {
  it("models the full purpose lifecycle without conflating it with dating membership", () => {
    expect(
      ["requested", "active", "rejected", "cancelled", "ended", "archived"].every(isPurposeState),
    ).toBe(true);
    expect(isPurposeState("paused_by_commitment")).toBe(false);
  });

  it("models every preserved anonymous-note state", () => {
    expect(
      [
        "pending",
        "hint_requested",
        "hint_sent",
        "replied",
        "reveal_requested",
        "revealed",
        "ignored",
        "reported",
        "expired",
      ].every(isAnonymousNoteState),
    ).toBe(true);
    expect(isAnonymousNoteState("open_to_community")).toBe(false);
  });

  it("parses purpose data and rejects malformed history rows", () => {
    const snapshot = parsePurposeSnapshot({
      current: {
        id: "purpose-1",
        match_id: "match-1",
        state: "active",
        requested_by_me: false,
        requested_at: "2026-07-23T10:00:00.000Z",
        accepted_at: "2026-07-23T11:00:00.000Z",
        partner: {
          id: "partner-1",
          display_name: "Ana",
          photo_url: "https://cdn.example/ana.jpg",
        },
      },
      history: [
        {
          id: "purpose-0",
          match_id: "match-0",
          state: "archived",
          requested_at: "2026-07-20T10:00:00.000Z",
          partner: { id: "partner-0", display_name: "Joana" },
        },
        { id: "broken", state: "invented" },
      ],
      eligible_matches: [
        { match_id: "match-2", partner: { id: "partner-2", display_name: "Maria" } },
      ],
      message_count: 12,
      capsule_count: 2,
    });

    expect(snapshot.current).toMatchObject({
      id: "purpose-1",
      state: "active",
      requestedByMe: false,
      partner: { displayName: "Ana" },
    });
    expect(snapshot.history).toHaveLength(1);
    expect(snapshot.history[0]?.state).toBe("archived");
    expect(snapshot.eligibleMatches).toHaveLength(1);
    expect(snapshot.messageCount).toBe(12);
  });

  it("never invents anonymous acceptance or participant identities", () => {
    const center = parseAnonymousCenter({
      notes: [
        {
          id: "note-1",
          sender_id: "must-not-be-consumed",
          content: "Uma mensagem respeitosa",
          state: "pending",
          direction: "incoming",
        },
      ],
      recipients: [{ id: "person-1", display_name: "Participante" }],
    });

    expect(center.accepting).toBe(false);
    expect(center.notes[0]).toEqual(
      expect.not.objectContaining({ senderId: expect.anything(), sender_id: expect.anything() }),
    );
    expect(center.dailyFree).toBe(3);
  });

  it("normalizes bounded text without making a moderation decision in the browser", () => {
    expect(sanitizeRomanticText("  oi\r\ncom respeito  ", 12)).toBe("oi\ncom respe");
    expect(sanitizeRomanticText("   ", 280)).toBe("");
  });

  it("requires a cryptographically supplied UUID command key", () => {
    const uuid = "12345678-1234-4abc-8abc-123456789abc";
    expect(createCommandKey(() => uuid)).toBe(uuid);
    expect(() => createCommandKey(() => "fallback-123")).toThrow("secure_command_key_unavailable");
  });

  it("accepts only relative or HTTPS media references", () => {
    expect(safeRomanticMediaUrl("/profile-photos/a.jpg")).toBe("/profile-photos/a.jpg");
    expect(safeRomanticMediaUrl("https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg");
    expect(safeRomanticMediaUrl("//attacker.example/a.jpg")).toBeNull();
    expect(safeRomanticMediaUrl("javascript:alert(1)")).toBeNull();
  });
});
