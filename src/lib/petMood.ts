import type { PetCareKind } from "@/types/petCare";
import {
  Utensils,
  Cookie,
  BatteryLow,
  BatteryWarning,
  Frown,
  Meh,
  Bath,
  Droplets,
  Moon,
  CloudMoon,
  Heart,
  HeartHandshake,
  Smile,
  Sparkles,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

export type PetMoodTone = "good" | "ok" | "low" | "critical";
export type PetMood = { Icon: LucideIcon; label: string; tone: PetMoodTone };

const CRITICAL: Record<PetCareKind, { Icon: LucideIcon; label: string }> = {
  feed: { Icon: Utensils, label: "morrendo de fome" },
  energy: { Icon: BatteryWarning, label: "completamente sem energia" },
  play: { Icon: Frown, label: "muito triste e entediado" },
  hygiene: { Icon: Bath, label: "precisando muito de um banho" },
  sleep: { Icon: Moon, label: "exausto, precisa dormir" },
  affection: { Icon: HeartHandshake, label: "carente, querendo colo" },
};

const LOW: Record<PetCareKind, { Icon: LucideIcon; label: string }> = {
  feed: { Icon: Cookie, label: "com fominha" },
  energy: { Icon: BatteryLow, label: "meio cansado" },
  play: { Icon: Meh, label: "entediadinho" },
  hygiene: { Icon: Droplets, label: "começando a precisar de banho" },
  sleep: { Icon: CloudMoon, label: "com soninho" },
  affection: { Icon: Heart, label: "querendo um carinho" },
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
    return { Icon: c.Icon, label: c.label, tone: "critical" };
  }
  if (worst && worst.v <= 35) {
    const l = LOW[worst.kind];
    return { Icon: l.Icon, label: l.label, tone: "low" };
  }
  // 2) Média ponderada (ignora energia pra não dominar)
  const careKinds: PetCareKind[] = ["feed", "play", "hygiene", "sleep", "affection"];
  const avg = careKinds.reduce((s, k) => s + values[k], 0) / careKinds.length;
  if (avg >= 80) return { Icon: Sparkles, label: pickByPet(petId, POSITIVE_HIGH), tone: "good" };
  if (avg >= 55) return { Icon: HeartPulse, label: pickByPet(petId, POSITIVE_MID), tone: "good" };
  if (avg >= 40) return { Icon: Smile, label: pickByPet(petId, NEUTRAL), tone: "ok" };
  return { Icon: Meh, label: "precisando de mais atenção sua", tone: "low" };
}