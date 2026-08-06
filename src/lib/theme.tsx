import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyTheme,
  getSystemTheme,
  getToggledTheme,
  normalizeThemePreference,
  readThemePreference,
  resolveTheme,
  shouldObserveSystemTheme,
  subscribeToSystemTheme,
  subscribeToThemeStorage,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme-core";

export type { ResolvedTheme, ThemePreference } from "@/lib/theme-core";

export type ThemeContextValue = {
  theme: ResolvedTheme;
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
  toggle: () => void;
};

const ThemeCtx = createContext<ThemeContextValue | null>(null);

function resolvePreference(preference: ThemePreference): ResolvedTheme {
  return resolveTheme(
    preference,
    getSystemTheme(typeof window === "undefined" ? undefined : window.matchMedia?.bind(window)),
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const commitTheme = useCallback((nextPreference: ThemePreference, persist: boolean) => {
    const nextResolvedTheme = resolvePreference(nextPreference);
    setPreference(nextPreference);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextResolvedTheme, nextPreference);
    if (persist && typeof window !== "undefined") {
      writeThemePreference(nextPreference, window.localStorage);
    }
  }, []);

  useEffect(() => {
    const initialPreference = readThemePreference(window.localStorage);
    commitTheme(initialPreference, false);
  }, [commitTheme]);

  useEffect(() => {
    if (!shouldObserveSystemTheme(preference) || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    return subscribeToSystemTheme(mediaQuery, (systemTheme) => {
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme, "system");
    });
  }, [preference]);

  useEffect(
    () =>
      subscribeToThemeStorage(window, (nextPreference) => {
        commitTheme(nextPreference, false);
      }),
    [commitTheme],
  );

  const setTheme = useCallback(
    (nextPreference: ThemePreference) => {
      commitTheme(normalizeThemePreference(nextPreference), true);
    },
    [commitTheme],
  );

  const toggle = useCallback(() => {
    setTheme(getToggledTheme(resolvedTheme));
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      preference,
      resolvedTheme,
      setTheme,
      toggle,
    }),
    [preference, resolvedTheme, setTheme, toggle],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// Kept here to preserve the established `@/lib/theme` public contract.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
