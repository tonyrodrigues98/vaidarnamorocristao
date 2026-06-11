import {
  Compass,
  Crown,
  Footprints,
  Gem,
  Glasses,
  HandHeart,
  Home,
  MessageCircle,
  Shirt,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";

export type AvatarGender = "feminino" | "masculino";

export type AvatarCategoryId = "roupas" | "acessorios" | "cabelo" | "calcados" | "especiais";

export type AvatarFilterId =
  | "destaques"
  | "novidades"
  | "conjuntos"
  | "classicos"
  | "casual"
  | "social";

export type AvatarLayerKey =
  | "background"
  | "body"
  | "hairBack"
  | "outfit"
  | "shoes"
  | "accessories"
  | "hairFront"
  | "pet"
  | "effects";

export type AvatarItem = {
  id: string;
  gender: AvatarGender;
  name: string;
  category: AvatarCategoryId;
  filters: AvatarFilterId[];
  price: number;
  owned?: boolean;
  equipped?: boolean;
  favorite?: boolean;
  rarity: "classico" | "premium" | "especial";
  previewTone: string;
};

export type AvatarCategory = {
  id: AvatarCategoryId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

export const avatarCategories: AvatarCategory[] = [
  { id: "roupas", label: "Roupas", Icon: Shirt },
  { id: "acessorios", label: "Acessórios", Icon: Glasses },
  { id: "cabelo", label: "Cabelo", Icon: Sparkles },
  { id: "calcados", label: "Calçados", Icon: Footprints },
  { id: "especiais", label: "Itens Especiais", Icon: Crown },
];

export const avatarFilters: { id: AvatarFilterId; label: string }[] = [
  { id: "destaques", label: "Destaques" },
  { id: "novidades", label: "Novidades" },
  { id: "conjuntos", label: "Conjuntos" },
  { id: "classicos", label: "Clássicos" },
  { id: "casual", label: "Casual" },
  { id: "social", label: "Social" },
];

export const avatarLayerOrder: AvatarLayerKey[] = [
  "background",
  "body",
  "hairBack",
  "outfit",
  "shoes",
  "accessories",
  "hairFront",
  "pet",
  "effects",
];

export const avatarLayerZIndex: Record<AvatarLayerKey, number> = {
  background: 1,
  body: 10,
  hairBack: 14,
  outfit: 20,
  shoes: 22,
  accessories: 30,
  hairFront: 34,
  pet: 38,
  effects: 42,
};

export const avatarItems: AvatarItem[] = [
  {
    id: "f-vestido-aurora",
    gender: "feminino",
    name: "Vestido Aurora",
    category: "roupas",
    filters: ["destaques", "conjuntos", "social"],
    price: 680,
    owned: true,
    equipped: true,
    favorite: true,
    rarity: "premium",
    previewTone: "from-rose-200 via-white to-amber-100",
  },
  {
    id: "f-conjunto-graca",
    gender: "feminino",
    name: "Conjunto Graça",
    category: "roupas",
    filters: ["novidades", "casual"],
    price: 420,
    rarity: "classico",
    previewTone: "from-sky-100 via-white to-rose-100",
  },
  {
    id: "f-blazer-lirio",
    gender: "feminino",
    name: "Blazer Lírio",
    category: "roupas",
    filters: ["social", "classicos"],
    price: 540,
    rarity: "premium",
    previewTone: "from-neutral-100 via-white to-rose-100",
  },
  {
    id: "f-cabelo-luz",
    gender: "feminino",
    name: "Cabelo Luz",
    category: "cabelo",
    filters: ["destaques", "novidades"],
    price: 360,
    rarity: "classico",
    previewTone: "from-amber-100 via-white to-orange-100",
  },
  {
    id: "f-sandalia-perola",
    gender: "feminino",
    name: "Sandália Pérola",
    category: "calcados",
    filters: ["classicos", "social"],
    price: 280,
    owned: true,
    rarity: "classico",
    previewTone: "from-stone-100 via-white to-rose-50",
  },
  {
    id: "f-brinco-alianca",
    gender: "feminino",
    name: "Brinco Aliança",
    category: "acessorios",
    filters: ["destaques", "social"],
    price: 300,
    favorite: true,
    rarity: "premium",
    previewTone: "from-amber-100 via-white to-yellow-50",
  },
  {
    id: "f-bolsa-manseidao",
    gender: "feminino",
    name: "Bolsa Mansidão",
    category: "acessorios",
    filters: ["casual", "novidades"],
    price: 390,
    rarity: "classico",
    previewTone: "from-rose-100 via-white to-zinc-100",
  },
  {
    id: "f-aura-promessa",
    gender: "feminino",
    name: "Luz da Promessa",
    category: "especiais",
    filters: ["destaques", "novidades"],
    price: 980,
    rarity: "especial",
    previewTone: "from-amber-200 via-white to-rose-200",
  },
  {
    id: "m-terno-serenidade",
    gender: "masculino",
    name: "Terno Serenidade",
    category: "roupas",
    filters: ["destaques", "social"],
    price: 690,
    owned: true,
    rarity: "premium",
    previewTone: "from-slate-200 via-white to-sky-100",
  },
  {
    id: "m-camisa-oliveira",
    gender: "masculino",
    name: "Camisa Oliveira",
    category: "roupas",
    filters: ["casual", "classicos"],
    price: 360,
    equipped: true,
    rarity: "classico",
    previewTone: "from-emerald-100 via-white to-stone-100",
  },
  {
    id: "m-jaqueta-proposito",
    gender: "masculino",
    name: "Jaqueta Propósito",
    category: "roupas",
    filters: ["novidades", "casual"],
    price: 520,
    favorite: true,
    rarity: "premium",
    previewTone: "from-zinc-200 via-white to-rose-100",
  },
  {
    id: "m-cabelo-nobre",
    gender: "masculino",
    name: "Cabelo Nobre",
    category: "cabelo",
    filters: ["destaques", "classicos"],
    price: 330,
    rarity: "classico",
    previewTone: "from-stone-200 via-white to-amber-50",
  },
  {
    id: "m-sapato-honra",
    gender: "masculino",
    name: "Sapato Honra",
    category: "calcados",
    filters: ["social", "classicos"],
    price: 310,
    owned: true,
    rarity: "classico",
    previewTone: "from-neutral-200 via-white to-stone-100",
  },
  {
    id: "m-relogio-alianca",
    gender: "masculino",
    name: "Relógio Aliança",
    category: "acessorios",
    filters: ["destaques", "social"],
    price: 460,
    rarity: "premium",
    previewTone: "from-amber-100 via-white to-slate-100",
  },
  {
    id: "m-oculos-sabedoria",
    gender: "masculino",
    name: "Óculos Sabedoria",
    category: "acessorios",
    filters: ["casual", "novidades"],
    price: 290,
    rarity: "classico",
    previewTone: "from-sky-100 via-white to-zinc-100",
  },
  {
    id: "m-luz-firmamento",
    gender: "masculino",
    name: "Luz do Firmamento",
    category: "especiais",
    filters: ["destaques", "novidades"],
    price: 990,
    rarity: "especial",
    previewTone: "from-amber-200 via-white to-sky-200",
  },
];

export const avatarBottomNavItems = [
  { label: "Início", href: "/inicio", Icon: Home },
  { label: "Descobrir", href: "/pretendentes", Icon: Compass },
  { label: "Mensagens", href: "/conversas", Icon: MessageCircle },
  { label: "Oração", href: "/oracoes", Icon: HandHeart },
  { label: "Perfil", href: "/perfil", Icon: UserRound, activeIcon: Gem },
];
