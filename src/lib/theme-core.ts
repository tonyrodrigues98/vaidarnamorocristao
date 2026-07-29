import { brand } from "@/config/brand";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ThemeMediaQuery = {
  matches: boolean;
  addEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  addListener?: (listener: (event: { matches: boolean }) => void) => void;
  removeListener?: (listener: (event: { matches: boolean }) => void) => void;
};

type ThemeStorageEvent = {
  key: string | null;
  newValue: string | null;
};

type ThemeStorageTarget = {
  addEventListener: (type: "storage", listener: (event: ThemeStorageEvent) => void) => void;
  removeEventListener: (type: "storage", listener: (event: ThemeStorageEvent) => void) => void;
};

export const THEME_STORAGE_KEY = "theme";

export function normalizeThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === "system" ? systemTheme : preference;
}

export function getSystemTheme(
  matchMedia?: (query: string) => Pick<ThemeMediaQuery, "matches">,
): ResolvedTheme {
  try {
    return matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function readThemePreference(storage?: Pick<Storage, "getItem">): ThemePreference {
  try {
    return normalizeThemePreference(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage?: Pick<Storage, "setItem">,
) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The applied theme still works when storage is unavailable.
  }
}

export function getToggledTheme(resolvedTheme: ResolvedTheme): ResolvedTheme {
  return resolvedTheme === "dark" ? "light" : "dark";
}

export function shouldObserveSystemTheme(preference: ThemePreference) {
  return preference === "system";
}

export function applyTheme(
  resolvedTheme: ResolvedTheme,
  preference: ThemePreference,
  targetDocument:
    | Pick<Document, "documentElement" | "querySelector">
    | undefined = globalThis.document,
) {
  if (!targetDocument) return;

  const root = targetDocument.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;

  const themeColor = targetDocument.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content =
      resolvedTheme === "dark" ? brand.theme.canvasDark : brand.theme.canvasLight;
  }
}

export function subscribeToSystemTheme(
  mediaQuery: ThemeMediaQuery,
  listener: (theme: ResolvedTheme) => void,
) {
  const handleChange = (event: { matches: boolean }) => listener(event.matches ? "dark" : "light");

  if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handleChange);
  else mediaQuery.addListener?.(handleChange);

  return () => {
    if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", handleChange);
    else mediaQuery.removeListener?.(handleChange);
  };
}

export function subscribeToThemeStorage(
  target: ThemeStorageTarget,
  listener: (preference: ThemePreference) => void,
) {
  const handleStorage = (event: ThemeStorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener(normalizeThemePreference(event.newValue));
  };
  target.addEventListener("storage", handleStorage);
  return () => target.removeEventListener("storage", handleStorage);
}

export function getThemeBootstrapScript() {
  const light = JSON.stringify(brand.theme.canvasLight);
  const dark = JSON.stringify(brand.theme.canvasDark);

  return `(function(){var p="system",r="light";try{var v=localStorage.getItem("theme");if(v==="system"||v==="light"||v==="dark")p=v;}catch(e){}if(p==="dark")r="dark";else if(p==="system"){try{r=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}catch(e){r="light";}}try{var d=document.documentElement;d.classList.toggle("dark",r==="dark");d.dataset.theme=r;d.dataset.themePreference=p;d.style.colorScheme=r;var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=r==="dark"?${dark}:${light};}catch(e){}})();`;
}
