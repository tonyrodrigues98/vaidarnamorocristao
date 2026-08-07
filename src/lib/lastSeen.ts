// Tracks per-user "last seen" timestamps for notification badges.
// Stored in localStorage as ISO strings, scoped by user id.

export type SeenKey = "interests" | "news" | "community" | "devotional";

function storageKey(userId: string, key: SeenKey) {
  return `lastSeen:${userId}:${key}`;
}

export function getLastSeen(userId: string, key: SeenKey): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  const v = window.localStorage.getItem(storageKey(userId, key));
  return v ?? new Date(0).toISOString();
}

export function markSeen(userId: string, key: SeenKey) {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  window.localStorage.setItem(storageKey(userId, key), now);
  // Notify same-tab listeners (storage event only fires across tabs).
  window.dispatchEvent(new CustomEvent("lastSeen:update", { detail: { key } }));
}
