import {
  type AdvancedProfile,
  LOVE_LANGUAGE, SEEKING, PACE, MINISTRY, WORSHIP_STYLE, LIVING_PLACE,
  CHURCH_FREQUENCY, FAITH_MOMENT, HAS_CALLING, SIM_NAO_TALVEZ,
  PARTICIPATES, SPIRITUAL_ROUTINE, LIFE_GOALS,
  INTROVERSION, ENERGY, COMMUNICATION, STYLE,
  ROUTINE, AVAILABLE_TIME,
  labelOf,
} from "@/lib/profileAdvanced";

export type AffinityChip = { key: string; label: string };

const SCALAR_FIELDS: Array<{ field: keyof AdvancedProfile; opts: { v: string; l: string }[]; prefix?: string }> = [
  { field: "love_language", opts: LOVE_LANGUAGE },
  { field: "seeking", opts: SEEKING },
  { field: "pace", opts: PACE },
  { field: "ministry", opts: MINISTRY },
  { field: "worship_style", opts: WORSHIP_STYLE },
  { field: "living_place", opts: LIVING_PLACE },
  { field: "church_frequency", opts: CHURCH_FREQUENCY, prefix: "Igreja: " },
  { field: "faith_moment", opts: FAITH_MOMENT },
  { field: "has_calling", opts: HAS_CALLING, prefix: "Chamado: " },
  { field: "wants_marriage", opts: SIM_NAO_TALVEZ, prefix: "Casar: " },
  { field: "wants_children", opts: SIM_NAO_TALVEZ, prefix: "Filhos: " },
  { field: "introversion", opts: INTROVERSION },
  { field: "energy", opts: ENERGY, prefix: "Energia: " },
  { field: "communication", opts: COMMUNICATION },
  { field: "style", opts: STYLE },
  { field: "routine", opts: ROUTINE, prefix: "Rotina: " },
  { field: "available_time", opts: AVAILABLE_TIME, prefix: "Tempo: " },
];

const ARRAY_FIELDS: Array<{ field: keyof AdvancedProfile; opts: { v: string; l: string }[] }> = [
  { field: "participates", opts: PARTICIPATES },
  { field: "spiritual_routine", opts: SPIRITUAL_ROUTINE },
  { field: "life_goals", opts: LIFE_GOALS },
];

/** Compute affinity chips between mine and other's advanced profile. */
export function computeAffinity(
  mine: AdvancedProfile | null | undefined,
  other: AdvancedProfile | null | undefined,
): AffinityChip[] {
  if (!mine || !other) return [];
  const out: AffinityChip[] = [];
  for (const { field, opts, prefix } of SCALAR_FIELDS) {
    const a = mine[field] as string | null | undefined;
    const b = other[field] as string | null | undefined;
    if (a && b && a === b) {
      const lbl = labelOf(opts, a);
      if (lbl) out.push({ key: String(field), label: (prefix ?? "") + lbl });
    }
  }
  for (const { field, opts } of ARRAY_FIELDS) {
    const a = (mine[field] as string[] | null | undefined) ?? [];
    const b = new Set((other[field] as string[] | null | undefined) ?? []);
    for (const v of a) {
      if (b.has(v)) {
        const lbl = labelOf(opts, v);
        if (lbl) out.push({ key: `${String(field)}:${v}`, label: lbl });
      }
    }
  }
  // dedupe by key
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
}