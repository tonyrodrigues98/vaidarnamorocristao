import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const publicSurfaceFiles = [
  "src/routes/index.tsx",
  "src/routes/sobre.tsx",
  "src/routes/como-funciona.tsx",
  "src/routes/depoimentos.tsx",
  "src/routes/blog.index.tsx",
  "src/routes/blog.$slug.tsx",
  "src/routes/instalar.tsx",
  "src/components/PublicNav.tsx",
  "src/components/shells/PublicShell.tsx",
  "src/components/home/CarenLiveHero.tsx",
] as const;

describe("self-contained public assets", () => {
  it("keeps the production public-surface __l5e allowlist empty", () => {
    for (const file of publicSurfaceFiles) {
      expect(readFileSync(file, "utf8"), file).not.toContain("/__l5e/assets-v1/");
    }
  });

  it("bundles the verified Caren hero bytes locally", () => {
    const component = readFileSync("src/components/home/CarenLiveHero.tsx", "utf8");
    const assetPath = "src/assets/public/caren-hero.jpeg";

    expect(component).toContain("@/assets/public/caren-hero.jpeg");
    expect(component).not.toContain("caren-hero.jpeg.asset.json");
    expect(existsSync(assetPath)).toBe(true);
    expect(readFileSync(assetPath).subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    expect(readFileSync(assetPath).byteLength).toBe(173_798);
  });
});
