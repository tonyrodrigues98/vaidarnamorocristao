import type { FuturePrimaryTab } from "@/config/app-destinations";
import { brand } from "@/config/brand";
import { nativePrimaryNavigation } from "@/config/native-primary-navigation";

export function getNativeTopBarTitle(tab: FuturePrimaryTab): string {
  return nativePrimaryNavigation.find((item) => item.id === tab)!.label;
}

export function getNativeUserInitials(userLabel: string): string {
  const localLabel = userLabel.trim().split("@")[0] ?? "";
  const parts = localLabel.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toLocaleUpperCase();
  }
  return (parts[0] ?? brand.shortName).slice(0, 2).toLocaleUpperCase();
}
