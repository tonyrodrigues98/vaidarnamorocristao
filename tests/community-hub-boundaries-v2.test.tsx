import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import { V2CommunityHub } from "../src/v2/features/community/V2CommunityHub";
import type { CommunityHubRepository } from "../src/v2/features/community/contracts";

const root = process.cwd();
const runtime = fs.readFileSync(
  path.join(root, "src/v2/integration/V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const styles = fs.readFileSync(path.join(root, "src/v2/features/community/styles.css"), "utf8");

const repository: CommunityHubRepository = {
  async loadHub() {
    return { spaces: [], events: [], messages: [], presence: [] };
  },
  async requestMembership() {
    return "active";
  },
  async leaveSpace() {},
  async respondMembership() {},
  async attendEvent() {},
  async sendGlobalMessage() {},
  subscribeToGlobalMessages() {
    return () => {};
  },
};

describe("V2-011 community presentation boundaries", () => {
  it("mounts the real hub only behind the canonical community flag", () => {
    expect(runtime).toMatch(/v2FeatureFlags\.community && route\?*\.slug === "comunidade"/);
    expect(runtime).toContain("<V2CommunityHubFeature");
  });

  it("renders SSR-safe without a browser or backend call during import", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { enabled: false, retry: false } },
    });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <V2ThemeScope>
          <V2CommunityHub userId="user-1" repository={repository} />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando Comunidade");
    expect(html).not.toContain("access_token");
  });

  it("keeps every public stylesheet selector inside the V2 theme scope", () => {
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
  });

  it("does not let the visual module import Supabase, auth or dating", () => {
    const presentation = fs.readFileSync(
      path.join(root, "src/v2/features/community/V2CommunityHub.tsx"),
      "utf8",
    );
    expect(presentation).not.toMatch(/supabase|@\/lib\/auth|getSession|matches|dating/i);
  });

  it("keeps the migration unapplied and product code free of operational jobs", () => {
    const migration = fs.readFileSync(
      path.join(root, "supabase/migrations/20260723000006_v2_community_spaces_events.sql"),
      "utf8",
    );
    expect(migration).not.toMatch(/\bcron\./i);
    expect(migration).not.toMatch(/\bnet\.http/i);
    expect(migration).not.toContain("DROP POLICY");
  });
});
