// Deterministic story engine for active expeditions.
// Templates × slot pools = thousands of unique events per biome.
// Same (runId, index) always returns the same event — narrative is stable across reopens.

export type Biome =
  | "mountain"
  | "desert"
  | "forest"
  | "sanctuary"
  | "night"
  | "coast"
  | "market"
  | "forge"
  | "hall";

export type Weather =
  | "snow"
  | "dust"
  | "leaves"
  | "light"
  | "stars"
  | "mist"
  | "sparks"
  | "fireflies";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

export type StoryEvent = {
  index: number;
  text: string;
  icon: StoryIcon;
  /** ms since started_at when this event "happens" */
  at: number;
};

export type StoryIcon =
  | "footprints"
  | "sparkles"
  | "wind"
  | "leaf"
  | "mountain"
  | "sun"
  | "moon"
  | "stars"
  | "heart"
  | "gift"
  | "feather"
  | "flame"
  | "droplets"
  | "bird"
  | "compass";

// ---------- PRNG ----------

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ---------- Biome mapping ----------

const BIOME_BY_KEYWORD: ReadonlyArray<[RegExp, Biome, Weather, DayPhase]> = [
  // forge first — "forja" wins over generic "vale"
  [/forja|fornalha/, "forge", "sparks", "dusk"],
  // night-themed before forest (selva-do-luar)
  [/aurora|luar|estrela|lua|noite/, "night", "stars", "night"],
  // mountain
  [/cume|monte|pico|abismo|tundra|balao|vulc/, "mountain", "snow", "day"],
  // desert
  [/deserto|caravana|areia|dunas/, "desert", "dust", "day"],
  // coast/water
  [/praia|lago|cachoeira|ilha|oceano|cristal/, "coast", "mist", "day"],
  // sanctuary / ruins / scholarly
  [/santuario|observatorio|biblioteca|templo|ruina|cripta|catacumb/, "sanctuary", "light", "dawn"],
  // hall / mirrors / labyrinth
  [/salao|labirinto|espelho/, "hall", "light", "dusk"],
  // market / village / circus / farm
  [/bazar|mercado|vila|circo|fazenda|moinho|caravana/, "market", "leaves", "day"],
  // forest (last — fallback for any "floresta", "jardim", "bambu", etc.)
  [
    /floresta|jardim|bambu|vaga-lume|libelula|borboleta|pomar|mata|selva|cogumelo|coelho|clareira|estufa|tartaruga/,
    "forest",
    "fireflies",
    "day",
  ],
];

export function resolveBiome(slug: string): {
  biome: Biome;
  weather: Weather;
  startPhase: DayPhase;
} {
  for (const [re, b, w, p] of BIOME_BY_KEYWORD) {
    if (re.test(slug)) return { biome: b, weather: w, startPhase: p };
  }
  return { biome: "forest", weather: "leaves", startPhase: "day" };
}

// ---------- Slot pools per biome ----------

type Pool = {
  creature: readonly string[];
  place: readonly string[];
  action: readonly string[];
  discovery: readonly string[];
  mood: readonly string[];
};

const COMMON_MOOD = [
  "com olhar atento",
  "respirando fundo",
  "em silêncio reverente",
  "com as orelhas em alerta",
  "balançando o rabo devagar",
  "curioso como sempre",
  "passo a passo",
  "com calma",
  "sem pressa",
  "com o coração leve",
  "encantado",
  "atento ao caminho",
] as const;

