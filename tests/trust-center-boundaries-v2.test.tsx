import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { V2TrustCenterFeature, type TrustCenterRepository } from "../src/v2/features/trust";
import { getV2RuntimeRoute } from "../src/v2/integration/route-registry";

const repository: TrustCenterRepository = {
  async loadCenter() {
    return {
      notifications: [],
      preferences: [],
      supportTickets: [],
      unreadCount: 0,
      blockedCount: 0,
      mutedCount: 0,
      photoVerification: "not-started",
    };
  },
  async markRead() {},
  async savePreference() {},
};

describe("V2-020 Trust Center presentation boundaries", () => {
  it("uses the canonical runtime registry", () => {
    expect(getV2RuntimeRoute("central")).toMatchObject({
      navigationId: "trust",
      requiredDomain: "trust",
      width: "wide",
    });
  });

  it("renders SSR-safe loading without a real backend", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <V2TrustCenterFeature userId="user-1" repository={repository} />
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando sua Central");
    expect(html).not.toMatch(/access_token|refresh_token|service_role|support-attachments/i);
  });

  it("keeps CSS scoped to the V2 boundary", () => {
    const css = readFileSync(
      new URL("../src/v2/features/trust/styles.css", import.meta.url),
      "utf8",
    );
    expect(css).toContain(".vdn-v2[data-vdn-v2] .vdn-v2-trust");
    expect(css).not.toMatch(/(^|[},]\s*)(:root|html|body)(?=[\s,{])/m);
  });

  it("does not import service worker, push dispatch or server-side moderation into presentation", () => {
    const source = readFileSync(
      new URL("../src/v2/features/trust/V2TrustCenter.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/service-worker|push-dispatch|photoModerationPolicy|service_role/i);
  });
});
