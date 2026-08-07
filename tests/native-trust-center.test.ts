import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior, plannedPrimaryDestinations } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";

describe("native trust center", () => {
  it.each([
    ["/verificacao", "app-verification", "Verificação"],
    ["/bloqueados", "app-blocked-users", "Bloqueados"],
    ["/dashboard", "app-dashboard", "Insights"],
  ])("maps %s to Profile with contextual title", (pathname, id, title) => {
    const behavior = getDestinationBehavior(pathname);
    expect(behavior.destinationId).toBe(id);
    expect(behavior.futureTab).toBe("profile");
    expect(getNativeSecondaryDestinationChrome(id)).toMatchObject({
      title,
      parentTab: "profile",
      parentPath: "/perfil",
    });
    expect(plannedPrimaryDestinations).toHaveLength(5);
  });

  it("preserves verification storage, status and size contracts", () => {
    const source = readFileSync("src/routes/verificacao.tsx", "utf8");
    for (const contract of [
      'from("verification_requests")',
      'from("verifications")',
      "8 * 1024 * 1024",
      'capture="user"',
      'from("profiles")',
    ])
      expect(source).toContain(contract);
  });

  it("preserves blocked users and dashboard data layers", () => {
    const blocked = readFileSync("src/routes/bloqueados.tsx", "utf8");
    expect(blocked).toContain('["blocked-users", user?.id]');
    expect(blocked).toContain('from("blocks")');

    const dashboard = readFileSync("src/routes/dashboard.tsx", "utf8");
    for (const key of ["dashboard-profile", "dashboard-latest-news", "dashboard-metrics"]) {
      expect(dashboard).toContain(key);
    }
    for (const period of ["7d", "30d", "90d", "all"]) expect(dashboard).toContain(period);
  });
});
