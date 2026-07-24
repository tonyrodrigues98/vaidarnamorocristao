import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Pencil, ShieldCheck } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import {
  normalizeProfileModules,
  restoreProfileModuleDefaults,
  type ProfileModule,
  type ProfileRepository,
} from "./contracts";
import { V2ProfileAvatar } from "./V2ProfileAvatar";
import { V2ProfileEditor } from "./V2ProfileEditor";
import { V2ProfileModuleCard } from "./V2ProfileModuleCard";

export function V2Profile({
  userId,
  profileUserId = userId,
  repository,
}: {
  readonly userId: string;
  readonly profileUserId?: string;
  readonly repository: ProfileRepository;
}) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["v2", "profile", userId, profileUserId] as const,
    [profileUserId, userId],
  );
  const profile = useQuery({
    queryKey,
    queryFn: () => repository.loadProfile(userId, profileUserId),
    staleTime: 60_000,
  });
  const [editing, setEditing] = useState(false);
  const [draftModules, setDraftModules] = useState<readonly ProfileModule[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!editing && profile.data) setDraftModules(profile.data.modules);
  }, [editing, profile.data]);

  const save = useMutation({
    mutationFn: () =>
      repository.saveModules(
        userId,
        normalizeProfileModules(draftModules),
        profile.data?.configurationUpdatedAt ?? null,
      ),
    onSuccess: async () => {
      setFeedback("Organização do perfil salva.");
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: () => setFeedback("O perfil mudou em outro lugar. Recarregue antes de salvar."),
  });

  if (profile.isPending) {
    return (
      <V2Surface className="vdn-v2-profile-state">
        <V2LoadingIndicator label="Carregando perfil" />
      </V2Surface>
    );
  }
  if (profile.isError) {
    return (
      <V2Surface className="vdn-v2-profile-state" role="alert">
        <V2Heading level={2} size="small">
          Perfil indisponível
        </V2Heading>
        <V2Text tone="muted">Nenhuma informação foi alterada.</V2Text>
        <V2Button variant="secondary" onClick={() => void profile.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = profile.data;
  const modules = editing ? draftModules : snapshot.modules.filter((module) => module.visible);
  const location = [snapshot.identity.city, snapshot.identity.state].filter(Boolean).join(", ");
  const nameStyle = snapshot.appearance.nameGradient
    ? {
        backgroundImage: `linear-gradient(90deg, ${snapshot.appearance.nameGradient[0]}, ${snapshot.appearance.nameGradient[1]})`,
      }
    : undefined;
  const coverStyle = snapshot.appearance.backgroundUrl
    ? { backgroundImage: `url("${snapshot.appearance.backgroundUrl.replace(/["\\]/g, "")}")` }
    : undefined;

  return (
    <div className={`vdn-v2-profile ${editing ? "vdn-v2-profile--editing" : ""}`}>
      <main className="vdn-v2-profile__preview" aria-label="Perfil comunitário">
        <section className="vdn-v2-profile-hero">
          <div className="vdn-v2-profile-hero__cover" style={coverStyle} aria-hidden="true" />
          <div className="vdn-v2-profile-hero__content">
            <V2ProfileAvatar identity={snapshot.identity} appearance={snapshot.appearance} />
            <div className="vdn-v2-profile-hero__identity">
              <div className="vdn-v2-profile-hero__name-row">
                <V2Heading
                  level={1}
                  size="large"
                  className={nameStyle ? "vdn-v2-profile-gradient-name" : undefined}
                  style={nameStyle}
                >
                  {snapshot.identity.displayName}
                </V2Heading>
                {snapshot.identity.verified ? (
                  <CheckCircle2 aria-label="Perfil verificado" />
                ) : null}
              </div>
              <div className="vdn-v2-profile-hero__meta">
                <V2StatusBadge
                  tone={snapshot.identity.presence === "online" ? "success" : "neutral"}
                >
                  {snapshot.identity.presence === "online"
                    ? "Online"
                    : snapshot.identity.presence === "recently"
                      ? "Ativo recentemente"
                      : "Offline"}
                </V2StatusBadge>
                {location ? (
                  <span>
                    <MapPin aria-hidden="true" />
                    {location}
                  </span>
                ) : null}
              </div>
              {snapshot.identity.bio ? <V2Text>{snapshot.identity.bio}</V2Text> : null}
            </div>
            {snapshot.owner ? (
              <V2Button
                variant={editing ? "secondary" : "primary"}
                leadingIcon={<Pencil />}
                onClick={() => setEditing((current) => !current)}
              >
                {editing ? "Fechar editor" : "Personalizar perfil"}
              </V2Button>
            ) : null}
          </div>
        </section>

        <section className="vdn-v2-profile__modules" aria-label="Vitrines do perfil">
          {modules
            .filter((module) => module.visible)
            .map((module) => (
              <V2ProfileModuleCard key={module.type} module={module} />
            ))}
        </section>
        {modules.filter((module) => module.visible).length === 0 ? (
          <V2Surface className="vdn-v2-profile-state">
            <ShieldCheck aria-hidden="true" />
            <V2Heading level={2} size="small">
              Perfil reservado
            </V2Heading>
            <V2Text tone="muted">Esta pessoa ainda não compartilhou vitrines com você.</V2Text>
          </V2Surface>
        ) : null}
      </main>

      {editing ? (
        <V2ProfileEditor
          modules={draftModules}
          saving={save.isPending}
          onChange={setDraftModules}
          onSave={() => save.mutate()}
          onCancel={() => {
            setDraftModules(snapshot.modules);
            setEditing(false);
          }}
          onRestore={() => setDraftModules(restoreProfileModuleDefaults(snapshot.modules))}
        />
      ) : null}
      {feedback ? (
        <p className="vdn-v2-profile__feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
