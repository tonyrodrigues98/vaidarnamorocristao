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
  type LucideIcon,
} from "lucide-react";
import type { V2ShellNavigationId, V2ShellNavigationItem, V2ShellPageConfig } from "@/v2/app-shell";
import type { PlatformDomain } from "@/v2/platform/identity";

export const V2_RUNTIME_SLUGS = [
  "inicio",
  "comunidade",
  "conversas",
  "perfil",
  "pretendentes",
  "proposito",
  "recados",
  "explorar-pessoas",
  "loja",
  "avatar",
  "meu-pet",
  "configuracoes",
] as const;

export type V2RuntimeSlug = (typeof V2_RUNTIME_SLUGS)[number];

export interface V2RuntimeRouteDescriptor {
  readonly slug: V2RuntimeSlug;
  readonly navigationId: V2ShellNavigationId;
  readonly label: string;
  readonly title: string;
  readonly subtitle: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly primary: boolean;
  readonly requiredDomain: PlatformDomain;
  readonly width?: V2ShellPageConfig["width"];
}

const V2_RUNTIME_ROUTES = Object.freeze([
  {
    slug: "inicio",
    navigationId: "home",
    label: "Início",
    title: "Início",
    subtitle: "Um ponto de encontro para fé, amizade e vida em comunidade.",
    eyebrow: "Community Platform V2",
    description:
      "Feed, Status e vínculos sociais entram somente com a flag comunitária e preservam o Início legado como fallback.",
    icon: Home,
    primary: true,
    requiredDomain: "community",
  },
  {
    slug: "comunidade",
    navigationId: "community",
    label: "Comunidade",
    title: "Comunidade",
    subtitle: "Grupos, reflexões e atividades para caminhar junto.",
    eyebrow: "Convivência",
    description:
      "Espaços, eventos, presença e o histórico do chat global em uma experiência comunitária independente do Namoro.",
    icon: UsersRound,
    primary: true,
    requiredDomain: "community",
  },
  {
    slug: "conversas",
    navigationId: "conversations",
    label: "Conversas",
    title: "Conversas",
    subtitle: "Mensagens sociais, comunitárias e românticas com contexto explícito.",
    eyebrow: "Mensagens",
    description:
      "Inbox e thread V2 usam adapters sobre o histórico e escondem contextos românticos quando o Namoro está desligado.",
    icon: MessageCircle,
    primary: true,
    requiredDomain: "messaging",
    width: "wide",
  },
  {
    slug: "perfil",
    navigationId: "profile",
    label: "Perfil",
    title: "Meu perfil",
    subtitle: "Sua identidade e participação na comunidade.",
    eyebrow: "Identidade",
    description:
      "A personalização modular será integrada progressivamente, preservando o perfil e as fotos existentes.",
    icon: CircleUserRound,
    primary: true,
    requiredDomain: "profile",
  },
  {
    slug: "pretendentes",
    navigationId: "dating",
    label: "Pretendentes",
    title: "Pretendentes",
    subtitle: "Uma área opcional e separada da participação comunitária.",
    eyebrow: "Namoro",
    description:
      "Descoberta opcional, server-authoritative e separada da comunidade, com interesses e matches legados preservados.",
    icon: HeartHandshake,
    primary: false,
    requiredDomain: "dating",
  },
  {
    slug: "proposito",
    navigationId: "purpose",
    label: "Propósito Firmado",
    title: "Propósito Firmado",
    subtitle: "Um compromisso bilateral que pausa somente a descoberta romântica.",
    eyebrow: "Namoro",
    description:
      "Pedidos, aceite, página do casal, presentes e histórico preservados por uma máquina de estados explícita.",
    icon: HeartHandshake,
    primary: false,
    requiredDomain: "dating",
  },
  {
    slug: "recados",
    navigationId: "anonymous",
    label: "Recados anônimos",
    title: "Recados anônimos",
    subtitle: "Contato romântico consentido, moderável e protegido.",
    eyebrow: "Namoro",
    description:
      "Somente participantes elegíveis e com consentimento explícito podem enviar e receber recados.",
    icon: MessageCircle,
    primary: false,
    requiredDomain: "dating",
  },
  {
    slug: "explorar-pessoas",
    navigationId: "explore",
    label: "Explorar pessoas",
    title: "Explorar pessoas",
    subtitle: "Descoberta comunitária sem presumir disponibilidade romântica.",
    eyebrow: "Conexões",
    description:
      "Descoberta social por vínculos comunitários, sem usar matches ou disponibilidade romântica.",
    icon: Compass,
    primary: false,
    requiredDomain: "community",
  },
  {
    slug: "loja",
    navigationId: "shop",
    label: "Loja",
    title: "Loja",
    subtitle: "Itens e expressões para personalizar sua presença.",
    eyebrow: "Economia",
    description: "Saldos, compras e inventários permanecem intocados no sistema atual.",
    icon: ShoppingBag,
    primary: false,
    requiredDomain: "economy",
  },
  {
    slug: "avatar",
    navigationId: "avatar",
    label: "Avatar",
    title: "Avatar",
    subtitle: "Personalização visual preparada para uma migração segura.",
    eyebrow: "Personalização",
    description: "Nenhum item, foto ou personagem existente foi alterado por esta integração.",
    icon: Palette,
    primary: false,
    requiredDomain: "profile",
  },
  {
    slug: "meu-pet",
    navigationId: "pets",
    label: "Meu Pet",
    title: "Meu Pet",
    subtitle: "Companhia, progresso e cuidado preservados.",
    eyebrow: "Pets",
    description:
      "Pets, itens e progressão continuam disponíveis apenas na experiência legada por enquanto.",
    icon: PawPrint,
    primary: false,
    requiredDomain: "economy",
  },
  {
    slug: "configuracoes",
    navigationId: "settings",
    label: "Configurações",
    title: "Configurações",
    subtitle: "Controle sua experiência, privacidade e estado da conta.",
    eyebrow: "Conta",
    description:
      "Configurações reais integradas aos contratos atuais, com o legado preservado como fallback.",
    icon: Settings,
    primary: false,
    requiredDomain: "account",
  },
] satisfies readonly V2RuntimeRouteDescriptor[]);

