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
  life_verse: null,
  faith_moment: null,
  testimony: null,
  participates: [],
  spiritual_routine: [],
  church_frequency: null,
  ministry: null,
  ministry_other: null,
  has_calling: null,
  calling_description: null,
  seeking: null,
  pace: null,
  love_language: null,
  wants_marriage: null,
  wants_children: null,
  children_count: null,
  living_place: null,
  life_goals: [],
  introversion: null,
  energy: null,
  communication: null,
  style: null,
  hobbies: null,
  favorite_worships: null,
  worship_style: null,
  free_time: null,
  routine: null,
  available_time: null,
  in_relationship_iam: null,
  essential_quality: null,
  non_negotiable: null,
  willing_to_build: null,
};

type Opt = { v: string; l: string };

export const FAITH_MOMENT: Opt[] = [
  { v: "recomecando", l: "Recomeçando" },
  { v: "crescimento", l: "Em crescimento" },
  { v: "firmado", l: "Firmado" },
  { v: "restauracao", l: "Em restauração" },
  { v: "voltando", l: "Voltando para Deus" },
  { v: "buscando_direcao", l: "Buscando direção" },
  { v: "vivendo_restauracao", l: "Vivendo restauração" },
  { v: "fortalecendo", l: "Fortalecendo a fé" },
];
export const PARTICIPATES: Opt[] = [
  { v: "celula", l: "Célula" },
  { v: "ministerio", l: "Ministério" },
  { v: "evangelismo", l: "Evangelismo" },
  { v: "voluntariado", l: "Voluntariado" },
  { v: "jovens", l: "Grupo de jovens" },
  { v: "casais_familia", l: "Casais/família" },
  { v: "recepcao", l: "Recepção" },
  { v: "acao_social", l: "Ação social" },
  { v: "midia", l: "Mídia" },
  { v: "louvor", l: "Louvor" },
  { v: "intercessao", l: "Intercessão" },
];
export const SPIRITUAL_ROUTINE: Opt[] = [
  { v: "oracao", l: "Oração" },
  { v: "leitura", l: "Leitura bíblica" },
  { v: "devocional", l: "Devocional" },
  { v: "jejum", l: "Jejum" },
  { v: "oracao_manha", l: "Oração pela manhã" },
  { v: "plano_biblico", l: "Plano bíblico" },
  { v: "culto_online", l: "Culto online" },
  { v: "anotacoes", l: "Anotações/devocional" },
  { v: "louvor_casa", l: "Louvor em casa" },
];
export const CHURCH_FREQUENCY: Opt[] = [
  { v: "1x", l: "1x por semana" },
  { v: "2x+", l: "2x ou mais" },
  { v: "frequente", l: "Frequente em atividades" },
  { v: "domingos", l: "Aos domingos" },
  { v: "quase_todos", l: "Quase todos os cultos" },
  { v: "celula_culto", l: "Célula + culto" },
  { v: "voltando", l: "Estou voltando" },
];
export const MINISTRY: Opt[] = [
  { v: "louvor", l: "Louvor" },
  { v: "ensino", l: "Ensino" },
  { v: "intercessao", l: "Intercessão" },
  { v: "midia", l: "Mídia" },
  { v: "jovens", l: "Jovens" },
  { v: "infantil", l: "Infantil" },
  { v: "danca", l: "Dança" },
  { v: "teatro", l: "Teatro" },
  { v: "acao_social", l: "Ação social" },
  { v: "diaconato", l: "Diaconato" },
  { v: "comunicacao", l: "Comunicação" },
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
  { v: "conhecer_calma", l: "Conhecer com calma" },
  { v: "namoro_proposito", l: "Namoro com propósito" },
  { v: "amizade_primeiro", l: "Construir amizade primeiro" },
  { v: "preparado_casar", l: "Preparado para casar" },
];
export const PACE: Opt[] = [
  { v: "sem_pressa", l: "Sem pressa" },
  { v: "conhecendo", l: "Conhecendo" },
  { v: "objetivo_claro", l: "Objetivo claro" },
  { v: "devagar_oracao", l: "Devagar e com oração" },
  { v: "conversar_primeiro", l: "Conversar primeiro" },
  { v: "com_intencao", l: "Com intenção" },
  { v: "sem_enrolacao", l: "Sem enrolação, com respeito" },
];
export const LOVE_LANGUAGE: Opt[] = [
  { v: "palavras", l: "Palavras de afirmação" },
  { v: "tempo", l: "Tempo de qualidade" },
  { v: "presentes", l: "Presentes" },
  { v: "servico", l: "Atos de serviço" },
  { v: "toque", l: "Toque físico" },
  { v: "cuidado_diario", l: "Cuidado no dia a dia" },
  { v: "oracao_juntos", l: "Oração juntos" },
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
  { v: "mesma_regiao", l: "Mesma região" },
  { v: "aceito_distancia", l: "Aceito distância" },
  { v: "mudaria_proposito", l: "Mudaria por propósito" },
  { v: "direcao_deus", l: "Depende da direção de Deus" },
];
export const LIFE_GOALS: Opt[] = [
  { v: "familia", l: "Família" },
  { v: "ministerio", l: "Ministério" },
  { v: "estabilidade", l: "Estabilidade" },
  { v: "financeiro", l: "Crescimento financeiro" },
  { v: "missao", l: "Missão" },
  { v: "casa_familia", l: "Casa e família" },
  { v: "servir_igreja", l: "Servir na igreja" },
  { v: "empreender", l: "Empreender" },
  { v: "estudar", l: "Estudar mais" },
  { v: "financas_saudaveis", l: "Vida financeira saudável" },
  { v: "missoes", l: "Missões" },
  { v: "saude", l: "Cuidar da saúde" },
];
export const INTROVERSION: Opt[] = [
  { v: "introvertido", l: "Introvertido" },
  { v: "equilibrado", l: "Equilibrado" },
  { v: "extrovertido", l: "Extrovertido" },
  { v: "reservado", l: "Mais reservado" },
  { v: "depende_ambiente", l: "Depende do ambiente" },
  { v: "comunicativo", l: "Comunicativo" },
];
export const ENERGY: Opt[] = [
  { v: "calmo", l: "Calmo" },
  { v: "moderado", l: "Moderado" },
  { v: "intenso", l: "Intenso" },
  { v: "tranquilo", l: "Tranquilo" },
  { v: "animado", l: "Animado" },
  { v: "caseiro", l: "Caseiro" },
  { v: "gosta_sair", l: "Gosta de sair" },
];
export const COMMUNICATION: Opt[] = [
  { v: "direto", l: "Direto" },
  { v: "carinhoso", l: "Carinhoso" },
  { v: "reservado", l: "Reservado" },
  { v: "gosta_conversar", l: "Gosta de conversar" },
  { v: "resolve_calma", l: "Resolve com calma" },
  { v: "prefere_clareza", l: "Prefere clareza" },
  { v: "afetivo", l: "Afetivo" },
];
export const STYLE: Opt[] = [
  { v: "brincalhao", l: "Brincalhão" },
  { v: "serio", l: "Sério" },
  { v: "espiritual", l: "Espiritual" },
  { v: "racional", l: "Racional" },
  { v: "romantico", l: "Romântico" },
  { v: "familia", l: "Família" },
  { v: "espontaneo", l: "Espontâneo" },
  { v: "cuidadoso", l: "Cuidadoso" },
  { v: "bem_humorado", l: "Bem-humorado" },
];
export const WORSHIP_STYLE: Opt[] = [
  { v: "tradicional", l: "Tradicional" },
  { v: "contemporaneo", l: "Contemporâneo" },
  { v: "avivado", l: "Avivado" },
  { v: "adoracao_profunda", l: "Adoração profunda" },
  { v: "pentecostal", l: "Pentecostal" },
  { v: "gospel_nacional", l: "Gospel nacional" },
  { v: "hinos", l: "Hinos" },
  { v: "acustico", l: "Acústico" },
];
export const ROUTINE: Opt[] = [
  { v: "corrida", l: "Corrida" },
  { v: "equilibrada", l: "Equilibrada" },
  { v: "flexivel", l: "Flexível" },
  { v: "focada", l: "Focada em trabalho/igreja" },
  { v: "trabalho_igreja", l: "Trabalho e igreja" },
  { v: "estudos_igreja", l: "Estudos e igreja" },
  { v: "familia_igreja", l: "Família e igreja" },
  { v: "treino_rotina", l: "Treino e rotina" },
  { v: "agenda_flexivel", l: "Agenda flexível" },
];
export const AVAILABLE_TIME: Opt[] = [
  { v: "sim", l: "Sim, tenho tempo" },
  { v: "pouco", l: "Pouco tempo" },
  { v: "construindo", l: "Construindo isso" },
  { v: "tenho_tempo", l: "Tenho tempo para conhecer" },
  { v: "noite", l: "Prefiro conversar à noite" },
  { v: "fim_semana", l: "Fins de semana" },
  { v: "pouco_intencao", l: "Pouco tempo, mas com intenção" },
  { v: "quero_construir", l: "Quero construir isso" },
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