const POOLS: Record<Biome, Pool> = {
  mountain: {
    creature: [
      "uma cabra-da-montanha",
      "uma águia",
      "um carneiro selvagem",
      "uma raposa branca",
      "um falcão",
      "uma marmota",
      "um lince da neve",
      "um bode dourado",
      "um corvo curioso",
      "uma andorinha gelada",
      "uma alpaca tímida",
      "um pequeno urso pardo",
    ],
    place: [
      "uma fenda de gelo",
      "um pico solitário",
      "uma cabana de pedra",
      "uma trilha congelada",
      "um cume nevado",
      "uma cascata gelada",
      "uma rocha esculpida pelo vento",
      "um campo de neve fresca",
      "um mirante de granito",
      "um vale escondido",
      "uma ponte de gelo",
      "uma gruta luminosa",
    ],
    action: [
      "escalou",
      "atravessou",
      "subiu cuidadosamente",
      "explorou",
      "contornou",
      "saltou sobre",
      "descansou perto de",
      "olhou de cima",
      "rastreou pegadas até",
      "encontrou abrigo em",
    ],
    discovery: [
      "um cristal de neve gigante",
      "uma pena dourada",
      "uma pegada antiga",
      "um musgo prateado",
      "uma flor que resiste ao gelo",
      "uma trilha esquecida",
      "um cajado de pastor",
      "uma pedra com inscrições",
      "uma vista que tira o fôlego",
      "um eco distante",
    ],
    mood: COMMON_MOOD,
  },
  desert: {
    creature: [
      "um camelo amistoso",
      "uma raposa-do-deserto",
      "um escaravelho dourado",
      "um lagarto colorido",
      "uma cobra-areia tranquila",
      "um falcão peregrino",
      "um pequeno fennec",
      "uma tartaruga do deserto",
      "um beija-flor sedento",
      "uma andorinha do oásis",
    ],
    place: [
      "uma duna alta",
      "um oásis distante",
      "uma palmeira solitária",
      "uma rocha vermelha",
      "um poço esquecido",
      "um templo de areia",
      "uma caravana parada",
      "um sopé de morro",
      "um leito seco de rio",
      "uma planície dourada",
    ],
    action: [
      "atravessou",
      "marchou por",
      "descansou à sombra de",
      "bebeu água perto de",
      "seguiu as estrelas até",
      "encontrou refúgio em",
      "explorou",
      "contornou",
      "deitou-se sobre",
    ],
    discovery: [
      "uma fonte cristalina",
      "tâmaras maduras",
      "um mapa em pergaminho",
      "uma moeda antiga",
      "uma cesta com pão",
      "uma pena de íbis",
      "uma pedra azul brilhante",
      "uma rosa do deserto",
      "uma sombra acolhedora",
    ],
    mood: COMMON_MOOD,
  },
  forest: {
    creature: [
      "um veado curioso",
      "um coelho amigável",
      "uma família de esquilos",
      "uma coruja sábia",
      "um beija-flor",
      "um sapo cantor",
      "uma joaninha brilhante",
      "um cervo branco",
      "uma raposa ruiva",
      "uma família de pássaros",
      "uma borboleta azul",
      "um filhote de guaxinim",
    ],
    place: [
      "uma clareira ensolarada",
      "um tronco musgoso",
      "um riacho de águas claras",
      "um carvalho ancião",
      "um campo de cogumelos",
      "uma trilha de pétalas",
      "uma ponte de cipós",
      "um arbusto florido",
      "uma touceira de bambu",
      "um vale verde",
    ],
    action: [
      "correu por",
      "atravessou",
      "farejou",
      "explorou",
      "subiu em",
      "descansou sob",
      "seguiu o canto de",
      "olhou através de",
    ],
    discovery: [
      "uma semente luminosa",
      "frutas vermelhas maduras",
      "uma pena colorida",
      "um cogumelo brilhante",
      "um ninho vazio",
      "uma teia de orvalho",
      "um galho perfeito",
      "um pequeno coração de madeira",
      "uma trilha de formigas trabalhadoras",
    ],
    mood: COMMON_MOOD,
  },
  sanctuary: {
    creature: [
      "uma pomba branca",
      "um gato dócil",
      "um pardal mansinho",
      "uma andorinha",
      "um cordeirinho",
      "uma ovelha calma",
      "um pequeno rouxinol",
    ],
    place: [
      "um vitral colorido",
      "um corredor de pedra",
      "uma fonte interna",
      "um pátio iluminado",
      "um jardim claustral",
      "um arco antigo",
      "uma escadaria de mármore",
      "uma biblioteca silenciosa",
      "uma capela aconchegante",
      "um sino esquecido",
    ],
    action: [
      "caminhou em silêncio por",
      "contemplou",
      "deitou-se diante de",
      "explorou suavemente",
      "sentou-se perto de",
      "atravessou na ponta das patas",
    ],
    discovery: [
      "um livro encadernado em couro",
      "uma vela acesa",
      "um pergaminho enrolado",
      "um banco de madeira polida",
      "um vitral retratando a aurora",
      "um símbolo de paz",
      "uma cruz de madeira",
      "um cálice dourado",
      "uma melodia distante",
    ],
    mood: COMMON_MOOD,
  },
  night: {
    creature: [
      "um vagalume curioso",
      "uma coruja-de-prata",
      "um morcego frugívoro",
      "uma raposa noturna",
      "um gato preto e branco",
      "uma mariposa enorme",
    ],
    place: [
      "um campo iluminado pela lua",
      "uma colina estrelada",
      "uma clareira de luar",
      "uma ponte sob o céu noturno",
      "uma cachoeira refletindo a aurora",
      "um lago espelhado",
    ],
    action: [
      "caminhou sob",
      "contemplou",
      "atravessou",
      "sentou-se diante de",
      "explorou com cuidado",
    ],
    discovery: [
      "uma constelação nunca vista",
      "uma estrela cadente",
      "uma pena prateada",
      "uma flor que só abre à noite",
      "um reflexo perfeito da lua",
      "uma melodia trazida pelo vento",
    ],
    mood: COMMON_MOOD,
  },
  coast: {
    creature: [
      "uma tartaruga marinha",
      "uma gaivota brincalhona",
      "um caranguejo dançarino",
      "um polvo curioso",
      "um peixe colorido",
      "uma estrela-do-mar",
      "um golfinho amistoso",
      "um pelicano sereno",
    ],
    place: [
      "a beira da água",
      "uma poça cristalina",
      "uma faixa de areia branca",
      "uma rocha coberta de conchas",
      "um coral colorido",
      "um cais de madeira",
      "uma cachoeira",
      "uma laguna calma",
    ],
    action: [
      "mergulhou em",
      "brincou perto de",
      "atravessou",
      "descansou sobre",
      "explorou",
      "perseguiu bolhas em",
    ],
    discovery: [
      "uma concha perfeita",
      "uma pérola minúscula",
      "um pedaço de coral",
      "uma garrafinha com bilhete",
      "um seixo polido",
      "um arco-íris na névoa",
    ],
    mood: COMMON_MOOD,
  },
  market: {
    creature: [
      "um gato mercador",
      "uma família de coelhos",
      "uma cachorra simpática",
      "um papagaio falante",
      "uma cabra brincalhona",
      "um pintinho desgarrado",
    ],
    place: [
      "uma barraca de ervas",
      "uma cesta de pães",
      "um carrinho de frutas",
      "uma tenda colorida",
      "um mercante sorridente",
      "um músico de rua",
      "uma fonte central",
      "uma praça empedrada",
    ],
    action: [
      "passeou por",
      "cheirou",
      "experimentou",
      "ajudou em",
      "fez amizade em",
      "trotou alegremente por",
    ],
    discovery: [
      "um pãozinho doce",
      "uma fita colorida",
      "um sino de bronze",
      "uma moeda de cobre",
      "um sache de ervas",
      "uma cesta com mel",
      "um brinquedo de madeira",
    ],
    mood: COMMON_MOOD,
  },
  forge: {
    creature: [
      "um cão de guarda calmo",
      "um gato cinza da forja",
      "uma andorinha que faz ninho nas vigas",
      "um esquilo curioso",
    ],
    place: [
      "uma bigorna polida",
      "uma fornalha quente",
      "um martelo pendurado",
      "uma pilha de ferraduras",
      "um balde de água fumegante",
      "um tronco de carvalho",
      "uma janela aberta para o vale",
    ],
    action: [
      "observou",
      "passeou ao lado de",
      "encostou-se em",
      "ajudou perto de",
      "descansou junto a",
    ],
    discovery: [
      "uma ferradura nova",
      "uma faísca dourada",
      "uma medalha gravada",
      "uma chave antiga",
      "um martelo em miniatura",
      "uma corrente bem trabalhada",
    ],
    mood: COMMON_MOOD,
  },
  hall: {
    creature: [
      "um pequeno camundongo educado",
      "uma andorinha que voou pela janela aberta",
      "um gato real",
      "uma borboleta perdida",
    ],
    place: [
      "um espelho gigante",
      "um candelabro dourado",
      "uma escadaria curva",
      "um piso de mármore polido",
      "uma tapeçaria antiga",
      "um trono empoeirado",
      "um lustre de cristal",
    ],
    action: [
      "passeou diante de",
      "deitou-se sobre",
      "olhou seu reflexo em",
      "explorou",
      "atravessou solenemente",
    ],
    discovery: [
      "uma coroa pequena",
      "uma pena de pavão",
      "um anel esquecido",
      "um relógio que ainda funciona",
      "um retrato que sorri de volta",
    ],
    mood: COMMON_MOOD,
  },
};

