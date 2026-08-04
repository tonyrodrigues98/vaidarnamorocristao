import {
  BookOpen,
  Camera,
  ChevronRight,
  CircleUserRound,
  Gift,
  HeartHandshake,
  Package,
  Palette,
  PawPrint,
  ShieldCheck,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import profileBackground from "../assets/profile-coast-dusk.png";

export type Prototype01ProfileFields = {
  full_name: string;
  age: number | string;
  city: string;
  state: string;
  church: string;
  bio: string;
};

export type Prototype01PerfilScreenProps = {
  fields: Prototype01ProfileFields;
  photoUrl: string | null;
  status: "pending" | "approved" | "rejected" | "banned" | null;
  verified: boolean;
  editing: boolean;
  saving: boolean;
  onEditingChange(editing: boolean): void;
  onFieldChange<K extends keyof Prototype01ProfileFields>(
    key: K,
    value: Prototype01ProfileFields[K],
  ): void;
  onChoosePhoto(): void;
  onSave(): void;
  onNavigate(path: string): void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");
}

export function Prototype01PerfilScreen({
  fields,
  photoUrl,
  status,
  verified,
  editing,
  saving,
  onEditingChange,
  onFieldChange,
  onChoosePhoto,
  onSave,
  onNavigate,
}: Prototype01PerfilScreenProps) {
  const name = fields.full_name || "Seu perfil";
  const location = [fields.city, fields.state].filter(Boolean).join(" · ");

  return (
    <section
      className="screen profile-screen"
      aria-label={`Perfil de ${name}`}
      data-action-context="profile"
      data-action-title={`Perfil de ${name}`}
      data-action-own="true"
    >
      <div className="page-scroll profile-page-scroll">
        <header className="topbar profile-compact-topbar">
          <strong>{name}</strong>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button pressable"
              aria-label="Editar perfil"
              onClick={() => onEditingChange(true)}
            >
              <Palette size={20} />
            </button>
          </div>
        </header>

        <header className="profile-hero">
          <img src={profileBackground} alt="Fundo de perfil inspirado no litoral ao entardecer" />
          <div className="profile-top-actions">
            <span className="profile-inventory-label">Identidade e personalização</span>
          </div>
          <div className="profile-identity">
            <button
              type="button"
              className="profile-avatar-wrap pressable"
              onClick={onChoosePhoto}
              aria-label="Trocar foto de perfil"
            >
              <span className="profile-aura" />
              <span className="profile-frame">
                {photoUrl ? <img src={photoUrl} alt="" /> : <span>{initials(name)}</span>}
              </span>
              <Camera size={18} />
            </button>
            <div className="profile-name">
              <h1>{name}</h1>
              <span>{location || "Localização não informada"}</span>
              <p>{fields.bio || "Conte um pouco sobre sua caminhada."}</p>
            </div>
            <button
              type="button"
              className="primary-button pressable"
              onClick={() => onEditingChange(true)}
            >
              Editar perfil
            </button>
          </div>
        </header>

        <div className="profile-content">
          <div className="profile-title-row">
            <span className="profile-title">
              {[fields.church, fields.age ? `${fields.age} anos` : ""]
                .filter(Boolean)
                .join(" · ") || "Complete sua identidade"}
            </span>
            <span className="profile-status">
              <i /> {status === "approved" ? "Conta aprovada" : "Conta em acompanhamento"}
            </span>
          </div>

          <div className="badge-row" aria-label="Status do perfil">
            <button type="button" onClick={() => onNavigate("/verificacao")}>
              <ShieldCheck size={15} /> {verified ? "Perfil verificado" : "Verificar perfil"}
            </button>
            <span>
              <BookOpen size={15} /> Fé e comunidade
            </span>
            <span>
              <HeartHandshake size={15} /> Relacionamento opcional
            </span>
          </div>

          <nav className="profile-tabs" aria-label="Atalhos do perfil">
            <button type="button" className="active">
              Visão geral
            </button>
            <button type="button" onClick={() => onNavigate("/avatar")}>
              Avatar
            </button>
            <button type="button" onClick={() => onNavigate("/presentes")}>
              Presentes
            </button>
            <button type="button" onClick={() => onNavigate("/conta")}>
              Conta
            </button>
          </nav>

          <div className="profile-modules">
            <section className="profile-module overview-module">
              <div className="module-heading">
                <div>
                  <span className="section-overline">VISÃO GERAL</span>
                  <h2>Sobre mim</h2>
                </div>
                <button type="button" onClick={() => onEditingChange(true)}>
                  Editar
                </button>
              </div>
              <p>{fields.bio || "Nenhuma biografia adicionada."}</p>
              <div className="overview-facts">
                <span>
                  <strong>{fields.church || "Não informada"}</strong>
                  <small>Igreja</small>
                </span>
                <span>
                  <strong>{location || "Não informada"}</strong>
                  <small>Localização</small>
                </span>
              </div>
            </section>

            <section className="profile-module">
              <div className="module-heading">
                <div>
                  <span className="section-overline">EXPERIÊNCIAS</span>
                  <h2>Seu espaço</h2>
                </div>
              </div>
              <div className="collection-grid">
                {[
                  ["/meu-pet", "Pet", PawPrint],
                  ["/avatar", "Avatar", UserRound],
                  ["/presentes", "Presentes", Gift],
                  ["/conquistas", "Conquistas", Trophy],
                  ["/loja", "Inventário", Package],
                ].map(([path, label, Icon]) => {
                  const ModuleIcon = Icon as typeof PawPrint;
                  return (
                    <button
                      key={String(path)}
                      type="button"
                      onClick={() => onNavigate(String(path))}
                    >
                      <ModuleIcon size={20} />
                      <span>{String(label)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <button
            type="button"
            className="activity-button pressable"
            onClick={() => onNavigate("/comunidade")}
          >
            <CircleUserRound size={20} />
            <span>
              <strong>Ver atividade na comunidade</strong>
              <small>Abra as superfícies comunitárias reais.</small>
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="overlay" role="presentation" onMouseDown={() => onEditingChange(false)}>
          <section
            className="sheet sheet-medium"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prototype01-profile-edit-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <header className="sheet-header">
              <h2 id="prototype01-profile-edit-title">Editar perfil</h2>
              <button type="button" aria-label="Fechar" onClick={() => onEditingChange(false)}>
                <X size={20} />
              </button>
            </header>
            <div className="profile-customizer">
              <label>
                <span>Nome</span>
                <input
                  value={fields.full_name}
                  onChange={(event) => onFieldChange("full_name", event.target.value)}
                />
              </label>
              <label>
                <span>Idade</span>
                <input
                  type="number"
                  min={18}
                  max={110}
                  value={fields.age}
                  onChange={(event) => onFieldChange("age", event.target.value)}
                />
              </label>
              <label>
                <span>Cidade</span>
                <input
                  value={fields.city}
                  onChange={(event) => onFieldChange("city", event.target.value)}
                />
              </label>
              <label>
                <span>Estado</span>
                <input
                  maxLength={2}
                  value={fields.state}
                  onChange={(event) =>
                    onFieldChange("state", event.target.value.toLocaleUpperCase())
                  }
                />
              </label>
              <label>
                <span>Igreja</span>
                <input
                  value={fields.church}
                  onChange={(event) => onFieldChange("church", event.target.value)}
                />
              </label>
              <label>
                <span>Biografia</span>
                <textarea
                  maxLength={600}
                  value={fields.bio}
                  onChange={(event) => onFieldChange("bio", event.target.value)}
                />
              </label>
              <button type="button" className="primary-button" onClick={onSave} disabled={saving}>
                {saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
