import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { nativePrimaryNavigation } from "../src/config/native-primary-navigation";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";
import { getNativeDestinationTitle } from "../src/config/native-top-bar";

describe("native storefront", () => {
  it("inherits Explore without changing the five primary tabs", () => {
    const behavior = getDestinationBehavior("/loja");
    expect(behavior.futureTab).toBe("explore");
    expect(getNativeSecondaryDestinationChrome(behavior.destinationId)).toEqual({
      destinationId: "app-store",
      title: "Loja",
      parentTab: "explore",
      parentPath: "/explorar",
    });
    expect(getNativeDestinationTitle(behavior.destinationId, "explore")).toBe("Loja");
    expect(nativePrimaryNavigation).toHaveLength(5);
  });

  it("preserves exact query keys and one owner for every query", () => {
    const route = readFileSync("src/routes/loja.tsx", "utf8");
    for (const key of [
      "shop-catalog",
      "user-balance",
      "user-decoration-inventory",
      "user-background-inventory",
      "user-name-gradient-inventory",
      "shop-equipped-items",
      "freebie-status",
    ]) {
      expect(route).toContain(`"${key}"`);
    }
    expect(route).toContain("useNativeShellRuntime()");
    expect(route).toContain("<NativeStoreHeader");
    expect(route.match(/fetchDecorationCatalog/g)).toHaveLength(2);
    expect(route.match(/fetchProfileBackgroundCatalog/g)).toHaveLength(2);
    expect(route.match(/fetchNameGradientCatalog/g)).toHaveLength(2);
  });

  it("keeps the existing economy operations and a backend-free native header", () => {
    const route = readFileSync("src/routes/loja.tsx", "utf8");
    const view = readFileSync("src/components/store/native/NativeStoreHeader.tsx", "utf8");
    for (const operation of [
      "purchaseDecoration",
      "equipDecoration",
      "unequipDecoration",
      "purchaseProfileBackground",
      "equipProfileBackground",
      "unequipProfileBackground",
      "purchaseNameGradient",
      "equipNameGradient",
      "unequipNameGradient",
      "claimFreebie",
      "canClaimFreebie",
    ]) {
      expect(route).toContain(operation);
    }
    for (const label of ["Todos", "Molduras", "Auras", "Fundos", "Gradientes", "Inventário"]) {
      expect(route).toContain(`label: "${label}"`);
    }
    expect(view).toContain("balanceKnown");
    expect(view).toContain("aria-pressed={active}");
    expect(view).not.toMatch(/supabase|useQuery|useMutation|fetch\(|@\/v2/);
  });
});
