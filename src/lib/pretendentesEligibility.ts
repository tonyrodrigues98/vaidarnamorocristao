import type { AppRole } from "@/lib/roles";

export type Sex = "masculino" | "feminino";

/**
 * Decide se as ações primárias de interação (mensagem anônima, presente, etc.)
 * devem ficar ocultas ao visualizar um perfil em /pretendentes/$id.
 *
 * Regra ATUAL (apenas elegibilidade geral):
 *   - Oculta quando o perfil visualizado é do mesmo sexo do visitante.
 *
 * Regra REMOVIDA (intencionalmente):
 *   - Antigamente, perfis com cargo (admin/moderador/apresentador) tinham as
 *     ações ocultas para usuários não-admin. Como esses cargos só aparecem
 *     na lista quando optam por aparecer, devem ser tratados como qualquer
 *     outro perfil em relação à interação.
 */
export function shouldHidePrimaryActions(params: {
  viewerSex: Sex | null;
  profileSex: Sex | null;
  profileRole?: AppRole | null;
  viewerIsAdmin?: boolean;
}): boolean {
  const { viewerSex, profileSex } = params;
  if (!viewerSex || !profileSex) return false;
  return profileSex === viewerSex;
}