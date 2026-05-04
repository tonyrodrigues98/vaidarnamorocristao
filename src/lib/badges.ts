import type { LucideIcon } from "lucide-react";
import { Sparkles, HandHeart, UserCheck, BookOpen, Heart, Gem } from "lucide-react";

export type BadgeCode =
  | "new_member"
  | "prayer_active"
  | "profile_complete"
  | "devotional_active"
  | "contributor"
  | "advanced_profile";

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
};

export const BADGE_CODES = Object.keys(BADGE_META) as BadgeCode[];