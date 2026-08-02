/**
 * "Compatibilidade de Propósito" — comparador puro entre dois perfis.
 * Não chama backend, não usa IA, não inventa porcentagem nem score.
 * Recebe apenas dados reais já carregados na página e devolve listas de
 * pontos em comum e pontos para conversar com calma.
 */

export type CompatProfile = {
  city?: string | null;
  state?: string | null;
  church?: string | null;
  years_baptized?: number | null;
  age?: number | null;
};

export type CompatPrefs = {
  age_min?: number | null;
  age_max?: number | null;
  accepts_children?: boolean | null;
};

export type CompatInput = {
  currentProfile: CompatProfile | null | undefined;
  currentPrefs: CompatPrefs | null | undefined;
  targetProfile: CompatProfile | null | undefined;
  targetPrefs: CompatPrefs | null | undefined;
};

export type CompatItem = {
  key: string;
  title: string;
  description: string;
};

export type CompatResult = {
  commonPoints: CompatItem[];
  conversationPoints: CompatItem[];
  hasEnoughData: boolean;
};

function norm(s: string | null | undefined): string | null {
  if (!s) return null;
  const v = s.trim().toLowerCase();
  return v.length > 0 ? v : null;
}

export function getPurposeCompatibility(input: CompatInput): CompatResult {
  const { currentProfile, currentPrefs, targetProfile, targetPrefs } = input;
  const common: CompatItem[] = [];
  const talk: CompatItem[] = [];

  if (!currentProfile || !targetProfile) {
    return { commonPoints: [], conversationPoints: [], hasEnoughData: false };
  }

  let signals = 0;

  // Localização
  const cityA = norm(currentProfile.city);
  const cityB = norm(targetProfile.city);
  const stateA = norm(currentProfile.state);
  const stateB = norm(targetProfile.state);
  if (cityA && cityB) {
    signals++;
    if (cityA === cityB) {
      common.push({
        key: "same-city",
        title: "Mesma cidade",
        description: "Vocês moram na mesma cidade — encontros presenciais ficam mais simples.",
      });
    } else if (stateA && stateB && stateA === stateB) {
      common.push({
        key: "same-state",
        title: "Mesma região",
        description: "Vocês estão no mesmo estado, em cidades diferentes.",
      });
    } else if (stateA && stateB) {
      talk.push({
        key: "diff-state",
        title: "Cidades diferentes",
        description:
          "Vocês estão em estados diferentes — vale conversar sobre distância com calma.",
      });
    }
  }

  // Igreja
  const churchA = norm(currentProfile.church);
  const churchB = norm(targetProfile.church);
  if (churchA && churchB) {
    signals++;
    if (churchA === churchB) {
      common.push({
        key: "same-church",
        title: "Mesma igreja",
        description: "Vocês citaram a mesma igreja no perfil.",
      });
    } else {
      talk.push({
        key: "diff-church",
        title: "Igrejas diferentes",
        description: "Vale conversar sobre como cada um vive a sua comunidade.",
      });
    }
  }

  // Caminhada / tempo de batismo
  const ybA = currentProfile.years_baptized;
  const ybB = targetProfile.years_baptized;
  if (typeof ybA === "number" && typeof ybB === "number") {
    signals++;
    const diff = Math.abs(ybA - ybB);
    if (diff <= 3) {
      common.push({
        key: "baptism-close",
        title: "Caminhada de fé parecida",
        description: "Vocês têm tempo de caminhada cristã próximo.",
      });
    } else if (diff >= 8) {
      talk.push({
        key: "baptism-far",
        title: "Tempos de caminhada diferentes",
        description: "Há diferença no tempo de batismo — vale ouvir a história um do outro.",
      });
    }
  }

  // Visão sobre filhos (via prefs.accepts_children)
  const childA = currentPrefs?.accepts_children;
  const childB = targetPrefs?.accepts_children;
  if (typeof childA === "boolean" && typeof childB === "boolean") {
    signals++;
    if (childA && childB) {
      common.push({
        key: "kids-aligned",
        title: "Ambos abertos a filhos",
        description: "Vocês marcaram que aceitam filhos nas preferências.",
      });
    } else if (childA !== childB) {
      talk.push({
        key: "kids-diff",
        title: "Visão sobre filhos diferente",
        description: "Um aceita filhos e o outro não — vale conversar com clareza.",
      });
    }
  }

  // Faixa etária pretendida
  const ageA = currentProfile.age;
  const ageB = targetProfile.age;
  const rangeA =
    currentPrefs?.age_min != null && currentPrefs?.age_max != null
      ? [currentPrefs.age_min, currentPrefs.age_max]
      : null;
  const rangeB =
    targetPrefs?.age_min != null && targetPrefs?.age_max != null
      ? [targetPrefs.age_min, targetPrefs.age_max]
      : null;
  if (typeof ageA === "number" && typeof ageB === "number" && rangeA && rangeB) {
    signals++;
    const aInB = ageA >= rangeB[0] && ageA <= rangeB[1];
    const bInA = ageB >= rangeA[0] && ageB <= rangeA[1];
    if (aInB && bInA) {
      common.push({
        key: "age-aligned",
        title: "Faixa etária compatível",
        description: "A idade de cada um está dentro do que o outro busca.",
      });
    } else if (!aInB || !bInA) {
      talk.push({
        key: "age-diff",
        title: "Faixas de idade diferentes",
        description: "A idade de um está fora da faixa que o outro descreveu.",
      });
    }
  }

  return {
    commonPoints: common,
    conversationPoints: talk,
    hasEnoughData: signals >= 2,
  };
}
