import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior, plannedPrimaryDestinations } from "../src/config/app-destinations";
import {
  isNativeDatingNavigationItemActive,
  nativeDatingNavigation,
} from "../src/config/native-dating-navigation";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";

describe("native optional dating mode", () => {
  it("classifies the root and detail separately under Explore", () => {
    expect(getDestinationBehavior("/pretendentes").destinationId).toBe("app-dating");
    expect(getDestinationBehavior("/pretendentes/teste").destinationId).toBe("app-dating-profile");
    for (const pathname of [
      "/pretendentes",
      "/pretendentes/teste",
      "/interesses",
      "/matches",
      "/recados",
    ]) {
      expect(getDestinationBehavior(pathname).futureTab).toBe("explore");
    }
    expect(plannedPrimaryDestinations).toHaveLength(5);
  });

  it("provides contextual titles and real parent paths", () => {
    expect(getNativeSecondaryDestinationChrome("app-dating")?.title).toBe("Namoro");
    expect(getNativeSecondaryDestinationChrome("app-dating-profile")).toMatchObject({
      title: "Perfil",
      parentPath: "/pretendentes",
    });
    expect(getNativeSecondaryDestinationChrome("app-interests")?.title).toBe("Interesses");
    expect(getNativeSecondaryDestinationChrome("app-matches")?.title).toBe("Matches");
    expect(getNativeSecondaryDestinationChrome("app-anonymous-notes")?.title).toBe("Recados");
  });

  it("uses four real, accessible local destinations", () => {
    expect(nativeDatingNavigation).toEqual([
      { id: "discover", label: "Descobrir", path: "/pretendentes" },
      { id: "interests", label: "Interesses", path: "/interesses" },
      { id: "matches", label: "Matches", path: "/matches" },
      { id: "notes", label: "Recados", path: "/recados" },
    ]);
    expect(isNativeDatingNavigationItemActive(nativeDatingNavigation[0], "/pretendentes/id")).toBe(
      true,
    );
    expect(isNativeDatingNavigationItemActive(nativeDatingNavigation[1], "/matches")).toBe(false);

    const component = readFileSync(
      "src/components/dating/native/NativeDatingNavigation.tsx",
      "utf8",
    );
    expect(component).toContain('aria-current={selected ? "page" : undefined}');
    expect(component).toContain("min-h-11");
    expect(component).not.toMatch(/supabase|useQuery|useMutation|fetch\(|badge/);
  });

  it("mounts the local navigation without adding a second data layer", () => {
    for (const routePath of [
      "src/routes/pretendentes/index.tsx",
      "src/routes/pretendentes/$id.tsx",
      "src/routes/interesses.tsx",
      "src/routes/matches.tsx",
      "src/routes/recados.tsx",
    ]) {
      expect(readFileSync(routePath, "utf8")).toContain("<NativeDatingNavigation />");
    }

    const list = readFileSync("src/routes/pretendentes/index.tsx", "utf8");
    expect(list.match(/\["pretendentes", user\?\.id, isSuperAdmin\]/g)).toHaveLength(1);
    expect(list).toContain("nativeShellActive ?");
    expect(list).toContain("showScore={false}");
    expect(list).toContain("chips={affinityByProfile[profile.id] ?? []}");

    expect(readFileSync("src/routes/interesses.tsx", "utf8")).toContain(
      '.channel("interests-page")',
    );
    expect(readFileSync("src/routes/matches.tsx", "utf8")).toContain('.channel("matches-list")');
    expect(readFileSync("src/routes/recados.tsx", "utf8")).toContain(
      ".channel(`recados-${user.id}`)",
    );
  });
});
