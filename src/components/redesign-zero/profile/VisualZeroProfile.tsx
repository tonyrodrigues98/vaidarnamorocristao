import type { ChangeEvent, FormEvent, ReactNode } from "react";

import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Coins,
  Gift,
  Images,
  LockKeyhole,
  Package,
  PawPrint,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  UserRound,
} from "lucide-react";

import type { NameGradient } from "@/lib/nameGradients";
import { nameGradientStyle } from "@/lib/nameGradients";
import type { RoleColor } from "@/lib/roles";

import {
  VisualZeroActionRow,
  VisualZeroAvatar,
  VisualZeroGroupedList,
  VisualZeroHeader,
  VisualZeroHero,
  VisualZeroIconTile,
  VisualZeroInlineProgress,
  VisualZeroLoading,
  VisualZeroMediaStrip,
  VisualZeroPrimaryAction,
  VisualZeroRow,
  VisualZeroScreen,
  VisualZeroSection,
  VisualZeroSegmentedControl,
  VisualZeroStatusPill,
} from "../primitives";

export type VisualZeroProfileData = {
  full_name: string;
  age: string;
  height_cm: string;
  sex: "" | "masculino" | "feminino";
  marital: "" | "solteiro" | "divorciado" | "viuvo";
  city: string;
  state: string;
  church: string;
  years_baptized: string;
  bio: string;
};

export type VisualZeroPreferenceData = {
  age_min: string;
  age_max: string;
  location_scope: "regiao" | "brasil" | "mundo" | "personalizado";
  custom_states: string[];
  desired_quality: string;
  accepts_children: "sim" | "nao";
  looking_for_bio: string;
};

type ProfileTab = "profile" | "edit" | "prefs" | "resources" | "role";

