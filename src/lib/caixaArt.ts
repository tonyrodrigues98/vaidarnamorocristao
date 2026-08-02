import cofreMoedas from "@/assets/caixas/cofre_moedas.png";
import capsulaXp from "@/assets/caixas/capsula_xp.png";
import bauCuidado from "@/assets/caixas/bau_cuidado.png";
import caixaCenarios from "@/assets/caixas/caixa_cenarios.png";
import caixaDecoracoes from "@/assets/caixas/caixa_decoracoes.png";
import caixaGradientes from "@/assets/caixas/caixa_gradientes.png";
import caixaComum from "@/assets/caixas/caixa_comum.png";
import caixaRara from "@/assets/caixas/caixa_rara.png";
import caixaEpica from "@/assets/caixas/caixa_epica.png";
import caixaLendaria from "@/assets/caixas/caixa_lendaria.png";
import roletaSorte from "@/assets/caixas/roleta_sorte.png";
import iniciante from "@/assets/caixas/iniciante.png";
import banner from "@/assets/caixas/banner.jpg";

/**
 * Mapa de arte cinematográfica por slug de caixa.
 * Imagens premium com fundo transparente — exibidas no card e na cerimônia.
 */
export const CAIXA_ART: Record<string, string> = {
  cofre_moedas: cofreMoedas,
  capsula_xp: capsulaXp,
  bau_cuidado: bauCuidado,
  caixa_cenarios: caixaCenarios,
  caixa_decoracoes: caixaDecoracoes,
  caixa_gradientes: caixaGradientes,
  caixa_comum: caixaComum,
  caixa_rara: caixaRara,
  caixa_epica: caixaEpica,
  caixa_lendaria: caixaLendaria,
  roleta_sorte: roletaSorte,
  // Caixa do Iniciante (única)
  iniciante,
};

export function caixaArtFor(slug: string, rarity?: string | null): string {
  return CAIXA_ART[slug] ?? (rarity === "starter" ? iniciante : iniciante);
}

export const CAIXAS_BANNER = banner;
