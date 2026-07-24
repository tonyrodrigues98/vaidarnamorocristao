import fs from "node:fs";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import type { ProfileRepository } from "../src/v2/features/profile/contracts";
import { V2Profile } from "../src/v2/features/profile/V2Profile";

const root = process.cwd();
const runtime = fs.readFileSync(
  path.join(root, "src/v2/integration/V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const presentation = fs.readFileSync(
  path.join(root, "src/v2/features/profile/V2Profile.tsx"),
  "utf8",
);
const repositorySource = fs.readFileSync(
  path.join(root, "src/v2/features/profile/repository.ts"),
  "utf8",
);
const styles = fs.readFileSync(path.join(root, "src/v2/features/profile/styles.css"), "utf8");

const repository: ProfileRepository = {
  async loadProfile() {
    return {
      identity: {
        displayName: "Ana",
        photoUrl: null,
        bio: "",
        city: null,
        state: null,
        church: null,
        yearsBaptized: null,
        verified: false,
        presence: "offline",
      },
      appearance: {
        backgroundUrl: null,
        frameUrl: null,
        auraUrl: null,
        nameGradient: null,
      },
      modules: [],
      owner: true,
      configurationUpdatedAt: null,
    };
  },
  async saveModules() {
    return "2026-07-23T12:00:00.000Z";
  },
};

describe("V2-013 modular profile boundaries", () => {
  it("mounts only behind the canonical profile feature flag", () => {
    expect(runtime).toContain('v2FeatureFlags.profile && route?.slug === "perfil"');
    expect(runtime).toContain("<V2ProfileFeature");
  });

  it("renders SSR-safe without exposing session data", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { enabled: false, retry: false } },
    });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <V2ThemeScope>
          <V2Profile userId="user-a" repository={repository} />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando perfil");
    expect(html).not.toMatch(/access_token|refresh_token|email|phone/i);
  });

  it("keeps Supabase and concrete auth out of presentation components", () => {
    expect(presentation).not.toMatch(/@\/integrations\/supabase|@\/lib\/auth|getSession/i);
    expect(repositorySource).toContain("@/integrations/supabase/client");
    expect(repositorySource).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("keeps every public feature selector inside the V2 boundary", () => {
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

  it("keeps inventory, privacy and romance boundaries explicit", () => {
    expect(repositorySource).toContain("inventoryRemainsAuthoritative: true");
    expect(repositorySource).toContain("romanticFieldsInCommunityPayload: false");
    expect(repositorySource).toContain("appliesPrivacyServerSide: true");
    expect(repositorySource).toContain("presentationReceivesSession: false");
  });
});
