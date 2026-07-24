import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { normalizeImageFile } from "@/lib/imageNormalize";
import { verifyProfilePhoto } from "@/lib/verifyPhoto";
import {
  COMMUNITY_ONBOARDING_VERSION,
  DATING_ONBOARDING_VERSION,
  isCommunityOnboardingStep,
  type CommunityOnboardingAnswers,
  type CommunityOnboardingProgress,
  type CommunityOnboardingRepository,
  type CommunityOnboardingStep,
  type DatingMembershipSnapshot,
  type DatingMembershipStatus,
  type DatingOptInAnswers,
  type DatingOptInRepository,
} from "./contracts";

const SAFE_ERROR = "Não foi possível salvar agora. Tente novamente.";

function repositoryError(context: string, error?: unknown): Error {
  if (import.meta.env.DEV && error) {
    console.warn(`[v2-onboarding] ${context}`, { failed: true });
  }
  return new Error(SAFE_ERROR);
}

function parseProgressAnswers(value: Json): Partial<CommunityOnboardingAnswers> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as unknown as Partial<CommunityOnboardingAnswers>;
}

function parseMembership(
  value: {
    status?: string | null;
    receive_anonymous?: boolean | null;
  } | null,
): DatingMembershipSnapshot {
  const allowed = new Set<DatingMembershipStatus>([
    "inactive",
    "active",
    "paused",
    "legacy_active_pending_confirmation",
    "paused_by_commitment",
    "restricted",
  ]);
  const status = allowed.has(value?.status as DatingMembershipStatus)
    ? (value?.status as DatingMembershipStatus)
    : "inactive";
  return {
    status,
    receiveAnonymous: value?.receive_anonymous === true,
  };
}

export const communityOnboardingRepository: CommunityOnboardingRepository = {
  async loadProgress(userId) {
    const { data, error } = await supabase
      .from("community_onboarding_progress")
      .select("questionnaire_version, current_step, answers, completed_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw repositoryError("load_progress", error);
    if (
      !data ||
      data.questionnaire_version !== COMMUNITY_ONBOARDING_VERSION ||
      !isCommunityOnboardingStep(data.current_step)
    ) {
      return null;
    }
    return {
      version: COMMUNITY_ONBOARDING_VERSION,
      currentStep: data.current_step,
      answers: parseProgressAnswers(data.answers),
      completedAt: data.completed_at,
    };
  },

  async saveProgress(userId, currentStep, answers) {
    const { error } = await supabase.from("community_onboarding_progress").upsert(
      {
        user_id: userId,
        questionnaire_version: COMMUNITY_ONBOARDING_VERSION,
        current_step: currentStep,
        answers: answers as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw repositoryError("save_progress", error);
  },

  async verifyAndUploadPhoto(userId, file) {
    const normalized = await normalizeImageFile(file);
    const verdict = await verifyProfilePhoto(normalized, "main");
    if (!verdict.ok) throw new Error(verdict.reason);

    const extension = normalized.type === "image/png" ? "png" : "jpg";
    const path = `${userId}/v2-community-main.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, normalized, {
        upsert: true,
        contentType: normalized.type || "image/jpeg",
        cacheControl: "3600",
      });
    if (uploadError) throw repositoryError("upload_photo", uploadError);

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    return {
      url: `${data.publicUrl}?v=${Date.now()}`,
      needsReview: verdict.needsReview,
      aiVerified: verdict.approved,
      confidence: verdict.confidence,
    };
  },

  async completeCommunityOnboarding(_userId, answers) {
    const { data, error } = await supabase.rpc("complete_community_onboarding", {
      _questionnaire_version: COMMUNITY_ONBOARDING_VERSION,
      _full_name: answers.fullName.trim(),
      _birth_date: answers.birthDate,
      _photo_url: answers.photoUrl,
      _city: answers.city.trim(),
      _state: answers.state,
      _bio: answers.bio.trim(),
      _church: answers.church.trim(),
      _years_baptized: answers.yearsBaptized,
      _faith_moment: answers.faithMoment,
    });
    if (error || !data) throw repositoryError("complete_community", error);
    return {
      profileStatus: data.status === "approved" ? "approved" : "pending",
    };
  },
};

export const datingOptInRepository: DatingOptInRepository = {
  async loadMembership(userId) {
    const { data, error } = await supabase
      .from("dating_memberships")
      .select("status, receive_anonymous")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw repositoryError("load_dating_membership", error);
    return parseMembership(data);
  },

  async activate(_userId, answers) {
    const { data, error } = await supabase.rpc("activate_dating_membership", {
      _onboarding_version: DATING_ONBOARDING_VERSION,
      _sex: answers.sex as "masculino" | "feminino",
      _marital: answers.marital as "solteiro" | "divorciado" | "viuvo",
      _height_cm: answers.heightCm,
      _seeking: answers.seeking.trim(),
      _pace: answers.pace.trim(),
      _essential_quality: answers.essentialQuality.trim(),
      _age_min: answers.ageMin,
      _age_max: answers.ageMax,
      _location_scope: answers.locationScope,
      _custom_states: answers.customStates,
      _accepts_children: answers.acceptsChildren,
      _looking_for_bio: answers.lookingForBio.trim(),
      _receive_anonymous: answers.receiveAnonymous,
    });
    if (error || !data) throw repositoryError("activate_dating", error);
    return parseMembership(data);
  },

  async pause(_userId) {
    const { data, error } = await supabase.rpc("pause_dating_membership");
    if (error || !data) throw repositoryError("pause_dating", error);
    return parseMembership(data);
  },

  async deactivate(_userId) {
    const { data, error } = await supabase.rpc("deactivate_dating_membership");
    if (error || !data) throw repositoryError("deactivate_dating", error);
    return parseMembership(data);
  },
};

export function createCommunityProgressPayload(
  userId: string,
  currentStep: CommunityOnboardingStep,
  answers: Partial<CommunityOnboardingAnswers>,
) {
  return {
    userId,
    currentStep,
    answers,
  } as const;
}
