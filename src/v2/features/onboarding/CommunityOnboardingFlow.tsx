import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ShieldCheck } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
  V2TextField,
} from "@/v2/design-system";
import { BR_STATES } from "@/lib/constants";
import {
  COMMUNITY_ONBOARDING_STEPS,
  EMPTY_COMMUNITY_ONBOARDING_ANSWERS,
  nextCommunityOnboardingStep,
  previousCommunityOnboardingStep,
  validateCommunityOnboardingStep,
  type CommunityOnboardingAnswers,
  type CommunityOnboardingRepository,
  type CommunityOnboardingStep,
} from "./contracts";

export interface CommunityOnboardingFlowProps {
  userId: string;
  repository: CommunityOnboardingRepository;
  onComplete: (result: { profileStatus: "pending" | "approved" }) => void;
}

const STEP_COPY: Record<CommunityOnboardingStep, { title: string; description: string }> = {
  identity: {
    title: "Como você quer ser chamado?",
    description: "Este nome será a base da sua identidade na comunidade.",
  },
  birth: {
    title: "Qual é a sua data de nascimento?",
    description: "A comunidade é exclusiva para pessoas com 18 anos ou mais.",
  },
  photo: {
    title: "Mostre quem você é",
    description: "A foto passa por verificação e pode seguir para revisão humana.",
  },
  location: {
    title: "De onde você participa?",
    description: "Cidade e estado ajudam a aproximar pessoas e eventos da sua região.",
  },
  introduction: {
    title: "Conte um pouco sobre você",
    description: "Uma apresentação breve ajuda a comunidade a conhecer sua história.",
  },
  faith: {
    title: "Sua caminhada de fé",
    description: "Essas informações compõem seu perfil comunitário, não uma busca romântica.",
  },
  privacy: {
    title: "Privacidade e participação",
    description: "Revise como a sua entrada funciona antes de concluir.",
  },
};

function CommunityStepFields({
  step,
  answers,
  error,
  onChange,
  onPhoto,
  photoLoading,
}: {
  step: CommunityOnboardingStep;
  answers: CommunityOnboardingAnswers;
  error: string | null;
  onChange: <Key extends keyof CommunityOnboardingAnswers>(
    key: Key,
    value: CommunityOnboardingAnswers[Key],
  ) => void;
  onPhoto: (file: File) => void;
  photoLoading: boolean;
}) {
  switch (step) {
    case "identity":
      return (
        <V2TextField
          label="Nome de exibição"
          value={answers.fullName}
          autoComplete="name"
          required
          error={error ?? undefined}
          onChange={(event) => onChange("fullName", event.target.value)}
        />
      );
    case "birth":
      return (
        <V2TextField
          label="Data de nascimento"
          type="date"
          value={answers.birthDate}
          autoComplete="bday"
          required
          error={error ?? undefined}
          onChange={(event) => onChange("birthDate", event.target.value)}
        />
      );
    case "photo":
      return (
        <div className="grid gap-4">
          {answers.photoUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={answers.photoUrl}
                alt="Prévia da sua foto de perfil"
                className="h-20 w-20 rounded-full object-cover"
              />
              <V2StatusBadge tone={answers.photoNeedsReview ? "warning" : "success"}>
                {answers.photoNeedsReview ? "Aguardando revisão" : "Verificação concluída"}
              </V2StatusBadge>
            </div>
          ) : null}
          <label className="vdn-v2-button vdn-v2-button--outline vdn-v2-button--medium w-fit">
            <Camera aria-hidden="true" size={18} />
            <span>{photoLoading ? "Verificando foto…" : "Escolher foto"}</span>
            <input
              className="vdn-v2-visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              disabled={photoLoading}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (file) onPhoto(file);
                event.target.value = "";
              }}
            />
          </label>
          {photoLoading ? (
            <V2LoadingIndicator label="Verificando e enviando foto" visibleLabel />
          ) : null}
          {error ? (
            <V2Text role="alert" tone="secondary">
              {error}
            </V2Text>
          ) : null}
        </div>
      );
    case "location":
      return (
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <V2TextField
            label="Cidade"
            value={answers.city}
            autoComplete="address-level2"
            required
            error={error ?? undefined}
            onChange={(event) => onChange("city", event.target.value)}
          />
          <div className="vdn-v2-field">
            <label className="vdn-v2-field__label" htmlFor="community-onboarding-state">
              Estado
            </label>
            <select
              id="community-onboarding-state"
              className="vdn-v2-field__control"
              value={answers.state}
              required
              onChange={(event) => onChange("state", event.target.value)}
            >
              <option value="">UF</option>
              {BR_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    case "introduction":
      return (
        <V2TextArea
          label="Apresentação"
          description={`${answers.bio.length}/600 — você pode completar depois.`}
          value={answers.bio}
          maxLength={600}
          rows={5}
          error={error ?? undefined}
          onChange={(event) => onChange("bio", event.target.value)}
        />
      );
    case "faith":
      return (
        <div className="grid gap-4">
          <V2TextField
            label="Igreja ou comunidade"
            value={answers.church}
            autoComplete="organization"
            required
            error={error ?? undefined}
            onChange={(event) => onChange("church", event.target.value)}
          />
          <V2TextField
            label="Anos desde o batismo"
            type="number"
            min={0}
            max={110}
            value={answers.yearsBaptized}
            required
            onChange={(event) => onChange("yearsBaptized", Number(event.target.value))}
          />
          <V2TextField
            label="Momento da caminhada"
            description="Opcional"
            value={answers.faithMoment}
            maxLength={120}
            onChange={(event) => onChange("faithMoment", event.target.value)}
          />
        </div>
      );
    case "privacy":
      return (
        <div className="grid gap-4">
          <V2Surface tone="subtle" padding="medium">
            <div className="grid gap-3">
              <V2Text>
                Seu perfil será enviado para revisão. A comunidade não mostra você como
                romanticamente disponível.
              </V2Text>
              <V2Text>
                O modo Namoro começa desligado. Recados anônimos também ficam desligados e só podem
                ser habilitados dentro dessa área.
              </V2Text>
            </div>
          </V2Surface>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={answers.privacyAcknowledged}
              onChange={(event) => onChange("privacyAcknowledged", event.target.checked)}
            />
            <V2Text as="span">
              Entendi como meus dados serão usados e quero participar da comunidade.
            </V2Text>
          </label>
          {error ? (
            <V2Text role="alert" tone="secondary">
              {error}
            </V2Text>
          ) : null}
        </div>
      );
  }
}

