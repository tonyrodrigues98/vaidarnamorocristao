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
] as const satisfies readonly NativeSecondaryDestinationChrome[];

export function getNativeSecondaryDestinationChrome(
  destinationId: string,
): NativeSecondaryDestinationChrome | undefined {
  return nativeSecondaryDestinations.find((item) => item.destinationId === destinationId);
}
