import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifySurfaceShell } from "../src/config/surface-shell-classification";

function generatedFullPaths(): string[] {
  const source = readFileSync("src/routeTree.gen.ts", "utf8");
  return [...source.matchAll(/fullPath: '([^']+)'/g)].map((match) => match[1]);
}

describe("generated route surface coverage", () => {
  it("classifies all generated routes", () => {
    const paths = generatedFullPaths();
    expect(paths).toHaveLength(64);
    expect(paths.filter((path) => !classifySurfaceShell(path))).toEqual([]);
  });

  it("keeps specialized surfaces out of the normal app shell", () => {
    expect(classifySurfaceShell("/admin/economia")).toBe("Admin Shell");
    expect(classifySurfaceShell("/conversas/$matchId")).toBe("Focused Messaging Shell");
    expect(classifySurfaceShell("/auth/login")).toBe("Auth Shell");
    expect(classifySurfaceShell("/onboarding/")).toBe("Onboarding Shell");
    expect(classifySurfaceShell("/api/photo-repair")).toBe("API/server");
  });

  it("does not give public pages private navigation", () => {
    expect(classifySurfaceShell("/")).toBe("Public Shell");
    expect(classifySurfaceShell("/blog/$slug")).toBe("Public Shell");
    expect(classifySurfaceShell("/manual")).toBe("Document Shell");
  });
});
