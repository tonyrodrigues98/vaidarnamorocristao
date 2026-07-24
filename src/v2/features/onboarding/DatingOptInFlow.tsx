import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, HeartHandshake, Pause, Power } from "lucide-react";
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
import {
  EMPTY_DATING_OPT_IN_ANSWERS,
  validateDatingOptIn,
  type DatingMembershipSnapshot,
  type DatingOptInAnswers,
  type DatingOptInRepository,
} from "./contracts";

export interface DatingOptInFlowProps {
  userId: string;
  repository: DatingOptInRepository;
  onClose: () => void;
  onMembershipChanged?: (membership: DatingMembershipSnapshot) => void;
}

function DatingMembershipControls({
  membership,
  busy,
  onPause,
  onDeactivate,
  onReactivate,
}: {
  membership: DatingMembershipSnapshot;
  busy: boolean;
  onPause: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}) {
  const labels: Record<DatingMembershipSnapshot["status"], string> = {
    inactive: "Namoro desligado",
    active: "Namoro ativo",
    paused: "Namoro pausado",
    legacy_active_pending_confirmation: "Confirmação pendente",
    paused_by_commitment: "Pausado por Propósito Firmado",
    restricted: "Namoro restrito",
  };
  const canReview =
    membership.status === "paused" || membership.status === "legacy_active_pending_confirmation";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <V2StatusBadge
          tone={
            membership.status === "active"
              ? "success"
              : membership.status === "restricted"
                ? "danger"
                : "warning"
          }
        >
          {labels[membership.status]}
        </V2StatusBadge>
        <V2Text variant="caption" tone="muted">
          Recados anônimos: {membership.receiveAnonymous ? "permitidos" : "desligados"}
        </V2Text>
      </div>
      <V2Text>
        {membership.status === "restricted"
          ? "Uma restrição de moderação não pode ser removida pelo frontend. Procure o suporte para revisar a decisão."
          : "Pausar ou desativar o Namoro não remove você da comunidade e não apaga preferências, matches ou conversas legítimas."}
      </V2Text>
      {membership.status !== "restricted" ? (
        <div className="flex flex-wrap gap-3">
          {membership.status === "active" ? (
            <V2Button variant="outline" leadingIcon={<Pause />} disabled={busy} onClick={onPause}>
              Pausar Namoro
            </V2Button>
          ) : canReview ? (
            <V2Button leadingIcon={<Power />} disabled={busy} onClick={onReactivate}>
              {membership.status === "legacy_active_pending_confirmation"
                ? "Revisar e confirmar"
                : "Reativar com confirmação"}
            </V2Button>
          ) : null}
          <V2Button variant="destructive" disabled={busy} onClick={onDeactivate}>
            Desativar Namoro
          </V2Button>
        </div>
      ) : null}
    </div>
  );
}