// ---------- Templates ----------

type Template = { text: string; icon: StoryIcon };

const TEMPLATES: readonly Template[] = [
  // exploration
  { text: "Seu pet {action} {place} {mood}.", icon: "footprints" },
  { text: "Seguindo a trilha, seu pet chegou perto de {place}.", icon: "compass" },
  { text: "{place_cap} apareceu no horizonte. Seu pet {action} sem pressa.", icon: "wind" },
  { text: "Um vento suave guiou seu pet até {place}.", icon: "wind" },

  // encounters
  { text: "{creature_cap} cruzou o caminho. Seu pet observou {mood}.", icon: "heart" },
  { text: "Seu pet fez amizade com {creature} perto de {place}.", icon: "heart" },
  { text: "{creature_cap} acompanhou seu pet por um trecho do caminho.", icon: "bird" },

  // discoveries
  { text: "Seu pet encontrou {discovery} junto a {place}.", icon: "sparkles" },
  { text: "Entre {place} e o caminho, brilhava {discovery}.", icon: "sparkles" },
  { text: "Uma surpresa: {discovery}, esquecida ali há tempos.", icon: "gift" },
  { text: "Seu pet farejou e descobriu {discovery}.", icon: "sparkles" },

  // contemplation
  { text: "Seu pet parou diante de {place} e contemplou em silêncio.", icon: "sun" },
  { text: "Um momento de descanso ao lado de {place}.", icon: "leaf" },
  { text: "Seu pet respirou fundo. {place_cap} era ainda mais bonita de perto.", icon: "feather" },

  // weather / atmosphere
  { text: "O céu mudou de cor enquanto seu pet caminhava por {place}.", icon: "sun" },
  { text: "Uma brisa morna passou por {place}.", icon: "wind" },
  { text: "A luz dourada banhou {place} por um instante.", icon: "sun" },

  // night
  { text: "Sob as estrelas, seu pet {action} {place}.", icon: "stars" },
  { text: "A lua iluminou {place}. Seu pet ficou {mood}.", icon: "moon" },
];

