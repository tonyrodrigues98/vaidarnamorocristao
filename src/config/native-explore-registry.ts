export type NativeExploreIconKey =
  | "book-heart"
  | "paw-print"
  | "gamepad"
  | "circle-help"
  | "store"
  | "user-round"
  | "package"
  | "trophy"
  | "newspaper"
  | "sparkles"
  | "heart-handshake"
  | "radio";

export type NativeExploreItem = {
  id: string;
  category: "experiences" | "discoveries";
  title: string;
  description: string;
  path: string;
  icon: NativeExploreIconKey;
  relationshipOptional?: true;
};

export const nativeExploreRegistry: readonly NativeExploreItem[] = [
  {
    id: "devotional",
    category: "experiences",
    title: "Devocional",
    description: "Leia a palavra e a reflexão disponíveis.",
    path: "/devocional",
    icon: "book-heart",
  },
  {
    id: "my-pet",
    category: "experiences",
    title: "Meu Pet",
    description: "Cuide do seu companheiro virtual.",
    path: "/meu-pet",
    icon: "paw-print",
  },
  {
    id: "pet-arcade",
    category: "experiences",
    title: "Pet Arcade",
    description: "Abra os jogos disponíveis para seu pet.",
    path: "/pet-arcade",
    icon: "gamepad",
  },
  {
    id: "bible-quiz",
    category: "experiences",
    title: "Quiz Bíblico",
    description: "Teste seus conhecimentos no quiz atual.",
    path: "/quiz-biblico",
    icon: "circle-help",
  },
  {
    id: "store",
    category: "experiences",
    title: "Loja",
    description: "Explore os itens disponíveis na loja.",
    path: "/loja",
    icon: "store",
  },
  {
    id: "avatar",
    category: "experiences",
    title: "Avatar",
    description: "Acesse a personalização de avatar existente.",
    path: "/avatar",
    icon: "user-round",
  },
  {
    id: "boxes",
    category: "experiences",
    title: "Caixas",
    description: "Veja suas caixas e as opções disponíveis.",
    path: "/caixas",
    icon: "package",
  },
  {
    id: "achievements",
    category: "experiences",
    title: "Conquistas",
    description: "Acompanhe as conquistas registradas.",
    path: "/conquistas",
    icon: "trophy",
  },
  {
    id: "news",
    category: "discoveries",
    title: "Notícias",
    description: "Leia as notícias publicadas.",
    path: "/noticias",
    icon: "newspaper",
  },
  {
    id: "prayers",
    category: "discoveries",
    title: "Orações",
    description: "Acesse os pedidos e o espaço de oração.",
    path: "/oracoes",
    icon: "sparkles",
  },
  {
    id: "dating",
    category: "discoveries",
    title: "Pretendentes",
    description: "Experiência opcional para quem deseja conhecer alguém.",
    path: "/pretendentes",
    icon: "heart-handshake",
    relationshipOptional: true,
  },
  {
    id: "live",
    category: "discoveries",
    title: "Live",
    description: "Abra a experiência pública de transmissão.",
    path: "/",
    icon: "radio",
  },
] as const;

export function getNativeExploreItem(id: string): NativeExploreItem | undefined {
  return nativeExploreRegistry.find((item) => item.id === id);
}
