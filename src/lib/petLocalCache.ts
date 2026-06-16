/**
 * Cache local otimista de stats do pet.
 *
 * O backend continua sendo a fonte da verdade — este cache só evita o
 * "flash de barras vazias" ao recarregar a página enquanto o fetch
 * acontece, e preserva continuidade visual para o usuário.
 */

import type { PetCareKind } from "@/types/petCare";

const VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

type CareSnapshot = {
  v: number;
  savedAt: number;
  values: Partial<Record<PetCareKind, number>>;
  streak?: number;
  missionsDone?: number;
};

const careKey = (petId: string) => `pet:care-snapshot:${petId}`;

function safe<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadCareSnapshot(petId: string): CareSnapshot | null {
  if (typeof window === "undefined") return null;
  const snap = safe<CareSnapshot | null>(window.localStorage.getItem(careKey(petId)), null);
  if (!snap || snap.v !== VERSION) return null;
  if (Date.now() - snap.savedAt > TTL_MS) return null;
  return snap;
}

export function saveCareSnapshot(
  petId: string,
  values: Partial<Record<PetCareKind, number>>,
  extra?: { streak?: number; missionsDone?: number },
) {
  if (typeof window === "undefined") return;
  try {
    const snap: CareSnapshot = {
      v: VERSION,
      savedAt: Date.now(),
      values,
      streak: extra?.streak,
      missionsDone: extra?.missionsDone,
    };
    window.localStorage.setItem(careKey(petId), JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

/** Registra a última ação que o pet recebeu — usado pelo diário. */
const lastActionKey = (petId: string) => `pet:last-action:${petId}`;

export function recordLastAction(petId: string, kind: PetCareKind) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      lastActionKey(petId),
      JSON.stringify({ kind, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function loadLastAction(petId: string): { kind: PetCareKind; at: number } | null {
  if (typeof window === "undefined") return null;
  return safe<{ kind: PetCareKind; at: number } | null>(
    window.localStorage.getItem(lastActionKey(petId)),
    null,
  );
}