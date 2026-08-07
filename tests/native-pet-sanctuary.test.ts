import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";
import { getNativeDestinationTitle } from "../src/config/native-top-bar";

describe("native pet sanctuary", () => {
  it("inherits Explore with contextual chrome", () => {
    const behavior = getDestinationBehavior("/meu-pet");
    expect(behavior.futureTab).toBe("explore");
    expect(getNativeSecondaryDestinationChrome(behavior.destinationId)).toEqual({
      destinationId: "app-pet",
      title: "Meu Pet",
      parentTab: "explore",
      parentPath: "/explorar",
    });
    expect(getNativeDestinationTitle(behavior.destinationId, "explore")).toBe("Meu Pet");
  });

  it("keeps one pet query and one Showcase shared by both presentations", () => {
    const route = readFileSync("src/routes/meu-pet.tsx", "utf8");
    expect(route.match(/managedPetQueryOptions\(user\?\.id\)/g)).toHaveLength(1);
    expect(route.match(/<Showcase/g)).toHaveLength(1);
    expect(route).toContain("const petContent =");
    expect(route).toContain("nativeShellActive");
    expect(route).toContain("<NativePetRoot>");
  });

  it("preserves wizard, care, progression, expeditions and destinations", () => {
    const route = readFileSync("src/routes/meu-pet.tsx", "utf8");
    for (const contract of [
      "<Wizard",
      "PetLivingRoom",
      "PetSceneryPanel",
      "PetNeedsHud",
      "PetBuffsHud",
      "PetRadialMenu",
      "PetCareActionSheet",
      "PetCareHistorySheet",
      "PetProgressionCard",
      "PetEvolutionCard",
      "ExpeditionsCard",
      "MissionsTodayCard",
      "PetWeeklyChestCard",
      'to="/pet-arcade"',
      "PetCaixasEntryCard",
      'window.localStorage.getItem("meuPet:viewMode")',
    ]) {
      expect(route).toContain(contract);
    }
    const root = readFileSync("src/components/pet/native/NativePetRoot.tsx", "utf8");
    expect(root).not.toMatch(/supabase|useQuery|useMutation|setInterval|setTimeout/);
  });
});
