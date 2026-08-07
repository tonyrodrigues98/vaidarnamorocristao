import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { shouldUseNativeFocusedChat } from "../src/config/native-focused-chat";

const privateSource = readFileSync("src/routes/conversas/$matchId.tsx", "utf8");
const communitySource = readFileSync("src/routes/conversas/comunidade.tsx", "utf8");
const cssSource = readFileSync("src/styles/native-focused-chat.css", "utf8");

describe("T46-15 native focused chat", () => {
  it("selects only focused conversation paths when the feature is enabled", () => {
    expect(shouldUseNativeFocusedChat("/conversas/comunidade", true)).toBe(true);
    expect(shouldUseNativeFocusedChat("/conversas/match-1", true)).toBe(true);
    expect(shouldUseNativeFocusedChat("/conversas", true)).toBe(false);
    expect(shouldUseNativeFocusedChat("/admin", true)).toBe(false);
    expect(shouldUseNativeFocusedChat("/unknown", true)).toBe(false);
    expect(shouldUseNativeFocusedChat("/conversas/match-1", false)).toBe(false);
  });

  it("keeps focused chats outside the app shell with one local frame", () => {
    expect(privateSource).toContain("data-vdn-native-focused-chat");
    expect(communitySource).toContain("data-vdn-native-focused-chat");
    expect(privateSource + communitySource).not.toContain("data-vdn-native-shell");
    expect(privateSource).toContain("!nativeFocusedChat && (");
    expect(communitySource).toMatch(/!nativeFocusedChat\s*&&\s*\(\s*<MobileAppHeader/);
    expect(communitySource).toContain('data-has-bottom-nav={nativeFocusedChat ? "false" : "true"}');
  });

  it("preserves private query, pagination, realtime and optimistic contracts", () => {
    for (const contract of [
      '["chat-messages", matchId, userId]',
      "useInfiniteQuery",
      "fetchPreviousPage",
      "channel(`chat-${matchId}`)",
      'event: "INSERT"',
      'event: "UPDATE"',
      'event: "DELETE"',
      'rpc("mark_message_read"',
      "setPending",
      "retrySend",
      "handleDelete",
      "saveEdit",
      "replyTo",
      "findRestrictedWord",
      "getFirstMessageSuggestions",
      "pausedByCommitment",
      "authorized",
      "ConversationDrawer",
      "isOnline",
    ]) {
      expect(privateSource).toContain(contract);
    }
  });

  it("preserves community moderation, identity, stickers and typing contracts", () => {
    for (const contract of [
      'from("global_messages")',
      "COOLDOWN_MS",
      'from("message_flags")',
      "togglePin",
      "canModerateMessages",
      "RoleBadge",
      "contributor_highlight",
      "GradientName",
      "UserBadges",
      "StickerPicker",
      "StickerMessage",
      "spendCoin",
      "TypingIndicator",
      "useTypingBroadcaster",
      '_status === "failed"',
      "ConversationDrawer",
    ]) {
      expect(communitySource).toContain(contract);
    }
  });

  it("keeps the existing composer, message and accessibility behaviors", () => {
    for (const source of [privateSource, communitySource]) {
      expect(source).toContain("native-focused-chat__header");
      expect(source).toContain("native-focused-chat__messages");
      expect(source).toContain("native-focused-chat__composer");
      expect(source).toContain("maxLength={2000}");
      expect(source).toContain("text-base");
      expect(source).toContain("mobile-chat-scroll");
    }
    expect(cssSource).toContain("min-height: var(--app-visual-height, 100dvh)");
    expect(cssSource).toContain("env(safe-area-inset-bottom");
    expect(cssSource).toContain("min-height: 2.75rem");
    expect(cssSource).not.toMatch(/(^|\n)\s*(html|body|:root|\.dark)\b/);
    expect(cssSource).not.toContain("position: fixed");
  });
});
