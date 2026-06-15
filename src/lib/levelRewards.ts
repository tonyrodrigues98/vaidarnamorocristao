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
  { level: 1, title: "Boas-vindas", description: "Seu pet companheiro está pronto pra começar.", icon: "Sparkles" },
  { level: 3, title: "Fundos raros", description: "Desbloqueia cenários de raridade rara na loja.", rarity: "rare", icon: "Image" },
  { level: 5, title: "Filhote graduado", description: "Slot extra de missão diária.", icon: "Star" },
  { level: 7, title: "Acessório raro", description: "Item raro liberado no avatar.", rarity: "rare", icon: "Glasses" },
  { level: 9, title: "Fundos épicos", description: "Cenários épicos disponíveis na loja.", rarity: "epic", icon: "Mountain" },
  { level: 12, title: "Bônus diário +", description: "+10 moedas no login diário.", icon: "Coins" },
  { level: 15, title: "Poses exclusivas", description: "Novas poses de avatar liberadas.", icon: "PersonStanding" },
  { level: 18, title: "Pack de stickers", description: "Pacote exclusivo nos chats.", icon: "Smile" },
  { level: 20, title: "Companheiro", description: "Novo título exibido no perfil.", icon: "Award" },
  { level: 25, title: "Moldura rara", description: "Moldura de foto rara desbloqueada.", rarity: "rare", icon: "Frame" },
  { level: 30, title: "Fundos lendários", description: "Cenários lendários na loja.", rarity: "legendary", icon: "Crown" },
  { level: 35, title: "Aura especial", description: "Aura visível no avatar.", rarity: "epic", icon: "Flame" },
  { level: 40, title: "Moldura épica", description: "Moldura de foto épica liberada.", rarity: "epic", icon: "Frame" },
  { level: 45, title: "Nome em gradiente", description: "Gradiente exclusivo no seu nome.", rarity: "legendary", icon: "Wand2" },
  { level: 50, title: "Lendário", description: "Aura lendária + título máximo.", rarity: "legendary", icon: "Trophy" },
];

export const MAX_LEVEL = 50;