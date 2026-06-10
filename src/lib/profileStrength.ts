import type { LucideIcon } from "lucide-react";
import {
  Camera,
  ImagePlus,
  User as UserIcon,
  MapPin,
  Ruler,
  Heart,
  PenLine,
  Church,
  Sparkles,
  Compass,
  BookHeart,
  Frame,
} from "lucide-react";

export type StrengthProfile = {
  full_name?: string | null;
  age?: number | null;
  sex?: string | null;
  photo_url?: string | null;
  city?: string | null;
  state?: string | null;
  height_cm?: number | null;
  marital_status?: string | null;
  bio?: string | null;
  church?: string | null;
  years_baptized?: number | null;
};

export type StrengthAdvanced = {
  seeking?: string | null;
  faith_moment?: string | null;
  spiritual_routine?: string[] | null;
  worship_style?: string | null;
  essential_quality?: string | null;
} | null;

export type StrengthPreferences = {
  looking_for_bio?: string | null;
  age_min?: number | null;
  age_max?: number | null;
} | null;

type FieldWeight = {
  key: string;
  weight: number;
  has: (
    p: StrengthProfile,
    a: StrengthAdvanced,
    prefs: StrengthPreferences,
    photosCount: number,
  ) => boolean;
};

const FIELDS: FieldWeight[] = [
  { key: "name", weight: 8, has: (p) => !!p.full_name && p.full_name.trim().length > 1 },
  { key: "age", weight: 6, has: (p) => !!p.age && p.age >= 18 },
  { key: "sex", weight: 5, has: (p) => !!p.sex },
  { key: "photo", weight: 14, has: (p) => !!p.photo_url },
  { key: "city", weight: 6, has: (p) => !!p.city && !!p.state },
  { key: "height", weight: 4, has: (p) => !!p.height_cm && p.height_cm > 0 },
  { key: "marital", weight: 4, has: (p) => !!p.marital_status },
  { key: "bio", weight: 12, has: (p) => !!p.bio && p.bio.trim().length >= 20 },
  { key: "church", weight: 5, has: (p) => !!p.church && p.church.trim().length > 1 },
  { key: "baptism", weight: 3, has: (p) => p.years_baptized != null && p.years_baptized >= 0 },
  { key: "seeking", weight: 6, has: (_p, a) => !!a?.seeking },
  { key: "faith_moment", weight: 4, has: (_p, a) => !!a?.faith_moment },
  {
    key: "routine",
    weight: 3,
    has: (_p, a) => Array.isArray(a?.spiritual_routine) && (a?.spiritual_routine?.length ?? 0) > 0,
  },
  { key: "worship", weight: 2, has: (_p, a) => !!a?.worship_style },
  { key: "essential", weight: 3, has: (_p, a) => !!a?.essential_quality },
  {
    key: "prefs",
    weight: 5,
    has: (_p, _a, prefs) =>
      !!prefs &&
      ((prefs.age_min != null && prefs.age_min >= 18) ||
        (prefs.age_max != null && prefs.age_max > 0) ||
        !!prefs.looking_for_bio),
  },
  { key: "extra_photos", weight: 10, has: (_p, _a, _pr, photos) => photos >= 2 },
];

export function calculateProfileStrength(
  profile: StrengthProfile | null | undefined,
  advanced: StrengthAdvanced,
  prefs: StrengthPreferences,
  photosCount = 0,
): number {
  if (!profile) return 0;
  const totalWeight = FIELDS.reduce((s, f) => s + f.weight, 0);
  const earned = FIELDS.reduce(
    (s, f) => s + (f.has(profile, advanced, prefs, photosCount) ? f.weight : 0),
    0,
  );
  return Math.round((earned / totalWeight) * 100);
}

export function getProfileStrengthLabel(percent: number): {
  label: string;
  tone: "muted" | "rose" | "amber" | "emerald";
} {
  if (percent >= 90) return { label: "Perfil muito forte", tone: "emerald" };
  if (percent >= 70) return { label: "Perfil forte", tone: "emerald" };
  if (percent >= 40) return { label: "Perfil em crescimento", tone: "amber" };
  return { label: "Perfil começando", tone: "rose" };
}

export type ChecklistAction = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  hash?: string;
  icon: LucideIcon;
  priority: number;
};

/**
 * Returns the next most-important actions for the user based on real,
 * existing fields. Never fabricates data; only suggests when a field is empty.
 */
