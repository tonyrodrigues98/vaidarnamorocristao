import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync("src/routes/conversas/index.tsx", "utf8");
const hookSource = readFileSync("src/hooks/useConversationsList.ts", "utf8");
const nativeSource = [
  "src/components/conversations/native/NativeConversationsView.tsx",
  "src/components/conversations/native/NativeConversationRow.tsx",
  "src/components/conversations/native/NativeCommunityConversationRow.tsx",
]
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("T46-14 native conversations inbox", () => {
  it("uses one shared data hook and selects exactly one presentation", () => {
    expect(routeSource.match(/useConversationsList\(user\?\.id\)/g)).toHaveLength(1);
    expect(routeSource).toContain("useNativeShellRuntime()");
    expect(routeSource).toContain("if (nativeShellActive)");
    expect(routeSource).toContain("<NativeConversationsView model={model} />");
    expect(routeSource).toContain("<LegacyConversationsView");
  });

  it("preserves shared cache and one refcounted channel contract", () => {
    expect(hookSource).toContain("const state: Record<string, State>");
    expect(hookSource).toContain("refs: number");
    expect(hookSource).toContain("entry.refs += 1");
    expect(hookSource).toContain("entry.refs -= 1");
    expect(hookSource).toContain("`conv-list-${userId}`");
  });

  it("keeps local search, original item order and the pinned community chat", () => {
    expect(routeSource).toContain("items.filter");
    expect(routeSource).not.toContain("filteredItems.sort");
    expect(nativeSource).toContain('to="/conversas/comunidade"');
    expect(nativeSource).toContain("Chat geral");
    expect(nativeSource).toContain("Fixado");
    expect(nativeSource).toContain('to="/conversas/$matchId"');
  });

  it("preserves real identity, unread and purpose information", () => {
    for (const contract of [
      "DecoratedAvatar",
      "OnlineDot",
      "VerifiedBadge",
      "UserBadges",
      "item.unread",
      "item.lastMessage",
      "item.lastAt",
      "CommitmentPauseCard",
    ]) {
      expect(nativeSource).toContain(contract);
    }
  });

  it("preserves loading, refresh, offline, empty and no-result states", () => {
    for (const contract of [
      "PullToRefresh",
      "model.refreshing",
      "ConversationListSkeleton",
      "OfflineState",
      "Nenhuma conversa privada ainda",
      "Nada encontrado",
    ]) {
      expect(nativeSource).toContain(contract);
    }
  });

  it("adds no backend access or realtime channel to native presentation", () => {
    expect(nativeSource).not.toMatch(/supabase|\.from\(|\.rpc\(|\.channel\(|fetch\(/);
  });

  it("keeps mobile input and interaction accessibility contracts", () => {
    expect(nativeSource).toContain('type="search"');
    expect(nativeSource).toContain("text-base");
    expect(nativeSource).toContain("min-h-11");
    expect(nativeSource).toContain("focus-visible:ring-2");
    expect(nativeSource).toContain("aria-label");
    expect(nativeSource).toContain("Mensagem não lida");
  });
});
