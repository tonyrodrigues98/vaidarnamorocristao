import type { ArcadeGameConfig } from "@/lib/petArcade";

export function createArcadeClientSeed() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function validateEntry(value: number, config: ArcadeGameConfig, balance: number) {
  return (
    Number.isInteger(value) &&
    value >= config.min_entry &&
    value <= config.max_entry &&
    value <= balance
  );
}
