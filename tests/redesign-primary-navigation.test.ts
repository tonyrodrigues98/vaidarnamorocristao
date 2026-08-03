import { describe, expect, it } from "vitest";

import { nativePrimaryNavigation } from "../src/config/native-primary-navigation";

describe("total redesign primary navigation", () => {
  it("keeps the five production destinations in their frozen order", () => {
    expect(nativePrimaryNavigation.map(({ id, label, path }) => ({ id, label, path }))).toEqual([
      { id: "home", label: "Início", path: "/inicio" },
      { id: "community", label: "Comunidade", path: "/comunidade" },
      { id: "explore", label: "Explorar", path: "/explorar" },
      { id: "messages", label: "Conversas", path: "/conversas" },
      { id: "profile", label: "Perfil", path: "/perfil" },
    ]);
  });

  it("does not add a sixth primary destination", () => {
    expect(nativePrimaryNavigation).toHaveLength(5);
  });
});
