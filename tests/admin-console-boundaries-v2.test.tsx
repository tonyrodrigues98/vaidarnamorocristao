import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { V2AdminFeature, type AdminConsoleRepository } from "../src/v2/features/admin";
import { getV2RuntimeRoute } from "../src/v2/integration/route-registry";

const repository: AdminConsoleRepository = {
  async loadDashboard() {
    return {
      serverNow: "2026-07-23T12:00:00Z",
      metrics: [],
      recentAuditCount: 0,
      dataFreshness: "live",
    };
  },
};

describe("V2-021 Admin presentation boundaries", () => {
  it("uses the existing Admin domain guard", () => {
    expect(getV2RuntimeRoute("admin")).toMatchObject({
      navigationId: "admin",
      requiredDomain: "admin",
      width: "fluid",
    });
  });

  it("is SSR-safe and receives only a bounded role", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <V2AdminFeature role="admin" repository={repository} />
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando saúde operacional");
    expect(html).not.toMatch(/access_token|refresh_token|service_role|@supabase/i);
  });

  it("lazy-loads the selected module", () => {
    const source = readFileSync(
      new URL("../src/v2/features/admin/V2AdminConsole.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('lazy(() => import("./V2AdminModulePanel"))');
  });

  it("keeps the Admin CSS scoped", () => {
    const css = readFileSync(
      new URL("../src/v2/features/admin/styles.css", import.meta.url),
      "utf8",
    );
    expect(css).toContain(".vdn-v2[data-vdn-v2] .vdn-v2-admin");
    expect(css).not.toMatch(/(^|[},]\s*)(:root|html|body)(?=[\s,{])/m);
  });
});