const BASE_TABS = [
  { id: "profile", label: "Perfil" },
  { id: "edit", label: "Editar" },
  { id: "prefs", label: "Preferências" },
  { id: "resources", label: "Recursos" },
] as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="vz-profile__field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function VisualZeroProfile({
  userId,
  profile,
  preferences,
  photoUrl,
  nameGradient,
  status,
  activeTab,
  online,
  loading,
  stale,
  savingProfile,
  savingPreferences,
  commitment,
  isStaff,
  roleLabel,
  roleColor,
  availableRoleColors,
  publicListing,
  savingRole,
  contributor,
  contributorHighlight,
  savingContributor,
  onTabChange,
  onProfileFieldChange,
  onPreferenceFieldChange,
  onPhotoChange,
  onSaveProfile,
  onSavePreferences,
  onRoleColorChange,
  onPublicListingChange,
  onSaveRole,
  onContributorHighlightChange,
}: {
  userId?: string;
  profile: VisualZeroProfileData;
  preferences: VisualZeroPreferenceData;
  photoUrl: string | null;
  nameGradient: NameGradient | null;
  status: "pending" | "approved" | "rejected" | "banned" | null;
  activeTab: string;
  online: boolean;
  loading: boolean;
  stale: boolean;
  savingProfile: boolean;
  savingPreferences: boolean;
  commitment: { matchId: string; partner: string | null } | null;
  isStaff: boolean;
  roleLabel: string;
  roleColor: RoleColor;
  availableRoleColors: readonly RoleColor[];
  publicListing: boolean;
  savingRole: boolean;
  contributor: boolean;
  contributorHighlight: boolean;
  savingContributor: boolean;
  onTabChange(tab: string): void;
  onProfileFieldChange<K extends keyof VisualZeroProfileData>(
    key: K,
    value: VisualZeroProfileData[K],
  ): void;
  onPreferenceFieldChange<K extends keyof VisualZeroPreferenceData>(
    key: K,
    value: VisualZeroPreferenceData[K],
  ): void;
  onPhotoChange(event: ChangeEvent<HTMLInputElement>): void;
  onSaveProfile(event: FormEvent): void;
  onSavePreferences(event: FormEvent): void;
  onRoleColorChange(color: RoleColor): void;
  onPublicListingChange(value: boolean): void;
  onSaveRole(): void;
  onContributorHighlightChange(value: boolean): void;
}) {
  if (loading) {
    return (
      <VisualZeroScreen>
        <VisualZeroHeader title="Perfil" description="Carregando seus dados reais." />
        <VisualZeroLoading rows={6} label="Carregando perfil" />
      </VisualZeroScreen>
    );
  }

  const normalizedTab: ProfileTab =
    activeTab === "profile-edit"
      ? "edit"
      : activeTab === "prefs"
        ? "prefs"
        : activeTab === "role"
          ? "role"
          : activeTab === "profile"
            ? "profile"
            : "resources";
  const tabs = isStaff ? [...BASE_TABS, { id: "role" as const, label: "Meu papel" }] : BASE_TABS;
  const completed = [
    profile.full_name,
    profile.age,
    profile.city,
    profile.state,
    profile.church,
    profile.bio,
  ].filter(Boolean).length;
  const completion = Math.round((completed / 6) * 100);
  const statusCopy =
    status === "approved"
      ? "Aprovado"
      : status === "rejected"
        ? "Revisão necessária"
        : status === "banned"
          ? "Acesso restrito"
          : "Em análise";

  return (
    <VisualZeroScreen className="vz-profile">
      <VisualZeroHeader
        eyebrow="Minha conta"
        title="Perfil"
        description="Sua identidade, preferências e recursos em um só lugar."
      />

      {stale ? (
        <p className="vz-profile__notice">Você está vendo dados salvos anteriormente.</p>
      ) : null}

      <VisualZeroHero className="vz-profile__hero">
        <div className="vz-profile__identity">
          <label className="vz-profile__photo-action">
            <VisualZeroAvatar
              src={photoUrl}
              alt={profile.full_name || "Foto de perfil"}
              fallback={(profile.full_name || "P").charAt(0)}
              size="xl"
            />
            <span>
              <Camera aria-hidden />
              <span className="sr-only">Trocar foto de perfil</span>
            </span>
            <input
              type="file"
              accept="image/*,image/heic,image/heif"
              onChange={onPhotoChange}
              tabIndex={-1}
            />
          </label>
          <div className="vz-profile__identity-copy">
            <div className="vz-profile__badges">
              <VisualZeroStatusPill tone={status === "approved" ? "success" : "warning"}>
                {statusCopy}
              </VisualZeroStatusPill>
              {isStaff ? (
                <VisualZeroStatusPill tone="violet">{roleLabel}</VisualZeroStatusPill>
              ) : null}
              {contributor ? (
                <VisualZeroStatusPill tone="success">Contribuidor</VisualZeroStatusPill>
              ) : null}
            </div>
            <h2 style={nameGradientStyle(nameGradient)}>{profile.full_name || "Meu perfil"}</h2>
            <p>
              {[profile.city, profile.state].filter(Boolean).join(", ") ||
                "Localização não informada"}
            </p>
            <div className="vz-profile__hero-actions">
              {userId ? (
                <Link to="/pretendentes/$id" params={{ id: userId }}>
                  Ver perfil público
                </Link>
              ) : null}
              <Link to="/loja">Abrir loja</Link>
            </div>
          </div>
        </div>

        <VisualZeroInlineProgress
          value={completion}
          label="Dados principais"
          metadata={`${completion}%`}
        />

        {commitment ? (
          <Link
            to="/proposito/$matchId"
            params={{ matchId: commitment.matchId }}
            className="vz-profile__commitment"
          >
            <BadgeCheck aria-hidden />
            <span>
              <strong>Propósito firmado</strong>
              <small>
                {commitment.partner ? `Com ${commitment.partner}` : "Compromisso ativo"}
              </small>
            </span>
            <ChevronRight aria-hidden />
          </Link>
        ) : null}
      </VisualZeroHero>

      <VisualZeroSegmentedControl
        items={tabs}
        value={normalizedTab}
        onChange={(tab) => onTabChange(tab === "edit" ? "profile-edit" : tab)}
        label="Áreas do perfil"
      />

      {activeTab === "profile-edit" ? (
        <form className="vz-profile__form" onSubmit={onSaveProfile}>
          <VisualZeroSection title="Editar perfil" eyebrow="Dados públicos">
            <div className="vz-profile__form-grid">
              <Field label="Nome">
                <input
                  value={profile.full_name}
                  onChange={(event) => onProfileFieldChange("full_name", event.target.value)}
                />
              </Field>
              <Field label="Idade">
                <input
                  inputMode="numeric"
                  value={profile.age}
                  onChange={(event) => onProfileFieldChange("age", event.target.value)}
                />
              </Field>
              <Field label="Altura (cm)">
                <input
                  inputMode="numeric"
                  value={profile.height_cm}
                  onChange={(event) => onProfileFieldChange("height_cm", event.target.value)}
                />
              </Field>
              <Field label="Sexo">
                <select
                  value={profile.sex}
                  onChange={(event) =>
                    onProfileFieldChange("sex", event.target.value as VisualZeroProfileData["sex"])
                  }
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </Field>
              <Field label="Estado civil">
                <select
                  value={profile.marital}
                  onChange={(event) =>
                    onProfileFieldChange(
                      "marital",
                      event.target.value as VisualZeroProfileData["marital"],
                    )
                  }
                >
                  <option value="">Selecione</option>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                </select>
              </Field>
              <Field label="Cidade">
                <input
                  value={profile.city}
                  onChange={(event) => onProfileFieldChange("city", event.target.value)}
                />
              </Field>
              <Field label="Estado">
                <input
                  maxLength={2}
                  value={profile.state}
                  onChange={(event) =>
                    onProfileFieldChange("state", event.target.value.toUpperCase())
                  }
                />
              </Field>
              <Field label="Igreja">
                <input
                  value={profile.church}
                  onChange={(event) => onProfileFieldChange("church", event.target.value)}
                />
              </Field>
              <Field label="Anos de batismo">
                <input
                  inputMode="numeric"
                  value={profile.years_baptized}
                  onChange={(event) => onProfileFieldChange("years_baptized", event.target.value)}
                />
              </Field>
              <Field label="Bio">
                <textarea
                  maxLength={600}
                  value={profile.bio}
                  onChange={(event) => onProfileFieldChange("bio", event.target.value)}
                />
              </Field>
            </div>
          </VisualZeroSection>
          <div className="vz-profile__form-actions">
            <VisualZeroPrimaryAction type="submit" disabled={!online || savingProfile}>
              <Save aria-hidden /> {savingProfile ? "Salvando…" : "Salvar perfil"}
            </VisualZeroPrimaryAction>
          </div>
        </form>
      ) : normalizedTab === "profile" ? (
        <>
          <VisualZeroSection
            title="Fotos"
            action={
              <button
                type="button"
                className="vz-profile__inline-button"
                onClick={() => onTabChange("profile-edit")}
              >
                <Camera aria-hidden /> Alterar
              </button>
            }
          >
            <VisualZeroMediaStrip>
              <div className="vz-profile__media-primary">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto principal do perfil" />
                ) : (
                  <Images aria-hidden />
                )}
              </div>
              <button
                type="button"
                className="vz-profile__media-add"
                onClick={() => onTabChange("profile-edit")}
              >
                <Camera aria-hidden />
                <span>Atualizar foto</span>
              </button>
            </VisualZeroMediaStrip>
          </VisualZeroSection>

          <VisualZeroSection title="Sobre mim">
            <div className="vz-profile__bio">
              <p>{profile.bio || "Conte um pouco sobre você."}</p>
              <button type="button" onClick={() => onTabChange("profile-edit")}>
                Editar
              </button>
            </div>
          </VisualZeroSection>

          <VisualZeroSection title="Informações pessoais">
            <VisualZeroGroupedList>
              <VisualZeroRow
                leading={
                  <VisualZeroIconTile>
                    <UserRound aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Idade"
                trailing={profile.age ? `${profile.age} anos` : "Não informada"}
              />
              <VisualZeroRow
                leading={
                  <VisualZeroIconTile>
                    <ShieldCheck aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Estado civil"
                trailing={profile.marital || "Não informado"}
              />
              <VisualZeroRow
                leading={
                  <VisualZeroIconTile>
                    <Sparkles aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Igreja"
                trailing={profile.church || "Não informada"}
              />
              <VisualZeroRow
                leading={
                  <VisualZeroIconTile>
                    <Check aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Batismo"
                trailing={
                  profile.years_baptized ? `${profile.years_baptized} ano(s)` : "Não informado"
                }
              />
            </VisualZeroGroupedList>
          </VisualZeroSection>
        </>
      ) : normalizedTab === "prefs" ? (
        <form className="vz-profile__form" onSubmit={onSavePreferences}>
          <VisualZeroSection title="O que procuro" eyebrow="Relacionamento opcional">
            <div className="vz-profile__form-grid">
              <Field label="Idade mínima">
                <input
                  inputMode="numeric"
                  value={preferences.age_min}
                  onChange={(event) => onPreferenceFieldChange("age_min", event.target.value)}
                />
              </Field>
              <Field label="Idade máxima">
                <input
                  inputMode="numeric"
                  value={preferences.age_max}
                  onChange={(event) => onPreferenceFieldChange("age_max", event.target.value)}
                />
              </Field>
              <Field label="Abrangência">
                <select
                  value={preferences.location_scope}
                  onChange={(event) =>
                    onPreferenceFieldChange(
                      "location_scope",
                      event.target.value as VisualZeroPreferenceData["location_scope"],
                    )
                  }
                >
                  <option value="regiao">Minha região</option>
                  <option value="brasil">Brasil</option>
                  <option value="mundo">Mundo</option>
                  <option value="personalizado">Estados escolhidos</option>
                </select>
              </Field>
              <Field label="Aceita pessoas com filhos?">
                <select
                  value={preferences.accepts_children}
                  onChange={(event) =>
                    onPreferenceFieldChange(
                      "accepts_children",
                      event.target.value as VisualZeroPreferenceData["accepts_children"],
                    )
                  }
                >
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </Field>
              <Field label="Qualidade desejada">
                <input
                  value={preferences.desired_quality}
                  onChange={(event) =>
                    onPreferenceFieldChange("desired_quality", event.target.value)
                  }
                />
              </Field>
              <Field label="O que você busca">
                <textarea
                  value={preferences.looking_for_bio}
                  onChange={(event) =>
                    onPreferenceFieldChange("looking_for_bio", event.target.value)
                  }
                />
              </Field>
            </div>
          </VisualZeroSection>
          <div className="vz-profile__form-actions">
            <VisualZeroPrimaryAction type="submit" disabled={!online || savingPreferences}>
              <Save aria-hidden /> {savingPreferences ? "Salvando…" : "Salvar preferências"}
            </VisualZeroPrimaryAction>
          </div>
        </form>
      ) : normalizedTab === "role" ? (
        <VisualZeroSection title="Meu papel" eyebrow={roleLabel}>
          <div className="vz-profile__role">
            <Field label="Cor do badge">
              <select
                value={roleColor}
                onChange={(event) => onRoleColorChange(event.target.value as RoleColor)}
              >
                {availableRoleColors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </Field>
            <label className="vz-profile__check">
              <input
                type="checkbox"
                checked={publicListing}
                onChange={(event) => onPublicListingChange(event.target.checked)}
              />
              <span>Aparecer na listagem pública da equipe</span>
            </label>
            {contributor ? (
              <label className="vz-profile__check">
                <input
                  type="checkbox"
                  checked={contributorHighlight}
                  disabled={savingContributor}
                  onChange={(event) => onContributorHighlightChange(event.target.checked)}
                />
                <span>Destacar badge de contribuidor nas mensagens</span>
              </label>
            ) : null}
            <VisualZeroPrimaryAction onClick={onSaveRole} disabled={savingRole}>
              <Save aria-hidden /> {savingRole ? "Salvando…" : "Salvar papel"}
            </VisualZeroPrimaryAction>
          </div>
        </VisualZeroSection>
      ) : (
        <>
          <VisualZeroSection title="Conta e segurança">
            <VisualZeroGroupedList>
              <VisualZeroActionRow
                to="/conta"
                leading={
                  <VisualZeroIconTile>
                    <ShieldCheck aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Conta"
                description="Privacidade, sessão e preferências."
              />
              <VisualZeroActionRow
                to="/verificacao"
                leading={
                  <VisualZeroIconTile tone="mint">
                    <BadgeCheck aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Verificação"
                description="Status e documentos."
              />
              <VisualZeroActionRow
                to="/bloqueados"
                leading={
                  <VisualZeroIconTile>
                    <LockKeyhole aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Bloqueados"
                description="Gerencie sua segurança."
              />
              <VisualZeroActionRow
                to="/suporte"
                leading={
                  <VisualZeroIconTile>
                    <CircleHelp aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Suporte"
                description="Ajuda e chamados."
              />
            </VisualZeroGroupedList>
          </VisualZeroSection>
          <VisualZeroSection title="Inventário e experiências">
            <VisualZeroGroupedList>
              <VisualZeroActionRow
                to="/avatar"
                leading={
                  <VisualZeroIconTile tone="violet">
                    <Sparkles aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Avatar e decoração"
                description="Itens, visual e inventário."
              />
              <VisualZeroActionRow
                to="/loja"
                leading={
                  <VisualZeroIconTile tone="coral">
                    <Store aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Loja"
                description="Catálogo e itens disponíveis."
              />
              <VisualZeroActionRow
                to="/presentes"
                leading={
                  <VisualZeroIconTile tone="coral">
                    <Gift aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Presentes"
                description="Presentes recebidos e envio real."
              />
              <VisualZeroActionRow
                to="/caixas"
                leading={
                  <VisualZeroIconTile tone="amber">
                    <Package aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Caixas"
                description="Caixas e recompensas atuais."
              />
              <VisualZeroActionRow
                to="/conquistas"
                leading={
                  <VisualZeroIconTile tone="amber">
                    <Trophy aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Conquistas"
                description="Progresso e recompensas reais."
              />
              <VisualZeroActionRow
                to="/meu-pet"
                leading={
                  <VisualZeroIconTile tone="mint">
                    <PawPrint aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Meu Pet"
                description="Companheiro, cuidado e progressão."
              />
              <VisualZeroActionRow
                to="/loja"
                leading={
                  <VisualZeroIconTile>
                    <Coins aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Moedas"
                description="Saldo e histórico na loja."
              />
            </VisualZeroGroupedList>
          </VisualZeroSection>
        </>
      )}
    </VisualZeroScreen>
  );
}
