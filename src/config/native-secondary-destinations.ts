import type { FuturePrimaryTab } from "@/config/app-destinations";

export type NativeSecondaryDestinationChrome = {
  destinationId: string;
  title: string;
  parentTab: FuturePrimaryTab;
  parentPath: "/inicio" | "/explorar" | "/perfil" | "/pretendentes";
};

export const nativeSecondaryDestinations = [
  {
    destinationId: "app-account",
    title: "Configurações",
    parentTab: "profile",
    parentPath: "/perfil",
  },
  {
    destinationId: "app-notifications",
    title: "Notificações",
    parentTab: "home",
    parentPath: "/inicio",
  },
  {
    destinationId: "app-store",
    title: "Loja",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-pet",
    title: "Meu Pet",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-pet-arcade",
    title: "Arcade",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-dating",
    title: "Namoro",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-dating-profile",
    title: "Perfil",
    parentTab: "explore",
    parentPath: "/pretendentes",
  },
  {
    destinationId: "app-interests",
    title: "Interesses",
    parentTab: "explore",
    parentPath: "/pretendentes",
  },
  {
    destinationId: "app-matches",
    title: "Matches",
    parentTab: "explore",
    parentPath: "/pretendentes",
  },
  {
    destinationId: "app-anonymous-notes",
    title: "Recados",
    parentTab: "explore",
    parentPath: "/pretendentes",
  },
  {
    destinationId: "app-verification",
    title: "Verificação",
    parentTab: "profile",
    parentPath: "/perfil",
  },
  {
    destinationId: "app-blocked-users",
    title: "Bloqueados",
    parentTab: "profile",
    parentPath: "/perfil",
  },
  {
    destinationId: "app-dashboard",
    title: "Insights",
    parentTab: "profile",
    parentPath: "/perfil",
  },
] as const satisfies readonly NativeSecondaryDestinationChrome[];

export function getNativeSecondaryDestinationChrome(
  destinationId: string,
): NativeSecondaryDestinationChrome | undefined {
  return nativeSecondaryDestinations.find((item) => item.destinationId === destinationId);
}
