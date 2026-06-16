/**
 * Vida Autônoma — gerador de entradas do diário do pet.
 *
 * O diário é determinístico em relação ao estado real do pet (mood, hora,
 * streak, personalidade, últimas ações) e persiste localmente:
 *  - "seen" garante que a mesma entrada não se repete em 7 dias
 *  - "log" guarda as entradas que o usuário escolheu salvar no diário
 */

import type { PetCareKind } from "@/types/petCare";
import { PET_CARE_LABEL } from "@/types/petCare";

export type DiaryPhase = "morning" | "day" | "evening" | "night";

export type DiaryMood =
  | "happy"
  | "playful"
  | "proud"
  | "tired"
  | "sleepy"
  | "hungry"
  | "lonely"
  | "sad";

export type DiaryContext = {
  petName: string;
  mood: DiaryMood;
  phase: DiaryPhase;
  /** Dias consecutivos de cuidado (0 quando desconhecido). */
  streak: number;
  /** Slug da personalidade (opcional). */
  personality?: string | null;
  /** Última stat que o usuário interagiu — usado para variar tom. */
  lastAction?: PetCareKind | null;
  /** Quantas missões já fechou hoje. */
  missionsDone?: number;
};

export type DiaryEntry = {
  id: string;
  /** Texto com placeholders {name}, {stat}. */
  text: string;
  /** Condições mínimas — entrada só aparece se todas baterem. */
  match?: Partial<{
    mood: DiaryMood | DiaryMood[];
    phase: DiaryPhase | DiaryPhase[];
    minStreak: number;
    personality: string;
    lastAction: PetCareKind;
  }>;
  /** Peso de seleção (1 = padrão). */
  weight?: number;
};