export function DatingOptInFlow({
  userId,
  repository,
  onClose,
  onMembershipChanged,
}: DatingOptInFlowProps) {
  const [answers, setAnswers] = useState<DatingOptInAnswers>(EMPTY_DATING_OPT_IN_ANSWERS);
  const [membership, setMembership] = useState<DatingMembershipSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    repository
      .loadMembership(userId)
      .then((result) => {
        if (active) setMembership(result);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o estado do Namoro.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, userId]);

  function updateAnswer<Key extends keyof DatingOptInAnswers>(
    key: Key,
    value: DatingOptInAnswers[Key],
  ) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function publishMembership(next: DatingMembershipSnapshot) {
    setMembership(next);
    onMembershipChanged?.(next);
  }

  async function activate(event?: FormEvent) {
    event?.preventDefault();
    const errors = validateDatingOptIn(answers);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      publishMembership(await repository.activate(userId, answers));
    } catch (activationError) {
      setError(
        activationError instanceof Error
          ? activationError.message
          : "Não foi possível ativar o Namoro.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changeMembership(action: "pause" | "deactivate") {
    setBusy(true);
    setError(null);
    try {
      const next =
        action === "pause" ? await repository.pause(userId) : await repository.deactivate(userId);
      publishMembership(next);
      if (action === "deactivate") {
        setAnswers(EMPTY_DATING_OPT_IN_ANSWERS);
      }
    } catch (membershipError) {
      setError(
        membershipError instanceof Error
          ? membershipError.message
          : "Não foi possível alterar o Namoro.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-2xl content-center px-4">
        <V2LoadingIndicator label="Carregando modo Namoro" visibleLabel />
      </main>
    );
  }

  const isEnabled = membership !== null && membership.status !== "inactive";

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-2xl content-center gap-5 px-4 py-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <V2Button variant="ghost" leadingIcon={<ArrowLeft />} className="w-fit" onClick={onClose}>
        Voltar à comunidade
      </V2Button>
      <V2Surface tone="elevated" elevation="two" padding="large">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <V2StatusBadge tone="brand">
              <HeartHandshake aria-hidden="true" size={16} />
              Área opcional
            </V2StatusBadge>
            <V2Heading level={1} size="large">
              Modo Namoro
            </V2Heading>
            <V2Text tone="secondary">
              Ative somente se quiser participar da descoberta romântica. Isso é independente da sua
              presença na comunidade.
            </V2Text>
          </div>

          {isEnabled && membership ? (
            <DatingMembershipControls
              membership={membership}
              busy={busy}
              onPause={() => void changeMembership("pause")}
              onDeactivate={() => void changeMembership("deactivate")}
              onReactivate={() => {
                setMembership({ status: "inactive", receiveAnonymous: false });
                setAnswers((current) => ({ ...current, explicitConsent: false }));
              }}
            />
          ) : (
            <form className="grid gap-5" onSubmit={(event) => void activate(event)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="vdn-v2-field">
                  <label className="vdn-v2-field__label" htmlFor="dating-sex">
                    Sexo
                  </label>
                  <select
                    id="dating-sex"
                    className="vdn-v2-field__control"
                    value={answers.sex}
                    required
                    onChange={(event) =>
                      updateAnswer("sex", event.target.value as DatingOptInAnswers["sex"])
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
                <div className="vdn-v2-field">
                  <label className="vdn-v2-field__label" htmlFor="dating-marital">
                    Estado civil
                  </label>
                  <select
                    id="dating-marital"
                    className="vdn-v2-field__control"
                    value={answers.marital}
                    required
                    onChange={(event) =>
                      updateAnswer("marital", event.target.value as DatingOptInAnswers["marital"])
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>
                <V2TextField
                  label="Altura (cm)"
                  type="number"
                  min={120}
                  max={230}
                  value={answers.heightCm}
                  onChange={(event) => updateAnswer("heightCm", Number(event.target.value))}
                />
                <V2TextField
                  label="Qualidade essencial"
                  value={answers.essentialQuality}
                  maxLength={120}
                  onChange={(event) => updateAnswer("essentialQuality", event.target.value)}
                />
                <V2TextField
                  label="Idade mínima"
                  type="number"
                  min={18}
                  max={110}
                  value={answers.ageMin}
                  onChange={(event) => updateAnswer("ageMin", Number(event.target.value))}
                />
                <V2TextField
                  label="Idade máxima"
                  type="number"
                  min={18}
                  max={110}
                  value={answers.ageMax}
                  onChange={(event) => updateAnswer("ageMax", Number(event.target.value))}
                />
              </div>
              <div className="vdn-v2-field">
                <label className="vdn-v2-field__label" htmlFor="dating-location-scope">
                  Alcance da descoberta
                </label>
                <select
                  id="dating-location-scope"
                  className="vdn-v2-field__control"
                  value={answers.locationScope}
                  onChange={(event) =>
                    updateAnswer(
                      "locationScope",
                      event.target.value as DatingOptInAnswers["locationScope"],
                    )
                  }
                >
                  <option value="regiao">Minha região</option>
                  <option value="brasil">Brasil</option>
                  <option value="mundo">Mundo</option>
                  <option value="personalizado">Estados específicos</option>
                </select>
              </div>
              {answers.locationScope === "personalizado" ? (
                <V2TextField
                  label="Estados (separados por vírgula)"
                  placeholder="SP, MG, RJ"
                  onChange={(event) =>
                    updateAnswer(
                      "customStates",
                      event.target.value
                        .split(",")
                        .map((value) => value.trim().toUpperCase())
                        .filter(Boolean),
                    )
                  }
                />
              ) : null}
              <V2TextField
                label="O que você busca?"
                value={answers.seeking}
                maxLength={120}
                onChange={(event) => updateAnswer("seeking", event.target.value)}
              />
              <V2TextField
                label="Ritmo preferido"
                value={answers.pace}
                maxLength={120}
                onChange={(event) => updateAnswer("pace", event.target.value)}
              />
              <V2TextArea
                label="Sobre a pessoa que você espera conhecer"
                value={answers.lookingForBio}
                maxLength={600}
                onChange={(event) => updateAnswer("lookingForBio", event.target.value)}
              />
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={answers.acceptsChildren}
                  onChange={(event) => updateAnswer("acceptsChildren", event.target.checked)}
                />
                <V2Text as="span">Aceito conhecer alguém que já tenha filhos.</V2Text>
              </label>
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={answers.receiveAnonymous}
                  onChange={(event) => updateAnswer("receiveAnonymous", event.target.checked)}
                />
                <V2Text as="span">
                  Receber recados anônimos dentro do Namoro? O padrão é desligado.
                </V2Text>
              </label>
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={answers.explicitConsent}
                  onChange={(event) => updateAnswer("explicitConsent", event.target.checked)}
                />
                <V2Text as="span">
                  Quero ativar explicitamente o modo Namoro e participar da descoberta romântica.
                </V2Text>
              </label>
              {error ? (
                <V2Text role="alert" tone="secondary">
                  {error}
                </V2Text>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <V2Button type="submit" loading={busy} loadingLabel="Ativando Namoro">
                  Ativar Namoro
                </V2Button>
                <V2Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
                  Agora não
                </V2Button>
              </div>
            </form>
          )}

          {error && isEnabled ? (
            <V2Text role="alert" tone="secondary">
              {error}
            </V2Text>
          ) : null}
        </div>
      </V2Surface>
    </main>
  );
}
