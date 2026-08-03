import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getDestinationBehavior } from "../src/config/app-destinations";

function generatedFullPaths(): string[] {
  const source = readFileSync("src/routeTree.gen.ts", "utf8");
  return [...source.matchAll(/fullPath: '([^']+)'/g)].map((match) => match[1]);
}

describe("total redesign functional freeze", () => {
  it("keeps all 69 generated routes", () => {
    expect(generatedFullPaths()).toHaveLength(69);
  });

  it("keeps the visual runtime free of endpoints, mocks, and direct backend access", () => {
    const files = readdirSync("src/components/redesign-total", { recursive: true })
      .filter((entry) => typeof entry === "string" && entry.endsWith(".tsx"))
      .map((entry) => `src/components/redesign-total/${entry.replaceAll("\\", "/")}`);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/src\/routes\/api|\/api\//);
      expect(source).not.toMatch(/mock|fixture/i);
      expect(source).not.toMatch(/service[_-]?role/i);
    }
  });

  it("keeps focused messaging outside the redesigned bottom navigation", () => {
    const behavior = getDestinationBehavior("/conversas/teste");
    expect(behavior.shell).toBe("focused");
    expect(behavior.futureTab).toBe("messages");
  });
});
