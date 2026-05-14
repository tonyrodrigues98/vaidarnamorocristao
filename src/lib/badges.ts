import type { LucideIcon } from "lucide-react";
import { Sparkles, HandHeart, UserCheck, BookOpen, Heart, Gem, Flame, ShieldCheck, MessagesSquare, Handshake, MessageCircleHeart, Eye, Cross, CalendarDays } from "lucide-react";

export type BadgeCode =
  | "new_member"
  | "prayer_active"
  | "profile_complete"
  | "devotional_active"
  | "contributor"
  | "advanced_profile"
  | "faithful_heart"
  | "intercessor"
  | "spiritual_mentor"
  | "bridge_builder"
  | "open_heart"
  | "attentive_chatter"
  | "magnetic_profile"
  | "faith_ambassador"
  | "community_veteran";

export type BadgeMeta = {
  code: BadgeCode;
  name: string;
  description: string;
  bg: string;
  fg: string;
  ring: string;
  icon: LucideIcon;
  premium?: boolean;
};

export const BADGE_META: Record<BadgeCode, BadgeMeta> = {
  new_member: {
    code: "new_member",
    name: "Novo na Comunidade",
    description: "Usuário novo na comunidade",
    bg: "#0ea5a4",
    fg: "#ffffff",
    ring: "#0ea5a4",
    icon: Sparkles,
  },
  prayer_active: {
    code: "prayer_active",
    name: "Orador Ativo",
    description: "Participa ativamente dos momentos de oração",
    bg: "#fb7185",
    fg: "#ffffff",
    ring: "#fb7185",
    icon: HandHeart,
  },
  profile_complete: {
    code: "profile_complete",
    name: "Perfil Completo",
    description: "Perfil completo e bem apresentado",
    bg: "#7dd3fc",
    fg: "#0c4a6e",
    ring: "#7dd3fc",
    icon: UserCheck,
  },
  devotional_active: {
    code: "devotional_active",
    name: "Devocional Ativo",
    description: "Participa ativamente dos devocionais",
    bg: "#fbcfe8",
    fg: "#831843",
    ring: "#fbcfe8",
    icon: BookOpen,
  },
  contributor: {
    code: "contributor",
    name: "Contribuidor",
    description: "Apoia o crescimento da comunidade",
    bg: "#10b981",
    fg: "#ffffff",
    ring: "#34d399",
    icon: Heart,
    premium: true,
  },
  advanced_profile: {
    code: "advanced_profile",
    name: "Perfil Avançado",
    description: "Perfil profundo e bem preenchido",
    bg: "#a78bfa",
    fg: "#ffffff",
    ring: "#a78bfa",
    icon: Gem,
  },
  faithful_heart: {
    code: "faithful_heart",
    name: "Coração Fiel",
    description: "Login diário por 30 dias consecutivos",
    bg: "#fb7185",
    fg: "#ffffff",
    ring: "#fb7185",
    icon: Flame,
  },
  intercessor: {
    code: "intercessor",
    name: "Intercessor",
    description: "Orou por 50 pedidos da comunidade",
    bg: "#f97373",
    fg: "#ffffff",
    ring: "#f97373",
    icon: HandHeart,
  },
  spiritual_mentor: {
    code: "spiritual_mentor",
    name: "Mentor Espiritual",
    description: "25 comentários edificantes em devocionais",
    bg: "#8b5cf6",
    fg: "#ffffff",
    ring: "#8b5cf6",
    icon: ShieldCheck,
  },
  bridge_builder: {
    code: "bridge_builder",
    name: "Construtor de Pontes",
    description: "Conquistou 5 matches mútuos",
    bg: "#ec4899",
    fg: "#ffffff",
    ring: "#ec4899",
    icon: Handshake,
  },
  open_heart: {
    code: "open_heart",
    name: "Coração Aberto",
    description: "Demonstrou interesse em 10 perfis",
    bg: "#f59e0b",
    fg: "#ffffff",
    ring: "#f59e0b",
    icon: MessageCircleHeart,
  },
  attentive_chatter: {
    code: "attentive_chatter",
    name: "Conversador Atento",
    description: "Conversa ativa por 14 dias seguidos",
    bg: "#3b82f6",
    fg: "#ffffff",
    ring: "#3b82f6",
    icon: MessagesSquare,
  },
  magnetic_profile: {
    code: "magnetic_profile",
    name: "Perfil Magnético",
    description: "50 visualizações no perfil",
    bg: "#c9a84c",
    fg: "#1f2937",
    ring: "#c9a84c",
    icon: Eye,
  },
  faith_ambassador: {
    code: "faith_ambassador",
    name: "Embaixador da Fé",
    description: "Compartilhou seu testemunho completo",
    bg: "#14b8a6",
    fg: "#ffffff",
    ring: "#14b8a6",
    icon: Cross,
  },
  community_veteran: {
    code: "community_veteran",
    name: "Veterano da Comunidade",
    description: "6 meses como membro ativo",
    bg: "#059669",
    fg: "#ffffff",
    ring: "#059669",
    icon: CalendarDays,
  },
};

export const BADGE_CODES = Object.keys(BADGE_META) as BadgeCode[];