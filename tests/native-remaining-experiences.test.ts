import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";
import { isNativeShellEligibleDestination } from "../src/config/native-shell-feature";

describe("remaining native experiences", () => {
  it.each([
    ["/avatar", "app-avatar", "Avatar"],
    ["/avatar/criar", "app-avatar-create", "Criar avatar"],
    ["/caixas", "app-boxes", "Caixas"],
    ["/conquistas", "app-achievements", "Conquistas"],
    ["/presentes", "app-gifts", "Presentes"],
  ])("classifies %s as an Explore child", (path, id, title) => {
    const behavior = getDestinationBehavior(path);
    expect(behavior).toMatchObject({ destinationId: id, futureTab: "explore" });
    expect(isNativeShellEligibleDestination(behavior)).toBe(true);
    expect(getNativeSecondaryDestinationChrome(id)).toMatchObject({
      title,
      parentTab: "explore",
      parentPath: "/explorar",
    });
  });

  it("preserves avatar hydration and its 400 ms autosave", () => {
    const avatar = readFileSync("src/routes/avatar.tsx", "utf8");
    expect(avatar).toContain('from("user_avatar_base")');
    expect(avatar).toContain("}, 400)");
    expect(readFileSync("src/routes/avatar.criar.tsx", "utf8")).toContain(
      'from("user_avatar_base")',
    );
  });

  it("preserves boxes odds operations and achievements progress", () => {
    const boxes = readFileSync("src/routes/caixas.tsx", "utf8");
    for (const contract of ["getGrabState", "performGrab", "performGrabMulti", "resolvePrize"])
      expect(boxes).toContain(contract);

    const achievements = readFileSync("src/routes/conquistas.tsx", "utf8");
    expect(achievements).toContain("getMyXpState");
    expect(achievements).toContain("pet_achievements");
    expect(achievements).toContain("user_achievements");
  });

  it("requires the real gift receiver and preserves the virtual balance", () => {
    const gifts = readFileSync("src/routes/presentes/index.tsx", "utf8");
    expect(gifts).toContain("listGifts");
    expect(gifts).toContain("getMyCoins");
    expect(gifts).toContain("to: z.string().uuid().optional()");
    expect(gifts).toContain("receiverId={search.to ?? null}");
  });
});
