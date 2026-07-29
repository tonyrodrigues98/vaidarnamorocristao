import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import { brand } from "../src/config/brand";
import {
  applyTheme,
  getSystemTheme,
  getThemeBootstrapScript,
  getToggledTheme,
  normalizeThemePreference,
  readThemePreference,
  resolveTheme,
  shouldObserveSystemTheme,
  subscribeToSystemTheme,
  subscribeToThemeStorage,
  writeThemePreference,
} from "../src/lib/theme-core";

function createDocument() {
  const classes = new Set<string>();
  const meta = { content: "" };
  const documentElement = {
    classList: {
      toggle: (name: string, enabled: boolean) =>
        enabled ? classes.add(name) : classes.delete(name),
    },
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
  };
  return {
    classes,
    meta,
    document: {
      documentElement,
      querySelector: () => meta,
    },
  };
}

function runBootstrap({
  stored,
  systemDark,
  storageThrows = false,
  mediaThrows = false,
}: {
  stored?: string | null;
  systemDark?: boolean;
  storageThrows?: boolean;
  mediaThrows?: boolean;
}) {
  const target = createDocument();
  const localStorage = {
    getItem: () => {
      if (storageThrows) throw new Error("storage unavailable");
      return stored ?? null;
    },
  };
  const matchMedia = () => {
    if (mediaThrows) throw new Error("media unavailable");
    return { matches: Boolean(systemDark) };
  };
  const execute = new Function("localStorage", "matchMedia", "document", getThemeBootstrapScript());
  execute(localStorage, matchMedia, target.document);
  return target;
}

describe("theme system contract", () => {
  it("normalizes supported, absent and invalid preferences", () => {
    expect(normalizeThemePreference("system")).toBe("system");
    expect(normalizeThemePreference("light")).toBe("light");
    expect(normalizeThemePreference("dark")).toBe("dark");
    expect(normalizeThemePreference(undefined)).toBe("system");
    expect(normalizeThemePreference("sepia")).toBe("system");
  });

  it("resolves system and keeps explicit choices independent", () => {
    expect(resolveTheme("system", "light")).toBe("light");
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
    expect(getSystemTheme(() => ({ matches: true }))).toBe("dark");
    expect(getSystemTheme(() => ({ matches: false }))).toBe("light");
    expect(shouldObserveSystemTheme("system")).toBe(true);
    expect(shouldObserveSystemTheme("light")).toBe(false);
    expect(shouldObserveSystemTheme("dark")).toBe(false);
  });

  it("reads, writes and toggles without changing the storage key", () => {
    const storage = { getItem: vi.fn(() => "dark"), setItem: vi.fn() };
    expect(readThemePreference(storage)).toBe("dark");
    writeThemePreference("system", storage);
    expect(storage.setItem).toHaveBeenCalledWith("theme", "system");
    expect(getToggledTheme("light")).toBe("dark");
    expect(getToggledTheme("dark")).toBe("light");
  });

  it("applies class, datasets, color scheme and the single theme-color meta", () => {
    const target = createDocument();
    applyTheme("dark", "system", target.document as unknown as Document);
    expect(target.classes.has("dark")).toBe(true);
    expect(target.document.documentElement.dataset).toEqual({
      theme: "dark",
      themePreference: "system",
    });
    expect(target.document.documentElement.style.colorScheme).toBe("dark");
    expect(target.meta.content).toBe(brand.theme.canvasDark);

    applyTheme("light", "light", target.document as unknown as Document);
    expect(target.classes.has("dark")).toBe(false);
    expect(target.meta.content).toBe(brand.theme.canvasLight);
  });

  it("subscribes to system changes and cleans up", () => {
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const media = {
      matches: false,
      addEventListener: vi.fn((_type: "change", next: typeof listener) => {
        listener = next;
      }),
      removeEventListener: vi.fn(),
    };
    const onTheme = vi.fn();
    const cleanup = subscribeToSystemTheme(media, onTheme);
    listener?.({ matches: true });
    expect(onTheme).toHaveBeenCalledWith("dark");
    cleanup();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", listener);
  });

  it("normalizes cross-tab storage events without writing a loop and cleans up", () => {
    let listener: ((event: { key: string | null; newValue: string | null }) => void) | undefined;
    const target = {
      addEventListener: vi.fn((_type: "storage", next: typeof listener) => {
        listener = next;
      }),
      removeEventListener: vi.fn(),
    };
    const onPreference = vi.fn();
    const cleanup = subscribeToThemeStorage(target, onPreference);
    listener?.({ key: "other", newValue: "dark" });
    listener?.({ key: "theme", newValue: "dark" });
    listener?.({ key: "theme", newValue: "invalid" });
    expect(onPreference.mock.calls).toEqual([["dark"], ["system"]]);
    cleanup();
    expect(target.removeEventListener).toHaveBeenCalledWith("storage", listener);
  });

  it("bootstraps explicit and system themes before hydration", () => {
    const explicit = runBootstrap({ stored: "dark", systemDark: false });
    expect(explicit.classes.has("dark")).toBe(true);
    expect(explicit.document.documentElement.dataset.themePreference).toBe("dark");
    expect(explicit.meta.content).toBe(brand.theme.canvasDark);

    const system = runBootstrap({ stored: null, systemDark: true });
    expect(system.classes.has("dark")).toBe(true);
    expect(system.document.documentElement.dataset.themePreference).toBe("system");
  });

  it("falls back safely when storage or matchMedia are unavailable", () => {
    const target = runBootstrap({
      storageThrows: true,
      mediaThrows: true,
    });
    expect(target.classes.has("dark")).toBe(false);
    expect(target.document.documentElement.dataset.theme).toBe("light");
    expect(target.meta.content).toBe(brand.theme.canvasLight);
  });

  it("keeps the bootstrap before the body and gives the legacy splash a dark canvas", () => {
    const rootSource = readFileSync("src/routes/__root.tsx", "utf8");
    expect(rootSource.indexOf("getThemeBootstrapScript()")).toBeLessThan(
      rootSource.indexOf("<body>"),
    );
    expect(rootSource).toContain('html.dark #app-splash,html[data-theme="dark"] #app-splash');
    expect(rootSource.match(/name: "theme-color"/g)).toHaveLength(1);
  });
});
