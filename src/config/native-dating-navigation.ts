export type NativeDatingDestinationId = "discover" | "interests" | "matches" | "notes";

export type NativeDatingNavigationItem = {
  id: NativeDatingDestinationId;
  label: string;
  path: "/pretendentes" | "/interesses" | "/matches" | "/recados";
};

export const nativeDatingNavigation = [
  { id: "discover", label: "Descobrir", path: "/pretendentes" },
  { id: "interests", label: "Interesses", path: "/interesses" },
  { id: "matches", label: "Matches", path: "/matches" },
  { id: "notes", label: "Recados", path: "/recados" },
] as const satisfies readonly NativeDatingNavigationItem[];

export function isNativeDatingNavigationItemActive(
  item: NativeDatingNavigationItem,
  pathname: string,
): boolean {
  if (item.id === "discover")
    return pathname === "/pretendentes" || pathname.startsWith("/pretendentes/");
  return pathname === item.path;
}
