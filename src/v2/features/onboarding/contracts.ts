export const COMMUNITY_ONBOARDING_VERSION = "community_onboarding_v1";
export const DATING_ONBOARDING_VERSION = "dating_membership_v2";

export const COMMUNITY_ONBOARDING_STEPS = [
  "identity",
  "birth",
  "photo",
  "location",
  "introduction",
  "faith",
  "privacy",
] as const;

export type CommunityOnboardingStep = (typeof COMMUNITY_ONBOARDING_STEPS)[number];
export type DatingMembershipStatus =
  | "inactive"
  | "active"
  | "paused"
  | "legacy_active_pending_confirmation"
  | "paused_by_commitment"
  | "restricted";

export interface CommunityOnboardingAnswers {
  fullName: string;
  birthDate: string;
  photoUrl: string;
  photoNeedsReview: boolean;
  photoAiVerified: boolean;
  photoAiConfidence: number | null;
  city: string;
  state: string;
  bio: string;
  church: string;
  yearsBaptized: number;
  faithMoment: string;
  privacyAcknowledged: boolean;
}

export interface CommunityOnboardingProgress {
  version: typeof COMMUNITY_ONBOARDING_VERSION;
  currentStep: CommunityOnboardingStep;
  answers: Partial<CommunityOnboardingAnswers>;
  completedAt: string | null;
}

export interface DatingOptInAnswers {
  sex: "masculino" | "feminino" | "";
  marital: "solteiro" | "divorciado" | "viuvo" | "";
  heightCm: number;
  seeking: string;
  pace: string;
  essentialQuality: string;
  ageMin: number;
  ageMax: number;
  locationScope: "regiao" | "brasil" | "mundo" | "personalizado";
  customStates: string[];
  acceptsChildren: boolean;
  lookingForBio: string;
  receiveAnonymous: boolean;
  explicitConsent: boolean;
}

export interface DatingMembershipSnapshot {
  status: DatingMembershipStatus;
  receiveAnonymous: boolean;
}

export interface OnboardingPhotoResult {
  url: string;
  needsReview: boolean;
  aiVerified: boolean;
  confidence: number;
}

export interface CommunityOnboardingRepository {
  loadProgress(userId: string): Promise<CommunityOnboardingProgress | null>;
  saveProgress(
    userId: string,
    currentStep: CommunityOnboardingStep,
    answers: Partial<CommunityOnboardingAnswers>,
  ): Promise<void>;
  verifyAndUploadPhoto(userId: string, file: File): Promise<OnboardingPhotoResult>;
  completeCommunityOnboarding(
    userId: string,
    answers: CommunityOnboardingAnswers,
  ): Promise<{ profileStatus: "pending" | "approved" }>;
}

export interface DatingOptInRepository {
  loadMembership(userId: string): Promise<DatingMembershipSnapshot>;
  activate(userId: string, answers: DatingOptInAnswers): Promise<DatingMembershipSnapshot>;
  pause(userId: string): Promise<DatingMembershipSnapshot>;
  deactivate(userId: string): Promise<DatingMembershipSnapshot>;
}

export const EMPTY_COMMUNITY_ONBOARDING_ANSWERS: CommunityOnboardingAnswers = {
  fullName: "",
  birthDate: "",
  photoUrl: "",
  photoNeedsReview: false,
  photoAiVerified: false,
  photoAiConfidence: null,
  city: "",
  state: "",
  bio: "",
  church: "",
  yearsBaptized: 0,
  faithMoment: "",
  privacyAcknowledged: false,
};

export const EMPTY_DATING_OPT_IN_ANSWERS: DatingOptInAnswers = {
  sex: "",
  marital: "",
  heightCm: 170,
  seeking: "",
  pace: "",
  essentialQuality: "",
  ageMin: 25,
  ageMax: 45,
  locationScope: "brasil",
  customStates: [],
  acceptsChildren: true,
  lookingForBio: "",
  receiveAnonymous: false,
  explicitConsent: false,
};

export function getAgeFromBirthDate(birthDate: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return null;
  }
  let age = today.getUTCFullYear() - year;
  const birthdayPassed =
    today.getUTCMonth() + 1 > month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  if (!birthdayPassed) age -= 1;
  return age;
}

export function nextCommunityOnboardingStep(
  currentStep: CommunityOnboardingStep,
): CommunityOnboardingStep {
  const index = COMMUNITY_ONBOARDING_STEPS.indexOf(currentStep);
  return COMMUNITY_ONBOARDING_STEPS[Math.min(index + 1, COMMUNITY_ONBOARDING_STEPS.length - 1)];
}

export function previousCommunityOnboardingStep(
  currentStep: CommunityOnboardingStep,
): CommunityOnboardingStep {
  const index = COMMUNITY_ONBOARDING_STEPS.indexOf(currentStep);
  return COMMUNITY_ONBOARDING_STEPS[Math.max(index - 1, 0)];
}

export function isCommunityOnboardingStep(value: unknown): value is CommunityOnboardingStep {
  return (
    typeof value === "string" &&
    COMMUNITY_ONBOARDING_STEPS.includes(value as CommunityOnboardingStep)
  );
}

export function validateCommunityOnboardingStep(
  step: CommunityOnboardingStep,
  answers: CommunityOnboardingAnswers,
  today = new Date(),
): string | null {
  switch (step) {
    case "identity":
      return answers.fullName.trim().length >= 2 ? null : "Informe como você quer ser chamado.";
    case "birth": {
      const age = getAgeFromBirthDate(answers.birthDate, today);
      return age !== null && age >= 18 && age <= 110
        ? null
        : "É necessário ter pelo menos 18 anos.";
    }
    case "photo":
      return answers.photoUrl ? null : "Adicione uma foto verificada para continuar.";
    case "location":
      return answers.city.trim() && /^[A-Z]{2}$/.test(answers.state)
        ? null
        : "Informe sua cidade e estado.";
    case "introduction":
      return answers.bio.trim().length <= 600
        ? null
        : "A apresentação deve ter no máximo 600 caracteres.";
    case "faith":
      if (answers.church.trim().length < 2) return "Informe sua igreja ou comunidade.";
      return Number.isInteger(answers.yearsBaptized) &&
        answers.yearsBaptized >= 0 &&
        answers.yearsBaptized <= 110
        ? null
        : "Informe há quantos anos você foi batizado.";
    case "privacy":
      return answers.privacyAcknowledged ? null : "Confirme que entendeu as regras de privacidade.";
  }
}

export function validateDatingOptIn(answers: DatingOptInAnswers): string[] {
  const errors: string[] = [];
  if (!answers.explicitConsent)
    errors.push("A ativação do Namoro precisa de confirmação explícita.");
  if (!answers.sex) errors.push("Informe seu sexo para as regras atuais do Namoro.");
  if (!answers.marital) errors.push("Informe seu estado civil para as regras atuais do Namoro.");
  if (answers.heightCm < 120 || answers.heightCm > 230) errors.push("Altura inválida.");
  if (answers.ageMin < 18 || answers.ageMax > 110 || answers.ageMax < answers.ageMin) {
    errors.push("Faixa etária inválida.");
  }
  if (answers.locationScope === "personalizado" && answers.customStates.length === 0) {
    errors.push("Escolha ao menos um estado.");
  }
  if (answers.seeking.length > 120 || answers.pace.length > 120) {
    errors.push("Preferência romântica muito longa.");
  }
  if (answers.essentialQuality.length > 120 || answers.lookingForBio.length > 600) {
    errors.push("Descrição romântica muito longa.");
  }
  return errors;
}
