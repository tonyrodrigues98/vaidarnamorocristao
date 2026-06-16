/**
 * Tamanho relativo do pet dentro da cena do Quarto.
 *
 * Os valores foram calibrados pensando no tamanho médio de cada espécie
 * no mundo real, normalizados pra que um cachorro adulto de porte médio
 * ocupe ~30% da largura da cena (que mede 2:3 no quadro do quarto).
 * Filhotes ficam um pouco menores; adultos crescem até o limite máximo.
 *
 * Retorna `{ widthPct, anchorYPct }` — onde anchorYPct é o ponto de apoio
 * (chão) do pet em % do container.
 */

const CHAO_PCT = 92; // linha do "chão" da cena

// Escalas em % da largura da cena (frame 2:3).
// Use uma referência: cão médio adulto = 32% do quadro.
const BY_CATEGORY: Record<string, number> = {
  cachorro: 32,
  dog: 32,
  gato: 22,
  cat: 22,
  coelho: 18,
  rabbit: 18,
  hamster: 10,
  roedor: 12,
  ave: 14,
  passaro: 14,
  bird: 14,
  peixe: 14,
  fish: 14,
  reptil: 18,
  reptile: 18,
  exotico: 22,
};

// Ajustes finos por espécie comum.
const BY_SPECIES: Record<string, number> = {
  // cães
  chihuahua: 14,
  yorkshire: 14,
  poodle: 22,
  shihtzu: 18,
  beagle: 26,
  bulldog: 28,
  labrador: 38,
  pastor_alemao: 40,
  golden_retriever: 38,
  husky: 38,
  // gatos
  persa: 22,
  siames: 20,
  // pequenos
  hamster_sirio: 9,
  hamster_anao: 7,
  porquinho_da_india: 14,
  // aves
  calopsita: 12,
  periquito: 8,
  arara: 28,
};

export type StageKind = "baby" | "adult" | null | undefined;

export function getPetSizeScale(opts: {
  categorySlug?: string | null;
  speciesSlug?: string | null;
  stage?: StageKind;
}): { widthPct: number; anchorYPct: number } {
  const cat = (opts.categorySlug ?? "").toLowerCase();
  const sp = (opts.speciesSlug ?? "").toLowerCase();
  let widthPct = BY_SPECIES[sp] ?? BY_CATEGORY[cat] ?? 24;
  if (opts.stage === "baby") widthPct *= 0.65;
  // clamp pra não passar do limite da cena
  widthPct = Math.max(7, Math.min(46, widthPct));
  return { widthPct, anchorYPct: CHAO_PCT };
}
