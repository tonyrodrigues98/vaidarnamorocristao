import { describe, expect, it } from "vitest";
import {
  PROFILE_MODULE_TYPES,
  moveProfileModule,
  normalizeProfileModules,
  restoreProfileModuleDefaults,
  updateProfileModule,
  type ProfileModule,
} from "../src/v2/features/profile/contracts";
import { parseProfileSnapshot, safeProfileMediaUrl } from "../src/v2/features/profile/repository";

function module(type: ProfileModule["type"], order: number): ProfileModule {
  return {
    type,
    order,
    visible: true,
    audience: "community",
    data: {},
  };
}

describe("V2-013 modular profile contracts", () => {
  it("defines stable community modules without romantic preferences", () => {
    expect(PROFILE_MODULE_TYPES).toEqual([
      "about",
      "faith",
      "favorites",
      "gallery",
      "achievements",
      "gifts",
      "pet",
      "verses",
      "communities",
      "collections",
      "relationship",
    ]);
    expect(PROFILE_MODULE_TYPES).not.toContain("dating-preferences");
  });

  it("normalizes order and removes duplicate module types", () => {
    expect(
      normalizeProfileModules([module("faith", 8), module("about", 2), module("about", 9)]),
    ).toEqual([module("about", 0), module("faith", 1)]);
  });

  it("moves modules with a keyboard-compatible deterministic operation", () => {
    const modules = [module("about", 0), module("faith", 1), module("gallery", 2)];
    expect(moveProfileModule(modules, "gallery", -1).map((item) => item.type)).toEqual([
      "about",
      "gallery",
      "faith",
    ]);
    expect(moveProfileModule(modules, "about", -1)).toEqual(modules);
  });

  it("updates visibility and audience without mutating source data", () => {
    const modules = [module("about", 0), module("faith", 1)];
    const changed = updateProfileModule(modules, "faith", {
      visible: false,
      audience: "private",
    });
    expect(changed[1]).toMatchObject({ visible: false, audience: "private" });
    expect(modules[1]).toMatchObject({ visible: true, audience: "community" });
  });

  it("restores only modules authorized by the server payload", () => {
    const restored = restoreProfileModuleDefaults([
      module("about", 0),
      module("faith", 1),
      module("gallery", 2),
    ]);
    expect(restored.map((item) => item.type)).toEqual(["about", "faith", "gallery"]);
    expect(restored).not.toContainEqual(expect.objectContaining({ type: "relationship" }));
  });

  it("accepts only same-origin paths or HTTPS media URLs", () => {
    expect(safeProfileMediaUrl("/storage/profile/photo.webp")).toBe("/storage/profile/photo.webp");
    expect(safeProfileMediaUrl("https://cdn.example.test/photo.webp")).toBe(
      "https://cdn.example.test/photo.webp",
    );
    expect(safeProfileMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeProfileMediaUrl("data:image/svg+xml,unsafe")).toBeNull();
    expect(safeProfileMediaUrl("//evil.example/photo.webp")).toBeNull();
    expect(safeProfileMediaUrl("http://cdn.example.test/photo.webp")).toBeNull();
  });

  it("parses untrusted payloads with safe fallbacks and sanitized media", () => {
    const snapshot = parseProfileSnapshot({
      owner: true,
      configuration_updated_at: "2026-07-23T12:00:00.000Z",
      identity: {
        display_name: "Ana",
        photo_url: "javascript:alert(1)",
        verified: true,
        presence: "online",
      },
      appearance: {
        background_url: "https://cdn.example.test/background.webp",
        frame_url: "data:image/svg+xml,unsafe",
        name_color_a: "#5737a8",
        name_color_b: "#e96f68",
      },
      modules: [
        {
          module_type: "gallery",
          sort_order: 4,
          visible: true,
          audience: "connections",
          data: {
            gallery: [
              { id: "safe", url: "/storage/gallery.webp", category: "Comunidade" },
              { id: "unsafe", url: "javascript:alert(1)" },
            ],
          },
        },
        {
          module_type: "unknown",
          sort_order: 0,
          visible: true,
          audience: "public",
        },
      ],
    });
    expect(snapshot.identity).toMatchObject({
      displayName: "Ana",
      photoUrl: null,
      verified: true,
      presence: "online",
    });
    expect(snapshot.appearance).toMatchObject({
      backgroundUrl: "https://cdn.example.test/background.webp",
      frameUrl: null,
      nameGradient: ["#5737a8", "#e96f68"],
    });
    expect(snapshot.modules).toHaveLength(1);
    expect(snapshot.modules[0]?.data.gallery).toEqual([
      { id: "safe", url: "/storage/gallery.webp", category: "Comunidade" },
    ]);
  });

  it("does not derive editable data from invalid audience values", () => {
    const snapshot = parseProfileSnapshot({
      modules: [
        {
          module_type: "about",
          sort_order: 0,
          visible: true,
          audience: "everyone-on-the-internet",
          data: { text: "Olá" },
        },
      ],
    });
    expect(snapshot.modules[0]).toMatchObject({ audience: "community" });
  });
});
