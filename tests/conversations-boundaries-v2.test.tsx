import fs from "node:fs";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import type { ConversationRepository } from "../src/v2/features/conversations/contracts";
import { V2Conversations } from "../src/v2/features/conversations/V2Conversations";

const root = process.cwd();
const runtime = fs.readFileSync(
  path.join(root, "src/v2/integration/V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const presentation = fs.readFileSync(
  path.join(root, "src/v2/features/conversations/V2Conversations.tsx"),
  "utf8",
);
const repositorySource = fs.readFileSync(
  path.join(root, "src/v2/features/conversations/repository.ts"),
  "utf8",
);
const styles = fs.readFileSync(path.join(root, "src/v2/features/conversations/styles.css"), "utf8");

const repository: ConversationRepository = {
  async loadInbox() {
    return [];
  },
  async loadMessages() {
    return { items: [], nextCursor: null, hasMore: false };
  },
  async sendMessage() {
    throw new Error("not called");
  },
  async markRead() {},
  async updateThreadPreference() {},
  async respondToRequest() {},
  subscribe() {
    return () => {};
  },
};

describe("V2-012 conversation presentation boundaries", () => {
  it("mounts only behind the canonical messaging flag", () => {
    expect(runtime).toContain('v2FeatureFlags.messaging && route?.slug === "conversas"');
    expect(runtime).toContain("<V2ConversationsFeature");
  });

  it("renders SSR-safe without exposing a session or calling the backend on import", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { enabled: false, retry: false } },
    });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <V2ThemeScope>
          <V2Conversations userId="user-a" repository={repository} storage={null} />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando conversas");
    expect(html).not.toMatch(/access_token|refresh_token|email/i);
  });

  it("keeps Supabase in the adapter instead of the presentation", () => {
    expect(presentation).not.toMatch(/supabase|@\/lib\/auth|getSession|dating_memberships/i);
    expect(repositorySource).toContain("@/integrations/supabase/client");
  });

  it("owns one Realtime channel with cleanup for each selected thread", () => {
    expect(repositorySource).toContain("maximumChannelsPerThread: 1");
    expect(repositorySource).toContain("removeChannel");
    expect(repositorySource.match(/supabase\.channel/g)).toHaveLength(1);
  });

  it("keeps every public stylesheet selector inside the V2 scope", () => {
    const selectorBlocks = styles
      .split("{")
      .slice(0, -1)
      .map((part) => part.slice(part.lastIndexOf("}") + 1).trim())
      .filter((selector) => selector && !selector.startsWith("@"));
    for (const selector of selectorBlocks) {
      for (const item of selector.split(",")) {
        expect(item.trim()).toMatch(/^\.vdn-v2\[data-vdn-v2\]/);
      }
    }
    expect(styles).not.toMatch(/(?:^|})\s*(?::root|html|body)\b/);
  });
});
