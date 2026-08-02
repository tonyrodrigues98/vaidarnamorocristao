import type { FuturePrimaryTab } from "@/config/app-destinations";

export type NativeSecondaryDestinationChrome = {
  destinationId: string;
  title: string;
  parentTab: FuturePrimaryTab;
  parentPath: "/inicio" | "/explorar" | "/perfil";
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
] as const satisfies readonly NativeSecondaryDestinationChrome[];

export function getNativeSecondaryDestinationChrome(
  destinationId: string,
): NativeSecondaryDestinationChrome | undefined {
  return nativeSecondaryDestinations.find((item) => item.destinationId === destinationId);
}
