/**
 * "Primeira Mensagem Guiada" — gera até 3 sugestões de primeira mensagem
 * para conversas vazias entre dois matches. Helper puramente local: não
 * chama IA externa, não faz fetch, não persiste nada. Usa apenas campos
 * reais do perfil do outro usuário quando disponíveis e cai para sugestões
 * genéricas, respeitosas e cristãs quando não houver dados suficientes.
 */

export type FirstMessagePartnerProfile = {
  full_name?: string | null;
  city?: string | null;
  church?: string | null;
  bio?: string | null;
  seeking?: string | null;
};

const GENERIC_SUGGESTIONS: string[] = [
  "Gostei do seu perfil. Como tem sido sua semana?",
  "Vi que você valoriza fé e família. Como isso faz parte da sua rotina?",
  "Qual foi uma resposta de Deus que marcou sua caminhada?",
];

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getFirstMessageSuggestions(
  partner: FirstMessagePartnerProfile | null | undefined,
): string[] {
  const personalized: string[] = [];
  const city = clean(partner?.city);
  const church = clean(partner?.church);
  const bio = clean(partner?.bio);
  const seeking = clean(partner?.seeking);

  if (city) {
    personalized.push(
      `Vi que você é de ${city}. Como é viver sua fé por aí?`,
    );
  }
  if (church) {
    personalized.push(
      "Vi que a fé faz parte da sua vida. Como tem sido sua caminhada com Deus?",
    );
  }
  if (bio) {
    personalized.push(
      "Sua bio me chamou atenção. O que mais você gosta de conversar quando está conhecendo alguém?",
    );
  }
  if (seeking) {
    personalized.push(
      "Vi que você busca algo com propósito. O que isso significa para você?",
    );
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...personalized, ...GENERIC_SUGGESTIONS]) {
    const v = s.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length === 3) break;
  }
  return out;
}