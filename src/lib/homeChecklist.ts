export type HomeChecklistStep = "explore" | "devotional";

const VALID_STEPS: HomeChecklistStep[] = ["explore", "devotional"];

function storageKey(userId: string) {
  return `inicioChecklist:${userId}`;
}

export function getHomeChecklistSteps(userId: string): Set<HomeChecklistStep> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const list = raw ? (JSON.parse(raw) as HomeChecklistStep[]) : [];
    return new Set(list.filter((step) => VALID_STEPS.includes(step)));
  } catch {
    return new Set();
  }
}

export function markHomeChecklistStep(userId: string, step: HomeChecklistStep) {
  if (typeof window === "undefined") return;
  const current = getHomeChecklistSteps(userId);
  current.add(step);
  window.localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(current)));
}
