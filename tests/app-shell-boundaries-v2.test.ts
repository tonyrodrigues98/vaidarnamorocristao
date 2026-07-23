import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src", "v2", "app-shell");
const scope = ".vdn-v2[data-vdn-v2]";

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function findClosingBrace(source: string, openingBrace: number): number {
  let depth = 1;
  for (let index = openingBrace + 1; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error("Unterminated CSS block");
}

function collectSelectors(source: string): string[] {
  const selectors: string[] = [];
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;
    const opening = source.indexOf("{", index);
    if (opening === -1) break;
    const prelude = source.slice(index, opening).trim();
    const closing = findClosingBrace(source, opening);
    const body = source.slice(opening + 1, closing);
    if (/^@media\b/.test(prelude)) selectors.push(...collectSelectors(body));
    else if (!prelude.startsWith("@")) {
      selectors.push(
        ...prelude
          .split(",")
          .map((selector) => selector.trim())
          .filter(Boolean),
      );
    }
    index = closing + 1;
  }
  return selectors;
}

const sourceFiles = walk(root).filter((path) => /\.(ts|tsx|css)$/.test(path));
const libraryFiles = sourceFiles.filter(
  (path) => !path.includes(`${join("app-shell", "showcase")}`),
);

describe("V2 App Shell architectural boundaries", () => {
  it("does not import auth, Supabase, router, product domains or environment state", () => {
    const forbidden = [
      /@\/integrations\/supabase/,
      /@\/lib\/auth/,
      /@tanstack\/react-router/,
      /@\/routes/,
      /@\/v2\/domains/,
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

  it("uses only the public Design System barrel", () => {
    for (const file of sourceFiles.filter((file) => /\.(ts|tsx)$/.test(file))) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(process.cwd(), file)).not.toMatch(/@\/v2\/design-system\//);
    }
  });

  it("keeps all public shell selectors inside the V2 theme boundary", () => {
    const css = readFileSync(join(root, "styles.css"), "utf8");
    const selectors = collectSelectors(css);

    expect(selectors.length).toBeGreaterThan(100);
    for (const selector of selectors) {
      expect(selector, `Unscoped selector: ${selector}`).toMatch(
        /^\.vdn-v2\[data-vdn-v2\](?:\.|\s)/,
      );
    }
  });

  it("keeps the public library SSR-safe at import time", () => {
    for (const file of libraryFiles.filter((path) => /\.(ts|tsx)$/.test(path))) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(process.cwd(), file)).not.toMatch(/\bwindow\./);
      expect(source, relative(process.cwd(), file)).not.toMatch(/\bdocument\./);
    }
  });

  it("keeps showcase and backend concerns out of the public barrel", () => {
    const barrel = readFileSync(join(root, "index.ts"), "utf8");
    const showcase = readFileSync(join(root, "showcase", "V2AppShellShowcase.tsx"), "utf8");
    const routeTree = readFileSync(join(process.cwd(), "src", "routeTree.gen.ts"), "utf8");

    expect(barrel).not.toContain("showcase");
    expect(showcase).toContain('from "../index"');
    expect(showcase).not.toMatch(/\b(fetch|supabase|axios)\b/i);
    expect(routeTree).not.toContain("app-shell");
  });

  it("uses no keyboard emoji as interface icons", () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const file of sourceFiles) {
      expect(readFileSync(file, "utf8"), relative(process.cwd(), file)).not.toMatch(emoji);
    }
  });
});
