import { getNativeExploreItem } from "@/config/native-explore-registry";

export const NATIVE_EXPLORE_RECENT_KEY = "vdn:native-explore:recent";
export const NATIVE_EXPLORE_RECENT_LIMIT = 5;

export type NativeExploreRecentEntry = {
  id: string;
  visitedAt: number;
};

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem">;

export function getNativeExploreStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function parseNativeExploreRecent(value: string | null): NativeExploreRecentEntry[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const unique = new Map<string, NativeExploreRecentEntry>();
    for (const candidate of parsed) {
      if (
        typeof candidate !== "object" ||
        candidate === null ||
        !("id" in candidate) ||
        !("visitedAt" in candidate) ||
        typeof candidate.id !== "string" ||
        typeof candidate.visitedAt !== "number" ||
        !Number.isFinite(candidate.visitedAt) ||
        !getNativeExploreItem(candidate.id)
      ) {
        continue;
      }
      const previous = unique.get(candidate.id);
      if (!previous || candidate.visitedAt > previous.visitedAt) {
        unique.set(candidate.id, { id: candidate.id, visitedAt: candidate.visitedAt });
      }
    }
    return [...unique.values()]
      .sort((left, right) => right.visitedAt - left.visitedAt)
      .slice(0, NATIVE_EXPLORE_RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function readNativeExploreRecent(storage?: ReadableStorage): NativeExploreRecentEntry[] {
  if (!storage) return [];
  try {
    return parseNativeExploreRecent(storage.getItem(NATIVE_EXPLORE_RECENT_KEY));
  } catch {
    return [];
  }
}

export function recordNativeExploreRecent(
  storage: WritableStorage | undefined,
  id: string,
  visitedAt = Date.now(),
): NativeExploreRecentEntry[] {
  if (!storage || !getNativeExploreItem(id) || !Number.isFinite(visitedAt)) return [];
  const next = [
    { id, visitedAt },
    ...readNativeExploreRecent(storage).filter((entry) => entry.id !== id),
  ].slice(0, NATIVE_EXPLORE_RECENT_LIMIT);
  try {
    storage.setItem(NATIVE_EXPLORE_RECENT_KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}
