import type { PetRarity } from "@/types/pet";

export type LevelReward = {
  level: number;
  title: string;
  description: string;
  rarity?: PetRarity;
  icon: string; // lucide icon name
};

/**
 * Trilha de recompensas por nível (1 → 50).
 * Marcadores são exibidos no rail; níveis sem entrada aparecem como pontos simples.
 */
export const LEVEL_REWARDS: LevelReward[] = [
  {
    level: 1,
    title: "Boas-vindas",
    description: "Seu pet companheiro está pronto pra começar.",
    icon: "Sparkles",
  },
  {
    level: 2,
    title: "Bônus rápido",
    description: "+1 moeda no próximo login diário.",
    icon: "Coins",
  },
  {
    level: 3,
    title: "Fundos de pet raros",
    description: "Desbloqueia cenários raros para o seu pet.",
    rarity: "rare",
    icon: "Image",
  },
  {
    level: 5,
    title: "Slot de missão",
    description: "Slot extra de missão diária do pet.",
    icon: "ListChecks",
  },
  {
    level: 7,
    title: "Recompensa de moedas",
    description: "+3 moedas no próximo login diário.",
    icon: "Coins",
  },
  {
    level: 9,
    title: "Fundos de pet épicos",
    description: "Cenários épicos disponíveis para o seu pet.",
    rarity: "epic",
    icon: "Mountain",
  },
  {
    level: 12,
    title: "Fundos de perfil raros",
    description: "Novos fundos raros para o seu perfil.",
    rarity: "rare",
    icon: "LayoutTemplate",
  },
  {
    level: 15,
    title: "Bônus surpresa",
    description: "+5 moedas no próximo login diário.",
    icon: "Coins",
  },
  {
    level: 18,
    title: "Pack de stickers",
    description: "Pacote exclusivo de stickers nos chats.",
    icon: "Smile",
  },
  {
    level: 20,
    title: "Título Companheiro",
    description: "Novo título exibido no seu perfil.",
    icon: "Award",
  },
  {
    level: 25,
    title: "Moldura de foto rara",
    description: "Moldura de foto de perfil rara desbloqueada.",
    rarity: "rare",
    icon: "Frame",
  },
  {
    level: 30,
    title: "Fundos lendários",
    description: "Cenários lendários para o seu pet.",
    rarity: "legendary",
    icon: "Crown",
  },
  {
    level: 35,
    title: "Cofre de moedas",
    description: "+10 moedas no próximo login diário.",
    rarity: "epic",
    icon: "Coins",
  },
  {
    level: 40,
    title: "Moldura épica",
    description: "Moldura de foto de perfil épica liberada.",
    rarity: "epic",
    icon: "Frame",
  },
  {
    level: 45,
    title: "Nome em gradiente",
    description: "Gradiente exclusivo para o seu nome.",
    rarity: "legendary",
    icon: "Wand2",
  },
  {
    level: 50,
    title: "Lendário",
    description: "Título máximo + moldura lendária de perfil.",
    rarity: "legendary",
    icon: "Trophy",
  },
];

export const MAX_LEVEL = 50;