export function getV2RuntimeRoute(slug: string): V2RuntimeRouteDescriptor | null {
  return V2_RUNTIME_ROUTES.find((route) => route.slug === slug) ?? null;
}

function toNavigationItem(route: V2RuntimeRouteDescriptor): V2ShellNavigationItem {
  return {
    id: route.navigationId,
    label: route.label,
    href: `/v2/${route.slug}`,
    icon: route.icon,
  };
}

export const V2_RUNTIME_PRIMARY_NAVIGATION = Object.freeze(
  V2_RUNTIME_ROUTES.filter((route) => route.primary).map(toNavigationItem),
);

export const V2_RUNTIME_SECONDARY_NAVIGATION = Object.freeze(
  V2_RUNTIME_ROUTES.filter((route) => !route.primary).map(toNavigationItem),
);

export function getV2RuntimeNavigation(canEnter: (domain: PlatformDomain) => boolean): Readonly<{
  primary: readonly V2ShellNavigationItem[];
  secondary: readonly V2ShellNavigationItem[];
}> {
  const available = V2_RUNTIME_ROUTES.filter((route) => canEnter(route.requiredDomain));
  return Object.freeze({
    primary: Object.freeze(available.filter((route) => route.primary).map(toNavigationItem)),
    secondary: Object.freeze(available.filter((route) => !route.primary).map(toNavigationItem)),
  });
}

export function isV2RuntimePath(pathname: string): boolean {
  return pathname === "/v2" || pathname.startsWith("/v2/");
}

export function getV2RuntimeDocumentTitle(slug: string): string {
  const route = getV2RuntimeRoute(slug);
  return `${route?.title ?? "Área não encontrada"} — Vai Dar Namoro`;
}
