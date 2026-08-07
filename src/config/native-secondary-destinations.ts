import type { FuturePrimaryTab } from "@/config/app-destinations";

export type NativeSecondaryDestinationChrome = {
  destinationId: string;
  title: string;
  parentTab: FuturePrimaryTab;
  parentPath:
    | "/inicio"
    | "/comunidade"
    | "/explorar"
    | "/conversas"
    | "/perfil"
    | "/pretendentes"
    | "/suporte";
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
  {
    destinationId: "app-purpose",
    title: "Propósito",
    parentTab: "messages",
    parentPath: "/conversas",
  },
  {
    destinationId: "support-root",
    title: "Suporte",
    parentTab: "profile",
    parentPath: "/perfil",
  },
  {
    destinationId: "support-help",
    title: "Central de Ajuda",
    parentTab: "profile",
    parentPath: "/suporte",
  },
  {
    destinationId: "support-ticket",
    title: "Chamado",
    parentTab: "profile",
    parentPath: "/suporte",
  },
  {
    destinationId: "public-manual",
    title: "Manual",
    parentTab: "profile",
    parentPath: "/perfil",
  },
  {
    destinationId: "public-terms",
    title: "Termos",
    parentTab: "profile",
    parentPath: "/perfil",
  },
  {
    destinationId: "app-devotional",
    title: "Devocional",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-news",
    title: "Notícias",
    parentTab: "community",
    parentPath: "/comunidade",
  },
  {
    destinationId: "app-prayers",
    title: "Orações",
    parentTab: "community",
    parentPath: "/comunidade",
  },
  {
    destinationId: "app-bible-quiz",
    title: "Quiz Bíblico",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-avatar",
    title: "Avatar",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-avatar-create",
    title: "Criar avatar",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-boxes",
    title: "Caixas",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-achievements",
    title: "Conquistas",
    parentTab: "explore",
    parentPath: "/explorar",
  },
  {
    destinationId: "app-gifts",
    title: "Presentes",
    parentTab: "explore",
    parentPath: "/explorar",
  },
] as const satisfies readonly NativeSecondaryDestinationChrome[];

export function getNativeSecondaryDestinationChrome(
  destinationId: string,
): NativeSecondaryDestinationChrome | undefined {
  return nativeSecondaryDestinations.find((item) => item.destinationId === destinationId);
}