// Rare special templates (~1 in 7 chance to override at certain indices)
const SPECIAL_TEMPLATES: readonly Template[] = [
  { text: "Seu pet encontrou {item} brilhando entre {place}.", icon: "gift" },
  { text: "Olhou para o céu por um longo instante. Algo bom se aproxima.", icon: "heart" },
  { text: "Seu pet ajudou {creature} e ganhou um amigo de verdade.", icon: "heart" },
  { text: "Encontrou um lugar perfeito pra um cochilo curto.", icon: "moon" },
];

// ---------- Pacing ----------

export function eventIntervalMs(difficulty: string): number {
  switch (difficulty) {
    case "extreme":
      return 90 * 1000; // 1.5min
    case "hard":
      return 120 * 1000; // 2min
    case "medium":
      return 150 * 1000; // 2.5min
    default:
      return 180 * 1000; // 3min
  }
}

// ---------- Renderer ----------

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fill(template: string, rng: () => number, pool: Pool, itemLabel: string | null): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (key === "item") return itemLabel ?? pick(rng, pool.discovery);
    if (key === "place_cap") return cap(pick(rng, pool.place));
    if (key === "creature_cap") return cap(pick(rng, pool.creature));
    const k = key as keyof Pool;
    if (k in pool) return pick(rng, pool[k]);
    return "";
  });
}

export function getEventAt(
  runId: string,
  index: number,
  ctx: { slug: string; itemRewardLabel: string | null; difficulty: string },
): StoryEvent {
  const { biome } = resolveBiome(ctx.slug);
  const pool = POOLS[biome];
  const seed = hashStr(`${runId}:${index}`);
  const rng = mulberry32(seed);

  // ~15% chance of special template (or 100% if it's a rewarded item event landing)
  const useSpecial = rng() < 0.15;
  const tpl = useSpecial ? pick(rng, SPECIAL_TEMPLATES) : pick(rng, TEMPLATES);

  const text = fill(tpl.text, rng, pool, ctx.itemRewardLabel);

  return {
    index,
    text,
    icon: tpl.icon,
    at: index * eventIntervalMs(ctx.difficulty),
  };
}

// ---------- Day phase by progress ----------

export function phaseAtProgress(pct: number, start: DayPhase): DayPhase {
  // pct 0..100. We progress through phases starting at `start`.
  const order: DayPhase[] = ["dawn", "day", "dusk", "night"];
  const startIdx = order.indexOf(start);
  const step = Math.min(3, Math.floor(pct / 25));
  return order[(startIdx + step) % order.length];
}

export const PHASE_OVERLAY: Record<DayPhase, string> = {
  dawn: "linear-gradient(to bottom, rgba(255,170,120,0.25), rgba(80,60,140,0.15))",
  day: "linear-gradient(to bottom, rgba(180,220,255,0.10), rgba(0,0,0,0.05))",
  dusk: "linear-gradient(to bottom, rgba(255,140,90,0.30), rgba(80,30,90,0.25))",
  night: "linear-gradient(to bottom, rgba(20,30,80,0.55), rgba(0,0,30,0.65))",
};

/** Color wash applied with soft-light blend — gives a global temperature shift. */
export const PHASE_TINT: Record<DayPhase, string> = {
  dawn: "rgba(255,170,120,0.35)",
  day: "rgba(255,255,255,0.0)",
  dusk: "rgba(255,110,70,0.42)",
  night: "rgba(30,40,90,0.55)",
};

/** Ambient particle layer that crossfades when the day phase changes. */
export const PHASE_AMBIENT: Record<DayPhase, Weather> = {
  dawn: "light",
  day: "dust",
  dusk: "sparks",
  night: "stars",
};

/** Density multiplier for the base weather, per phase. */
export const PHASE_DENSITY: Record<DayPhase, number> = {
  dawn: 0.85,
  day: 1.0,
  dusk: 0.95,
  night: 0.7,
};

export const PHASE_ORDER: readonly DayPhase[] = ["dawn", "day", "dusk", "night"];
