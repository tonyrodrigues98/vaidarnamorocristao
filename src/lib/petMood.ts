import type { PetCareKind } from "@/types/petCare";

export type PetMood = { emoji: string; label: string; tone: "good" | "ok" | "low" | "critical" };

const CRITICAL: Record<PetCareKind, { emoji: string; label: string }> = {
  feed: { emoji: "🍽️", label: "morrendo de fome" },
  energy: { emoji: "🥱", label: "completamente sem energia" },
  play: { emoji: "😔", label: "muito triste e entediado" },
  hygiene: { emoji: "🛁", label: "precisando muito de um banho" },
  sleep: { emoji: "💤", label: "exausto, precisa dormir" },
  affection: { emoji: "🥺", label: "carente, querendo colo" },
};

const LOW: Record<PetCareKind, { emoji: string; label: string }> = {
  feed: { emoji: "🍪", label: "com fominha" },
  energy: { emoji: "😮‍💨", label: "meio cansado" },
  play: { emoji: "🙃", label: "entediadinho" },
  hygiene: { emoji: "🧼", label: "começando a precisar de banho" },
  sleep: { emoji: "🌙", label: "com soninho" },
  affection: { emoji: "🤍", label: "querendo um carinho" },
};

const POSITIVE_HIGH = [
  "se sentindo no auge da felicidade",
  "radiante de alegria",
  "feliz da vida com você",
  "cheio de energia e amor",
  "vivendo o melhor momento do dia",
];
const POSITIVE_MID = [
  "tranquilo e bem cuidado",
  "de boa, curtindo o dia",
  "contente do seu jeitinho",
  "satisfeito e relaxado",
  "calminho, aproveitando a companhia",
];
const NEUTRAL = [
  "meio caidinho, dá uma atenção",
  "precisando de um pouco mais de cuidado",
  "esperando você dar uma olhada nele",
];

function pickByPet(petId: string, list: string[]): string {
  // hash determinístico por dia + pet → mensagem estável de minuto a minuto
  const day = Math.floor(Date.now() / (1000 * 60 * 30));
  let h = day;
  for (let i = 0; i < petId.length; i++) h = (h * 31 + petId.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export function getPetMood(values: Record<PetCareKind, number>, petId = ""): PetMood {
  // 1) Crítico (qualquer barra <= 15)
  let worst: { kind: PetCareKind; v: number } | null = null;
  for (const k of Object.keys(values) as PetCareKind[]) {
    if (worst === null || values[k] < worst.v) worst = { kind: k, v: values[k] };
  }
  if (worst && worst.v <= 15) {
    const c = CRITICAL[worst.kind];
    return { emoji: c.emoji, label: c.label, tone: "critical" };
  }
  if (worst && worst.v <= 35) {
    const l = LOW[worst.kind];
    return { emoji: l.emoji, label: l.label, tone: "low" };
  }
  // 2) Média ponderada (ignora energia pra não dominar)
  const careKinds: PetCareKind[] = ["feed", "play", "hygiene", "sleep", "affection"];
  const avg = careKinds.reduce((s, k) => s + values[k], 0) / careKinds.length;
  if (avg >= 80) return { emoji: "😍", label: pickByPet(petId, POSITIVE_HIGH), tone: "good" };
  if (avg >= 55) return { emoji: "😊", label: pickByPet(petId, POSITIVE_MID), tone: "good" };
  if (avg >= 40) return { emoji: "🙂", label: pickByPet(petId, NEUTRAL), tone: "ok" };
  return { emoji: "😕", label: "precisando de mais atenção sua", tone: "low" };
}