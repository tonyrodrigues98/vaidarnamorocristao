import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";
import { getNativeDestinationTitle } from "../src/config/native-top-bar";

const gameTypes = [
  "treasure",
  "flight",
  "plinko",
  "keno",
  "wheel",
  "hilo",
  "towers",
  "coinflip",
  "race",
  "memory",
  "piggybank",
  "dice",
  "scratch",
  "egg",
  "album",
  "capsule",
  "missions",
] as const;

describe("native pet arcade", () => {
  it("inherits Explore with contextual chrome", () => {
    const behavior = getDestinationBehavior("/pet-arcade");
    expect(behavior.futureTab).toBe("explore");
    expect(getNativeSecondaryDestinationChrome(behavior.destinationId)).toEqual({
      destinationId: "app-pet-arcade",
      title: "Arcade",
      parentTab: "explore",
      parentPath: "/explorar",
    });
    expect(getNativeDestinationTitle(behavior.destinationId, "explore")).toBe("Arcade");
  });

  it("preserves all 17 catalog game types and their real components", () => {
    const route = readFileSync("src/routes/pet-arcade.tsx", "utf8");
    expect(gameTypes).toHaveLength(17);
    for (const type of gameTypes) expect(route).toContain(`${type}:`);
    for (const component of [
      "TreasureAdventure",
      "StellarFlight",
      "PlinkoGame",
      "KenoGame",
      "WheelGame",
      "HiloGame",
      "TowersGame",
      "CoinFlipGame",
      "PetRaceGame",
      "MemoryGame",
      "PiggyBankGame",
      "DiceGame",
      "ScratchGame",
      "SurpriseEggGame",
      "PetAlbumGame",
      "CapsuleGame",
      "DailyMissionsGame",
    ]) {
      expect(route).toContain(`<${component}`);
    }
  });

  it("keeps the route as the single data and game-state owner", () => {
    const route = readFileSync("src/routes/pet-arcade.tsx", "utf8");
    expect(route.match(/myPetV2QueryOptions\(user\?\.id\)/g)).toHaveLength(1);
    for (const key of [
      '["pet-arcade", "legacy-config"]',
      '["pet-arcade", "catalog"]',
      '["coins", "mine"]',
      '["pet-arcade", "history-v2"]',
      '["pet-arcade", "usage-today"]',
      '["pet-arcade", "history"]',
      '["pet-arcade", "active"]',
    ]) {
      expect(route).toContain(key);
    }
    expect(route).toContain("const [selectedGame, setSelectedGame]");
    expect(route).toContain("data-vdn-native-arcade-playing");

    const header = readFileSync("src/components/pet/arcade/native/NativeArcadeHeader.tsx", "utf8");
    expect(header).not.toMatch(/supabase|useQuery|useMutation|fetch\(|@\/v2/);
  });
});