export function getProfileStrengthNextActions(
  profile: StrengthProfile | null | undefined,
  advanced: StrengthAdvanced,
  prefs: StrengthPreferences,
  photosCount = 0,
  flags: { freeFrameAvailable?: boolean; sawSuggestion?: boolean } = {},
): ChecklistAction[] {
  const p = profile ?? {};
  const actions: ChecklistAction[] = [];

  if (!p.photo_url) {
    actions.push({
      id: "photo",
      title: "Adicione sua foto principal",
      description: "Uma boa foto deixa seu perfil mais real e confiável.",
      ctaLabel: "Adicionar foto",
      to: "/perfil",
      icon: Camera,
      priority: 100,
    });
  }
  if (!p.full_name || p.full_name.trim().length < 2) {
    actions.push({
      id: "name",
      title: "Preencha seu nome",
      description: "Como as pessoas devem te chamar?",
      ctaLabel: "Editar",
      to: "/perfil",
      icon: UserIcon,
      priority: 95,
    });
  }
  if (!p.city || !p.state) {
    actions.push({
      id: "city",
      title: "Informe sua cidade",
      description: "Ajuda a mostrar pessoas mais próximas de você.",
      ctaLabel: "Adicionar",
      to: "/perfil",
      icon: MapPin,
      priority: 80,
    });
  }
  if (!p.marital_status) {
    actions.push({
      id: "marital",
      title: "Informe seu estado civil",
      description: "Transparência é parte de um propósito sério.",
      ctaLabel: "Selecionar",
      to: "/perfil",
      icon: Heart,
      priority: 70,
    });
  }
  if (!p.bio || p.bio.trim().length < 20) {
    actions.push({
      id: "bio",
      title: "Escreva uma bio",
      description: "Uma frase sincera ajuda as pessoas certas a te conhecerem.",
      ctaLabel: "Escrever",
      to: "/perfil",
      icon: PenLine,
      priority: 65,
    });
  }
  if (!p.church || p.church.trim().length < 2) {
    actions.push({
      id: "church",
      title: "Adicione sua igreja",
      description: "Mostre onde você caminha em fé.",
      ctaLabel: "Preencher",
      to: "/perfil",
      icon: Church,
      priority: 55,
    });
  }
  if (!advanced?.seeking) {
    actions.push({
      id: "seeking",
      title: "Diga o que você procura",
      description: "Ajuda a alinhar expectativas desde o início.",
      ctaLabel: "Definir",
      to: "/perfil",
      icon: Compass,
      priority: 50,
    });
  }
  if (!p.height_cm || p.height_cm <= 0) {
    actions.push({
      id: "height",
      title: "Informe sua altura",
      description: "Pequeno detalhe que completa seu perfil.",
      ctaLabel: "Adicionar",
      to: "/perfil",
      icon: Ruler,
      priority: 40,
    });
  }
  if (photosCount < 2) {
    actions.push({
      id: "extra_photos",
      title: "Adicione mais uma foto",
      description: "Perfis com mais fotos passam mais segurança.",
      ctaLabel: "Adicionar",
      to: "/perfil",
      icon: ImagePlus,
      priority: 45,
    });
  }
  if (flags.freeFrameAvailable) {
    actions.push({
      id: "free_frame",
      title: "Escolha sua moldura grátis",
      description: "Personalize seu perfil com uma moldura comum ou rara.",
      ctaLabel: "Resgatar",
      to: "/perfil",
      icon: Frame,
      priority: 35,
    });
  }
  if (!flags.sawSuggestion) {
    actions.push({
      id: "see_suggestion",
      title: "Ver sugestão do dia",
      description: "Conheça um perfil com valores parecidos.",
      ctaLabel: "Ver",
      to: "/pretendentes",
      icon: Sparkles,
      priority: 25,
    });
  }
  if (!prefs?.looking_for_bio) {
    actions.push({
      id: "looking_for_bio",
      title: "Descreva o que procura",
      description: "Uma frase sobre a pessoa que você busca.",
      ctaLabel: "Escrever",
      to: "/perfil",
      icon: BookHeart,
      priority: 30,
    });
  }

  return actions.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export const FREE_FRAME_CLAIM_KEY = "freeFrameClaimed:v1:";

export function hasClaimedFreeFrameLocal(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FREE_FRAME_CLAIM_KEY + userId) === "1";
  } catch {
    return false;
  }
}

export function markFreeFrameClaimedLocal(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FREE_FRAME_CLAIM_KEY + userId, "1");
  } catch {
    /* noop */
  }
}