export type LoggedEntry = {
  id: string;
  text: string;
  savedAt: string;
  phase: DiaryPhase;
  mood: DiaryMood;
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOG = 60;

/* -------------------- catálogo curado -------------------- */

const ENTRIES: DiaryEntry[] = [
  // Manhã
  { id: "morning-soft", text: "A primeira luz tocou meu pelo e me lembrou de {name}.", match: { phase: "morning" }, weight: 1.4 },
  { id: "morning-streak", text: "Acordei sabendo que {name} viria. Estou seguro.", match: { phase: "morning", minStreak: 5 }, weight: 2 },
  { id: "morning-hungry", text: "Bom dia, {name}. Cheirei algo bom em algum lugar…", match: { phase: "morning", mood: "hungry" } },
  { id: "morning-playful", text: "Hoje quero correr no tapete. Brinca comigo?", match: { phase: "morning", mood: "playful" } },

  // Tarde / dia
  { id: "day-watching", text: "Fiquei sentado vendo a luz se mover pelas paredes.", match: { phase: "day" }, weight: 1.2 },
  { id: "day-grateful", text: "Você sempre volta. Isso me ensinou a confiar.", match: { phase: "day", minStreak: 3 } },
  { id: "day-bored", text: "Hmm. Tudo parado por aqui. Cadê você, {name}?", match: { phase: "day", mood: "lonely" } },

  // Tarde-noite
  { id: "evening-soft", text: "O céu ficou cor de pêssego. Pensei em {name}.", match: { phase: "evening" }, weight: 1.4 },
  { id: "evening-tired", text: "Foi um dia bom. Já estou ficando com sono.", match: { phase: "evening", mood: "tired" } },
  { id: "evening-proud", text: "Hoje fizemos muita coisa juntos. Estou orgulhoso.", match: { phase: "evening", mood: "proud" } },

  // Noite
  { id: "night-dream", text: "Vou sonhar com nosso quarto inteiro só pra mim.", match: { phase: "night" } },
  { id: "night-quiet", text: "Boa noite, {name}. Cuidei do silêncio enquanto você não veio.", match: { phase: "night", mood: "lonely" } },
  { id: "night-rain", text: "Imaginei que estava chovendo lá fora. Foi gostoso.", match: { phase: "night", mood: "sleepy" } },

  // Mood — independente de hora
  { id: "hungry-soft", text: "Acho que minha tigela está pedindo atenção…", match: { mood: "hungry" }, weight: 1.6 },
  { id: "tired-curl", text: "Vou me enroscar um pouquinho. Volto já.", match: { mood: "tired" } },
  { id: "happy-content", text: "Por agora, está tudo certo. Obrigado, {name}.", match: { mood: "happy" }, weight: 1.2 },
  { id: "playful-tail", text: "Meu rabo balançou sozinho quando você abriu a porta.", match: { mood: "playful" } },
  { id: "lonely-watch", text: "Fiquei na janela esperando.", match: { mood: "lonely" }, weight: 1.4 },
  { id: "sad-soft", text: "Hoje pareceu mais longo. Mas você apareceu.", match: { mood: "sad" } },

  // Streak
  { id: "streak-7", text: "Sete dias seguidos. Aprendi seu cheiro de cor.", match: { minStreak: 7 }, weight: 2 },
  { id: "streak-14", text: "Duas semanas. Já decorei seus passos.", match: { minStreak: 14 }, weight: 2.4 },
  { id: "streak-30", text: "Um mês inteiro. Você virou parte do meu mundo.", match: { minStreak: 30 }, weight: 3 },

  // Genéricos (sem match) — fallback de variedade
  { id: "generic-paws", text: "Patinhas no chão fazem som de chuva fina.", weight: 0.6 },
  { id: "generic-curious", text: "Vi algo brilhando no canto. Ou foi minha imaginação.", weight: 0.6 },
  { id: "generic-window", text: "A janela tem cor de história hoje.", weight: 0.6 },
  { id: "generic-thanks", text: "Só queria te avisar: você está fazendo bonito.", weight: 0.8 },
];

/* -------------------- seleção -------------------- */

function matches(entry: DiaryEntry, ctx: DiaryContext): boolean {
  const m = entry.match;
  if (!m) return true;
  if (m.mood) {
    const arr = Array.isArray(m.mood) ? m.mood : [m.mood];
    if (!arr.includes(ctx.mood)) return false;
  }
  if (m.phase) {
    const arr = Array.isArray(m.phase) ? m.phase : [m.phase];
    if (!arr.includes(ctx.phase)) return false;
  }
  if (m.minStreak !== undefined && ctx.streak < m.minStreak) return false;
  if (m.personality && ctx.personality !== m.personality) return false;
  if (m.lastAction && ctx.lastAction !== m.lastAction) return false;
  return true;
}

function fill(text: string, ctx: DiaryContext): string {
  const stat = ctx.lastAction ? PET_CARE_LABEL[ctx.lastAction] : "cuidado";
  return text.replaceAll("{name}", ctx.petName).replaceAll("{stat}", stat);
}

/**
 * Escolhe a melhor entrada do diário para o contexto atual, evitando
 * repetir as que apareceram nos últimos 7 dias.
 */
export function pickDiaryEntry(
  ctx: DiaryContext,
  petId: string,
): { entry: DiaryEntry; text: string } | null {
  const seen = loadSeen(petId);
  const candidates = ENTRIES.filter((e) => matches(e, ctx)).filter(
    (e) => !seen[e.id] || Date.now() - seen[e.id] > SEVEN_DAYS,
  );
  const pool = candidates.length > 0 ? candidates : ENTRIES.filter((e) => matches(e, ctx));
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((acc, e) => acc + (e.weight ?? 1), 0);
  let r = Math.random() * totalWeight;
  let picked = pool[0];
  for (const e of pool) {
    r -= e.weight ?? 1;
    if (r <= 0) {
      picked = e;
      break;
    }
  }

  markSeen(petId, picked.id);
  return { entry: picked, text: fill(picked.text, ctx) };
}

/* -------------------- persistência local -------------------- */

const seenKey = (petId: string) => `pet:diary:seen:${petId}`;
const logKey = (petId: string) => `pet:diary:log:${petId}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSeen(petId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  const obj = safeParse<Record<string, number>>(window.localStorage.getItem(seenKey(petId)), {});
  // limpa entradas mais antigas que 14 dias para não estourar storage
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  let changed = false;
  for (const k of Object.keys(obj)) {
    if (obj[k] < cutoff) {
      delete obj[k];
      changed = true;
    }
  }
  if (changed) {
    try {
      window.localStorage.setItem(seenKey(petId), JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  }
  return obj;
}

function markSeen(petId: string, entryId: string) {
  if (typeof window === "undefined") return;
  const obj = loadSeen(petId);
  obj[entryId] = Date.now();
  try {
    window.localStorage.setItem(seenKey(petId), JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

export function loadDiaryLog(petId: string): LoggedEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<LoggedEntry[]>(window.localStorage.getItem(logKey(petId)), []);
}

export function saveDiaryEntry(petId: string, entry: LoggedEntry): LoggedEntry[] {
  if (typeof window === "undefined") return [];
  const log = loadDiaryLog(petId);
  // dedup por id+texto+dia
  const today = new Date(entry.savedAt).toDateString();
  const filtered = log.filter(
    (e) => !(e.id === entry.id && new Date(e.savedAt).toDateString() === today),
  );
  const next = [entry, ...filtered].slice(0, MAX_LOG);
  try {
    window.localStorage.setItem(logKey(petId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearDiaryLog(petId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(logKey(petId));
  } catch {
    /* ignore */
  }
}

/* -------------------- derivação de mood -------------------- */

export function deriveDiaryMood(
  values: Partial<Record<PetCareKind, number>>,
): DiaryMood {
  const feed = values.feed ?? 100;
  const sleep = values.sleep ?? 100;
  const play = values.play ?? 100;
  const aff = values.affection ?? 100;
  if (feed < 35) return "hungry";
  if (sleep < 30) return "tired";
  if (aff < 35) return "lonely";
  if (play < 35) return "sad";
  if (sleep < 55 && (new Date().getHours() >= 21 || new Date().getHours() < 6)) return "sleepy";
  if (play > 80 && aff > 70) return "playful";
  if (feed > 80 && sleep > 70 && aff > 80) return "proud";
  return "happy";
}

export function derivePhase(): DiaryPhase {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}