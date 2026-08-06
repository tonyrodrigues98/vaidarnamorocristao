import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const designSystemRoot = join(process.cwd(), "src", "v2", "design-system");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = walk(designSystemRoot).filter((path) => /\.(ts|tsx|css)$/.test(path));
const publicLibraryFiles = sourceFiles.filter(
  (path) => !path.includes(`${join("showcase", "main.tsx")}`) && !path.endsWith("showcase.css"),
);

describe("V2 design-system architectural boundaries", () => {
  it("does not import platform, product, auth, router or environment concerns", () => {
    const forbidden = [
      /@\/integrations\/supabase/,
      /@\/lib\/auth/,
      /@tanstack\/react-router/,
      /@\/routes/,
      /@\/domains/,
      /service_role/i,
      /process\.env/,
      /import\.meta\.env/,
    ];

    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(source, `${relative(process.cwd(), file)} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps the public library import SSR-safe", () => {
    for (const file of publicLibraryFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(process.cwd(), file)).not.toMatch(/\bwindow\./);
      expect(source, relative(process.cwd(), file)).not.toMatch(/\bdocument\./);
    }
  });

  it("keeps the showcase outside routes and the public barrel", () => {
    const barrel = readFileSync(join(designSystemRoot, "index.ts"), "utf8");
    const showcase = readFileSync(
      join(designSystemRoot, "showcase", "V2DesignSystemShowcase.tsx"),
      "utf8",
    );

    expect(barrel).not.toContain("showcase");
    expect(showcase).toContain('from "../index"');
    expect(sourceFiles.some((path) => path.includes(`${join("src", "routes")}`))).toBe(false);
  });

  it("uses no keyboard emoji as interface icons", () => {
    const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const file of sourceFiles) {
      expect(readFileSync(file, "utf8"), relative(process.cwd(), file)).not.toMatch(emojiPattern);
    }
  });
});
