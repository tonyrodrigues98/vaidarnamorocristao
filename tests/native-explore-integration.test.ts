import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { nativeExploreRegistry } from "../src/config/native-explore-registry";
import {
  parseNativeExploreRecent,
  readNativeExploreRecent,
  recordNativeExploreRecent,
} from "../src/lib/native-explore-recent";

const routeSource = readFileSync("src/routes/explorar.tsx", "utf8");
const cardSource = readFileSync("src/components/explore/native/NativeExploreCard.tsx", "utf8");
const continueSource = readFileSync(
  "src/components/explore/native/NativeExploreContinue.tsx",
  "utf8",
);
const routeTree = readFileSync("src/routeTree.gen.ts", "utf8");

function storage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
    value: () => value,
  };
}

describe("T46-13 native explore integration", () => {
  it("preserves flag-off redirect, approval gate and private metadata", () => {
    expect(routeSource).toContain('<Navigate to="/inicio" replace />');
    expect(routeSource).toContain("<RequireApproved>");
    expect(routeSource).toContain("createPrivatePageMetadata");
  });

  it("defines unique serializable registry entries backed by real routes", () => {
    expect(new Set(nativeExploreRegistry.map((item) => item.id)).size).toBe(
      nativeExploreRegistry.length,
    );
    expect(new Set(nativeExploreRegistry.map((item) => item.path)).size).toBe(
      nativeExploreRegistry.length,
    );
    const fullPaths = new Set(
      [...routeTree.matchAll(/fullPath:\s*'([^']+)'/g)].map((match) => match[1]),
    );
    for (const item of nativeExploreRegistry) {
      expect(fullPaths.has(item.path) || fullPaths.has(`${item.path}/`)).toBe(true);
      expect(JSON.parse(JSON.stringify(item))).toEqual(item);
    }
  });

  it("contains only the approved experiences and discoveries", () => {
    expect(nativeExploreRegistry.map((item) => item.path)).toEqual([
      "/devocional",
      "/meu-pet",
      "/pet-arcade",
      "/quiz-biblico",
      "/loja",
      "/avatar",
      "/caixas",
      "/conquistas",
      "/noticias",
      "/oracoes",
      "/pretendentes",
      "/",
    ]);
    expect(JSON.stringify(nativeExploreRegistry)).not.toMatch(/cinema|verbo|pessoas/i);
    expect(nativeExploreRegistry.find((item) => item.path === "/pretendentes")).toMatchObject({
      relationshipOptional: true,
    });
  });

  it("returns an honest empty history and ignores invalid persisted values", () => {
    expect(parseNativeExploreRecent(null)).toEqual([]);
    expect(parseNativeExploreRecent("broken")).toEqual([]);
    expect(parseNativeExploreRecent('{"not":"an array"}')).toEqual([]);
    expect(
      parseNativeExploreRecent(
        JSON.stringify([
          { id: "unknown", visitedAt: 5 },
          { id: "devotional", visitedAt: "invalid" },
        ]),
      ),
    ).toEqual([]);
    expect(continueSource).toContain("Suas experiências acessadas recentemente aparecerão aqui.");
  });

  it("records most recent first, deduplicates and limits history to five", () => {
    const memory = storage();
    for (const [index, item] of nativeExploreRegistry.slice(0, 6).entries()) {
      recordNativeExploreRecent(memory, item.id, index + 1);
    }
    expect(readNativeExploreRecent(memory).map((entry) => entry.id)).toEqual([
      nativeExploreRegistry[5].id,
      nativeExploreRegistry[4].id,
      nativeExploreRegistry[3].id,
      nativeExploreRegistry[2].id,
      nativeExploreRegistry[1].id,
    ]);
    recordNativeExploreRecent(memory, nativeExploreRegistry[3].id, 10);
    const deduplicated = readNativeExploreRecent(memory);
    expect(deduplicated[0].id).toBe(nativeExploreRegistry[3].id);
    expect(deduplicated.filter((entry) => entry.id === nativeExploreRegistry[3].id)).toHaveLength(
      1,
    );
    expect(memory.value()).toContain(nativeExploreRegistry[3].id);
  });

  it("tolerates unavailable storage without throwing", () => {
    const unavailable = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
    };
    expect(readNativeExploreRecent(unavailable)).toEqual([]);
    expect(() => recordNativeExploreRecent(unavailable, "devotional", 1)).not.toThrow();
    expect(recordNativeExploreRecent(undefined, "devotional", 1)).toEqual([]);
  });

  it("records on normal router links without backend, mocks or remote images", () => {
    expect(cardSource).toContain("recordNativeExploreRecent");
    expect(cardSource).toContain("<Link");
    expect(routeSource + cardSource + continueSource).not.toMatch(
      /supabase|\.from\(|\.rpc\(|\.channel\(|fetch\(|https?:\/\/|mock/i,
    );
  });

  it("keeps compact responsive and theme-safe presentation", () => {
    expect(routeSource).toContain("max-w-[1040px]");
    expect(routeSource).toContain('title="Continuar"');
    expect(routeSource).toContain('title="Experiências"');
    expect(routeSource).toContain('title="Descobertas"');
    expect(cardSource).toContain("min-h-11");
    expect(cardSource).toContain("bg-card");
    expect(cardSource).toContain("text-foreground");
  });
});
