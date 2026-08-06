import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { readSafeReturnTo, sanitizeInternalRedirect } from "../src/lib/safeRedirect";

const repoRoot = process.cwd();

describe("selective V1 recovery boundaries", () => {
  it("rejects external redirects and auth-loop return targets", () => {
    expect(sanitizeInternalRedirect("/perfil?tab=fotos")).toBe("/perfil?tab=fotos");
    expect(readSafeReturnTo("?returnTo=%2Fconversas%2F123")).toBe("/conversas/123");
    expect(sanitizeInternalRedirect("https://evil.example/phish")).toBe("/inicio");
    expect(sanitizeInternalRedirect("//evil.example/phish")).toBe("/inicio");
    expect(sanitizeInternalRedirect("javascript:alert(1)")).toBe("/inicio");
    expect(sanitizeInternalRedirect("/auth/login")).toBe("/inicio");
    expect(sanitizeInternalRedirect("/api/private")).toBe("/inicio");
  });

  it("does not redirect any V1 route automatically to /v2", () => {
    const files = [
      "src/routes/__root.tsx",
      "src/routes/inicio.tsx",
      "src/lib/layoutVisibility.ts",
      "public/sw.js",
    ];

    for (const file of files) {
      const source = readFileSync(join(repoRoot, file), "utf8");
      expect(source, file).not.toMatch(
        /\/inicio['"`\s)}]*[,;]?\s*(?:to|href|replace|assign).*\/v2/i,
      );
      expect(source, file).not.toMatch(/to=["'`]\/v2/);
      expect(source, file).not.toMatch(/location\.(?:href|assign|replace)\(["'`]\/v2/);
    }
  });

  it("keeps the service worker cache limited to public pet storage objects", () => {
    const source = readFileSync(join(repoRoot, "public/sw.js"), "utf8");
    expect(source).toContain("object\\/public\\/pets");
    expect(source).not.toContain("object/(sign|public|authenticated)");
    expect(source).not.toContain("object\\/sign");
    expect(source).not.toContain("object\\/authenticated");
  });

  it("sanitizes notification deep links in the service worker", () => {
    const source = readFileSync(join(repoRoot, "public/sw.js"), "utf8");
    expect(source).toContain("function safeNotificationPath");
    expect(source).toContain('!value.startsWith("/") || value.startsWith("//")');
    expect(source).toContain("url.origin !== self.location.origin");
    expect(source).toContain('return "/notificacoes"');
  });
});