export function CommunityOnboardingFlow({
  userId,
  repository,
  onComplete,
}: CommunityOnboardingFlowProps) {
  const [step, setStep] = useState<CommunityOnboardingStep>("identity");
  const [answers, setAnswers] = useState(EMPTY_COMMUNITY_ONBOARDING_ANSWERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    repository
      .loadProgress(userId)
      .then((progress) => {
        if (!active || !progress) return;
        setAnswers((current) => ({ ...current, ...progress.answers }));
        setStep(progress.currentStep);
      })
      .catch(() => {
        if (active) setError("Não foi possível restaurar seu progresso. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, userId]);

  const stepIndex = COMMUNITY_ONBOARDING_STEPS.indexOf(step);
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / COMMUNITY_ONBOARDING_STEPS.length) * 100),
    [stepIndex],
  );

  function updateAnswer<Key extends keyof CommunityOnboardingAnswers>(
    key: Key,
    value: CommunityOnboardingAnswers[Key],
  ) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function handlePhoto(file: File) {
    setPhotoLoading(true);
    setError(null);
    try {
      const result = await repository.verifyAndUploadPhoto(userId, file);
      setAnswers((current) => ({
        ...current,
        photoUrl: result.url,
        photoNeedsReview: result.needsReview,
        photoAiVerified: result.aiVerified,
        photoAiConfidence: result.confidence,
      }));
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "Não foi possível verificar a foto agora.",
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  async function advance() {
    const validationError = validateCommunityOnboardingStep(step, answers);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (step === "privacy") {
        const result = await repository.completeCommunityOnboarding(userId, answers);
        onComplete(result);
        return;
      }
      const next = nextCommunityOnboardingStep(step);
      await repository.saveProgress(userId, next, answers);
      setStep(next);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar agora.");
    } finally {
      setSaving(false);
    }
  }

  async function goBack() {
    if (stepIndex === 0 || saving) return;
    const previous = previousCommunityOnboardingStep(step);
    setStep(previous);
    setError(null);
    try {
      await repository.saveProgress(userId, previous, answers);
    } catch {
      setError("Seu progresso local foi mantido, mas não pôde ser sincronizado.");
    }
  }

  if (loading) {
    return (
      <main>
        <V2Surface tone="elevated" elevation="one" padding="large">
          <V2LoadingIndicator label="Restaurando seu cadastro" visibleLabel />
        </V2Surface>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-2xl content-center gap-5 px-4 py-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <V2StatusBadge tone="brand">Comunidade</V2StatusBadge>
        <V2Text variant="caption" tone="muted">
          Etapa {stepIndex + 1} de {COMMUNITY_ONBOARDING_STEPS.length}
        </V2Text>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do cadastro"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-black/10"
      >
        <div className="h-full bg-[var(--v2-color-brand)]" style={{ width: `${progress}%` }} />
      </div>
      <V2Surface tone="elevated" elevation="two" padding="large">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <V2Heading level={1} size="large">
              {STEP_COPY[step].title}
            </V2Heading>
            <V2Text tone="secondary">{STEP_COPY[step].description}</V2Text>
          </div>
          <CommunityStepFields
            step={step}
            answers={answers}
            error={error}
            onChange={updateAnswer}
            onPhoto={(file) => void handlePhoto(file)}
            photoLoading={photoLoading}
          />
          <div className="flex flex-wrap justify-between gap-3">
            <V2Button
              variant="ghost"
              leadingIcon={<ArrowLeft />}
              disabled={stepIndex === 0 || saving}
              onClick={() => void goBack()}
            >
              Voltar
            </V2Button>
            <V2Button
              loading={saving}
              loadingLabel="Salvando cadastro"
              trailingIcon={step === "privacy" ? <Check /> : <ArrowRight />}
              disabled={photoLoading}
              onClick={() => void advance()}
            >
              {step === "privacy" ? "Concluir cadastro" : "Continuar"}
            </V2Button>
          </div>
        </div>
      </V2Surface>
      <div className="flex items-center justify-center gap-2">
        <ShieldCheck aria-hidden="true" size={18} />
        <V2Text variant="caption" tone="muted">
          Namoro e recados anônimos permanecem desligados.
        </V2Text>
      </div>
    </main>
  );
}
