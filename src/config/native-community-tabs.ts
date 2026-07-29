export const nativeCommunityTabs = [
  { id: "agora", label: "Agora" },
  { id: "espacos", label: "Espaços" },
  { id: "eventos", label: "Eventos" },
] as const;

export type NativeCommunityTab = (typeof nativeCommunityTabs)[number]["id"];

export function normalizeNativeCommunityTab(value: unknown): NativeCommunityTab {
  return nativeCommunityTabs.some((tab) => tab.id === value)
    ? (value as NativeCommunityTab)
    : "agora";
}
