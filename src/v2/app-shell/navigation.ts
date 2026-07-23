import {
  CircleUserRound,
  Compass,
  HeartHandshake,
  Home,
  MessageCircle,
  Palette,
  PawPrint,
  Settings,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import type { V2ShellNavigationItem, V2ShellNavigationId } from "./types";

export const V2_PRIMARY_NAVIGATION = Object.freeze([
  { id: "home", label: "Início", href: "/inicio", icon: Home },
  { id: "community", label: "Comunidade", href: "/comunidade", icon: UsersRound },
  { id: "conversations", label: "Conversas", href: "/conversas", icon: MessageCircle },
  { id: "profile", label: "Perfil", href: "/perfil", icon: CircleUserRound },
] satisfies readonly V2ShellNavigationItem[]);

export const V2_SECONDARY_NAVIGATION = Object.freeze([
  { id: "dating", label: "Pretendentes", href: "/pretendentes", icon: HeartHandshake },
  { id: "explore", label: "Explorar pessoas", href: "/membros", icon: Compass },
  { id: "shop", label: "Loja", href: "/loja", icon: ShoppingBag },
  { id: "avatar", label: "Avatar", href: "/avatar", icon: Palette },
  { id: "pets", label: "Meu Pet", href: "/meu-pet", icon: PawPrint },
  { id: "settings", label: "Configurações", href: "/conta", icon: Settings },
] satisfies readonly V2ShellNavigationItem[]);

export function isV2NavigationItemActive(
  activeId: V2ShellNavigationId,
  item: Pick<V2ShellNavigationItem, "id">,
): boolean {
  return activeId === item.id;
}

export function formatV2NavigationBadge(value: number | string | undefined): string | undefined {
  if (typeof value === "number") return value > 99 ? "99+" : String(Math.max(0, value));
  return value;
}
