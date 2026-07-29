import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  createNativeViewportState,
  nativeViewportSsrFallback,
} from "../src/components/native-shell/useNativeViewportState";
import { isNativeEditableTarget } from "../src/config/native-primary-navigation";

describe("native viewport state", () => {
  it("provides a deterministic SSR/disabled fallback", () => {
    expect(nativeViewportSsrFallback).toEqual({
      width: 0,
      layoutHeight: 0,
      visualHeight: 0,
      keyboardHeight: 0,
      keyboardOpen: false,
      orientation: "portrait",
      compact: true,
    });
    expect(
      createNativeViewportState({
        enabled: false,
        width: 1440,
        layoutHeight: 900,
        visualHeight: 900,
        editableFocused: true,
      }),
    ).toEqual(nativeViewportSsrFallback);
  });

  it.each(["input", "textarea", "select"])(
    "opens immediately for focused compact %s controls",
    (tagName) => {
      const state = createNativeViewportState({
        enabled: true,
        width: 393,
        layoutHeight: 852,
        visualHeight: 852,
        editableFocused: isNativeEditableTarget({ tagName }),
      });

      expect(state.keyboardOpen).toBe(true);
      expect(state.compact).toBe(true);
      expect(state.orientation).toBe("portrait");
    },
  );

  it("recognizes contenteditable and a relevant VisualViewport reduction", () => {
    expect(isNativeEditableTarget({ tagName: "div", isContentEditable: true })).toBe(true);
    expect(
      createNativeViewportState({
        enabled: true,
        width: 430,
        layoutHeight: 932,
        visualHeight: 570,
        editableFocused: false,
      }),
    ).toMatchObject({
      keyboardOpen: true,
      keyboardHeight: 362,
      compact: true,
    });
  });

  it("keeps desktop closed and derives landscape orientation", () => {
    expect(
      createNativeViewportState({
        enabled: true,
        width: 1440,
        layoutHeight: 900,
        visualHeight: 650,
        editableFocused: true,
      }),
    ).toEqual({
      width: 1440,
      layoutHeight: 900,
      visualHeight: 650,
      keyboardHeight: 250,
      keyboardOpen: false,
      orientation: "landscape",
      compact: false,
    });
  });

  it("clamps invalid measurements and closes after blur/restoration", () => {
    expect(
      createNativeViewportState({
        enabled: true,
        width: Number.NaN,
        layoutHeight: -10,
        visualHeight: Number.POSITIVE_INFINITY,
        editableFocused: false,
      }),
    ).toEqual({
      width: 0,
      layoutHeight: 0,
      visualHeight: 0,
      keyboardHeight: 0,
      keyboardOpen: false,
      orientation: "portrait",
      compact: true,
    });
    expect(
      createNativeViewportState({
        enabled: true,
        width: 393,
        layoutHeight: 852,
        visualHeight: 852,
        editableFocused: false,
      }).keyboardOpen,
    ).toBe(false);
  });

  it("owns every listener and performs complete cleanup including pending RAF", () => {
    const source = readFileSync("src/components/native-shell/useNativeViewportState.ts", "utf8");

    for (const event of [
      '"focusin"',
      '"focusout"',
      '"resize"',
      '"scroll"',
      '"orientationchange"',
    ]) {
      expect(source).toContain(event);
    }
    expect(source.match(/removeEventListener/g)).toHaveLength(6);
    expect(source).toContain("cancelAnimationFrame(animationFrame)");
    expect(source).not.toMatch(/documentElement|style\.setProperty|globalThis/);
  });
});
