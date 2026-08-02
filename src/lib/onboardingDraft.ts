/**
 * Module-level cache for the post-signup onboarding wizard.
 * Persists across client-side navigation (no DB writes here).
 * `etapa-1` hydrates from this draft when a profile row doesn't exist yet.
 */
export type OnboardingDraft = {
  full_name: string;
  birth_iso: string; // YYYY-MM-DD
  age: number | null;
  sex: "masculino" | "feminino" | "";
  photoFile: File | null;
  photoPreview: string;
  city: string;
  state: string; // UF
  height_cm: number | null;
  marital: "solteiro" | "divorciado" | "viuvo" | "";
};

const draft: OnboardingDraft = {
  full_name: "",
  birth_iso: "",
  age: null,
  sex: "",
  photoFile: null,
  photoPreview: "",
  city: "",
  state: "",
  height_cm: null,
  marital: "",
};

export function getOnboardingDraft(): OnboardingDraft {
  return draft;
}

export function setOnboardingDraft(patch: Partial<OnboardingDraft>) {
  Object.assign(draft, patch);
}

export function clearOnboardingDraft() {
  draft.full_name = "";
  draft.birth_iso = "";
  draft.age = null;
  draft.sex = "";
  draft.photoFile = null;
  draft.photoPreview = "";
  draft.city = "";
  draft.state = "";
  draft.height_cm = null;
  draft.marital = "";
}
