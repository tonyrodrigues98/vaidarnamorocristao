import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const visualDirectories = [
  "src/assets",
  "src/components",
  "src/config",
  "src/data",
  "src/prototype-01",
  "src/styles",
];

describe("structural zero", () => {
  it.each(visualDirectories)("removes files from %s", async (directory) => {
    const files = await readdir(directory, { recursive: true }).catch(() => []);
    expect(files.filter((entry) => /\.[^/\\]+$/.test(String(entry)))).toEqual([]);
  });

  it("keeps the root free of styling contracts", async () => {
    const root = await readFile("src/routes/__root.tsx", "utf8");
    expect(root).not.toMatch(/className=|style=|\.css/);
  });

  it("keeps only raw structural markup at the index", async () => {
    const index = await readFile("src/routes/index.tsx", "utf8");
    expect(index).toContain("Fundação estrutural sem camada visual.");
    expect(index).not.toMatch(/className=|style=|\.css/);
  });
});
