import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("V2-009 identity integration boundary", () => {
  const authSource = readFileSync(resolve("src/lib/auth.tsx"), "utf8");
  const runtimeSource = readFileSync(resolve("src/v2/integration/V2ShellRuntimeRoute.tsx"), "utf8");
  const identitySource = readFileSync(
    resolve("src/v2/platform/identity/identity-access.ts"),
    "utf8",
  );

  it("loads identity facts only after the canonical authenticated user is known", () => {
    expect(authSource).toMatch(/supabase\s*\.from\("user_roles"\)/);
    expect(authSource).toMatch(/supabase\s*\.from\("profiles"\)/);
    expect(authSource).toMatch(/supabase\s*\.rpc\("get_my_terms_status"\)/);
    expect(authSource).toContain("currentUserId.current !== uid");
    expect(authSource).toContain("identityResolvedForUserId === auth.user.id");
  });

  it("publishes one canonical identity snapshot without exposing credentials", () => {
    expect(authSource).toContain("identity: IdentityAccessSnapshot");
    expect(authSource).toContain("resolveIdentityAccess");
    expect(identitySource).not.toMatch(/@\/integrations\/supabase|import\.meta\.env|process\.env/);
    expect(identitySource).not.toMatch(/\b(session|access_token|refresh_token|email|phone)\b/i);
  });

  it("uses capabilities in the V2 runtime without replacing backend authorization", () => {
    expect(runtimeSource).toContain("identity.canEnter(route.requiredDomain)");
    expect(runtimeSource).toContain("getV2RuntimeNavigation(identity.canEnter)");
    expect(runtimeSource).not.toContain("supabase");
    expect(runtimeSource).not.toContain("VITE_");
  });

  it("keeps romantic access closed until an explicit persisted opt-in exists", () => {
    expect(authSource).toContain('datingState: "inactive"');
    expect(identitySource).toContain('input.datingState ?? "inactive"');
    expect(identitySource).toContain('=== "active"');
    expect(identitySource).not.toMatch(/datingState\s*:\s*["']active["']/);
  });
});
