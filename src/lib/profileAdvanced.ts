export type AdvancedProfile = {
  user_id: string;
  life_verse: string | null;
  faith_moment: string | null;
  testimony: string | null;
  participates: string[] | null;
  spiritual_routine: string[] | null;
  church_frequency: string | null;
  ministry: string | null;
  ministry_other: string | null;
  has_calling: string | null;
  calling_description: string | null;
  seeking: string | null;
  pace: string | null;
  love_language: string | null;
  wants_marriage: string | null;
  wants_children: string | null;
  children_count: number | null;
  living_place: string | null;
  life_goals: string[] | null;
  introversion: string | null;
  energy: string | null;
  communication: string | null;
  style: string | null;
  hobbies: string | null;
  favorite_worships: string | null;
  worship_style: string | null;
  free_time: string | null;
  routine: string | null;
  available_time: string | null;
  in_relationship_iam: string | null;
  essential_quality: string | null;
  non_negotiable: string | null;
  willing_to_build: string | null;
};

export const EMPTY_ADVANCED: Omit<AdvancedProfile, "user_id"> = {
  life_verse: null, faith_moment: null, testimony: null,
  participates: [], spiritual_routine: [], church_frequency: null,
  ministry: null, ministry_other: null, has_calling: null, calling_description: null,
  seeking: null, pace: null, love_language: null,
  wants_marriage: null, wants_children: null, children_count: null, living_place: null, life_goals: [],
  introversion: null, energy: null, communication: null, style: null,
  hobbies: null, favorite_worships: null, worship_style: null, free_time: null,
  routine: null, available_time: null,
  in_relationship_iam: null,
  essential_quality: null, non_negotiable: null, willing_to_build: null,
};

type Opt = { v: string; l: string };

export const FAITH_MOMENT: Opt[] = [
  { v: "recomecando", l: "Recomeçando" },
  { v: "crescimento", l: "Em crescimento" },
  { v: "firmado", l: "Firmado" },
  { v: "restauracao", l: "Em restauração" },
];
export const PARTICIPATES: Opt[] = [
  { v: "celula", l: "Célula" },
  { v: "ministerio", l: "Ministério" },
  { v: "evangelismo", l: "Evangelismo" },
  { v: "voluntariado", l: "Voluntariado" },
];
export const SPIRITUAL_ROUTINE: Opt[] = [
  { v: "oracao", l: "Oração" },
  { v: "leitura", l: "Leitura bíblica" },
  { v: "devocional", l: "Devocional" },
  { v: "jejum", l: "Jejum" },
];
export const CHURCH_FREQUENCY: Opt[] = [
  { v: "1x", l: "1x por semana" },
  { v: "2x+", l: "2x ou mais" },
  { v: "frequente", l: "Frequente em atividades" },
];
export const MINISTRY: Opt[] = [
  { v: "louvor", l: "Louvor" },
  { v: "ensino", l: "Ensino" },
  { v: "intercessao", l: "Intercessão" },
  { v: "midia", l: "Mídia" },
  { v: "outro", l: "Outro" },
];
export const HAS_CALLING: Opt[] = [
  { v: "sim", l: "Sim" },
  { v: "nao_sabe", l: "Não sabe ainda" },
];
export const SEEKING: Opt[] = [
  { v: "amizade", l: "Amizade" },
  { v: "serio", l: "Relacionamento sério" },
  { v: "casamento", l: "Casamento" },
];
export const PACE: Opt[] = [
  { v: "sem_pressa", l: "Sem pressa" },
  { v: "conhecendo", l: "Conhecendo" },
  { v: "objetivo_claro", l: "Objetivo claro" },
];
export const LOVE_LANGUAGE: Opt[] = [
  { v: "palavras", l: "Palavras de afirmação" },
  { v: "tempo", l: "Tempo de qualidade" },
  { v: "presentes", l: "Presentes" },
  { v: "servico", l: "Atos de serviço" },
  { v: "toque", l: "Toque físico" },
];
export const SIM_NAO_TALVEZ: Opt[] = [
  { v: "sim", l: "Sim" },
  { v: "nao", l: "Não" },
  { v: "talvez", l: "Talvez" },
];
export const LIVING_PLACE: Opt[] = [
  { v: "mesma_cidade", l: "Mesma cidade" },
  { v: "mudar", l: "Mudar de cidade" },
  { v: "aberto", l: "Aberto" },
];
export const LIFE_GOALS: Opt[] = [
  { v: "familia", l: "Família" },
  { v: "ministerio", l: "Ministério" },
  { v: "estabilidade", l: "Estabilidade" },
  { v: "financeiro", l: "Crescimento financeiro" },
  { v: "missao", l: "Missão" },
];
export const INTROVERSION: Opt[] = [
  { v: "introvertido", l: "Introvertido" },
  { v: "equilibrado", l: "Equilibrado" },
  { v: "extrovertido", l: "Extrovertido" },
];
export const ENERGY: Opt[] = [
  { v: "calmo", l: "Calmo" },
  { v: "moderado", l: "Moderado" },
  { v: "intenso", l: "Intenso" },
];
export const COMMUNICATION: Opt[] = [
  { v: "direto", l: "Direto" },
  { v: "carinhoso", l: "Carinhoso" },
  { v: "reservado", l: "Reservado" },
];
export const STYLE: Opt[] = [
  { v: "brincalhao", l: "Brincalhão" },
  { v: "serio", l: "Sério" },
  { v: "espiritual", l: "Espiritual" },
  { v: "racional", l: "Racional" },
];
export const WORSHIP_STYLE: Opt[] = [
  { v: "tradicional", l: "Tradicional" },
  { v: "contemporaneo", l: "Contemporâneo" },
  { v: "avivado", l: "Avivado" },
];
export const ROUTINE: Opt[] = [
  { v: "corrida", l: "Corrida" },
  { v: "equilibrada", l: "Equilibrada" },
  { v: "flexivel", l: "Flexível" },
  { v: "focada", l: "Focada em trabalho/igreja" },
];
export const AVAILABLE_TIME: Opt[] = [
  { v: "sim", l: "Sim, tenho tempo" },
  { v: "pouco", l: "Pouco tempo" },
  { v: "construindo", l: "Construindo isso" },
];

export function labelOf(list: Opt[], v: string | null | undefined) {
  if (!v) return null;
  return list.find((o) => o.v === v)?.l ?? v;
}

export function labelsOf(list: Opt[], values: string[] | null | undefined) {
  if (!values || values.length === 0) return [];
  return values.map((v) => list.find((o) => o.v === v)?.l ?? v);
}

export function hasAny(...vals: Array<string | string[] | number | null | undefined>) {
  return vals.some((v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
  });
}