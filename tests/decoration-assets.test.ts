import { describe, expect, it } from "vitest";

import { assetFor } from "../src/lib/decorations";

const legacyDecorationUrls = [
  "/__l5e/assets-v1/30fd65c5-9344-46fd-93c2-5734a3aef67b/1780541586042-87676868766.png",
  "/__l5e/assets-v1/78b7eff2-cc7a-474f-8742-c0b39d4837f9/constelacao-amor.png",
] as const;

describe("decoration asset provenance", () => {
  it.each(legacyDecorationUrls)("bundles %s instead of using the Lovable runtime", (imageUrl) => {
    const resolved = assetFor({ image_url: imageUrl });

    expect(resolved).toBeTruthy();
    expect(resolved).not.toContain("/__l5e/assets-v1/");
  });
});
