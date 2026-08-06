"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  GripVertical,
  Headphones,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useState } from "react";
import "../styles/ProfileStudioExperience.css";

type StudioTab = "Visual" | "Identidade" | "Módulos" | "Vitrine" | "Áudio";
type StudioState = {
  background: string;
  frame: string;
  aura: string;
  effect: string;
  palette: string;
  title: string;
  badges: string[];
  status: string;
  duration: string;
  statusPrivacy: string;
  modules: { id: string; label: string; visible: boolean; size: string; privacy: string }[];
  showcase: string[];
  primaryShowcase: string;
  track: string;
  volume: number;
};

const tabs: StudioTab[] = ["Visual", "Identidade", "Módulos", "Vitrine", "Áudio"];
const defaults: StudioState = {
  background: "Costa Serena",
  frame: "Horizonte Coral",
  aura: "Brilho sereno",
  effect: "Entrada suave",
  palette: "Pôr do sol",
  title: "Construtor de caminhos",
  badges: ["Perfil aprovado", "Leitor constante", "Bom amigo"],
  status: "Disponível para conversar",
  duration: "24 horas",
  statusPrivacy: "Amigos",
  modules: [
    { id: "overview", label: "Visão geral", visible: true, size: "Padrão", privacy: "Público" },
    { id: "walk", label: "Minha caminhada", visible: true, size: "Destaque", privacy: "Amigos" },
    { id: "pet", label: "Pet", visible: true, size: "Compacto", privacy: "Público" },
    { id: "showcase", label: "Vitrine", visible: true, size: "Padrão", privacy: "Público" },
    { id: "gallery", label: "Galeria", visible: true, size: "Padrão", privacy: "Amigos" },
    { id: "collections", label: "Coleções", visible: true, size: "Compacto", privacy: "Público" },
    { id: "friends", label: "Amigos", visible: false, size: "Compacto", privacy: "Amigos" },
  ],
  showcase: ["Plano 30 dias em João", "Costa Serena", "Bento · Nível 12"],
  primaryShowcase: "Plano 30 dias em João",
  track: "Mar calmo",
  volume: 58,
};

const cloneState = (value: StudioState): StudioState =>
  JSON.parse(JSON.stringify(value)) as StudioState;

const initialDraft = (): StudioState => {
  if (typeof window === "undefined") return cloneState(defaults);
  const saved = window.sessionStorage.getItem("vdn-profile-studio-draft");
  if (!saved) return cloneState(defaults);
  try {
    return JSON.parse(saved) as StudioState;
  } catch {
    return cloneState(defaults);
  }
};

class StudioBoundary extends Component<
  { children: React.ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="studio-local-error" role="alert">
        <CircleAlert />
        <h2>O preview encontrou um problema</h2>
        <p>Seu perfil e as outras áreas continuam funcionando.</p>
        <button onClick={() => this.setState({ failed: false })}>
          <RefreshCw /> Tentar novamente
        </button>
        <button onClick={this.props.onClose}>Voltar ao Perfil</button>
      </div>
    );
  }
}

function OptionGrid({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="studio-option-section">
      <header>
        <h3>{label}</h3>
        <span>{values.length} opções</span>
      </header>
      <div className="studio-option-grid">
        {values.map((value) => (
          <button
            key={value}
            className={selected === value ? "selected" : ""}
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
          >
            <span className={`studio-swatch swatch-${value.toLowerCase().replaceAll(" ", "-")}`} />
            <strong>{value}</strong>
            <small>
              {value === "Aurora Viva"
                ? "Raro · animado"
                : value === "Sem fundo" || value.startsWith("Sem ")
                  ? "Remover"
                  : "Adquirido"}
            </small>
            {selected === value && <Check />}
          </button>
        ))}
      </div>
    </section>
  );
}

function StudioPreview({ state, reduced }: { state: StudioState; reduced: boolean }) {
  const visibleModules = state.modules.filter((module) => module.visible);
  return (
    <div
      className={`studio-preview-card bg-${state.background.toLowerCase().replaceAll(" ", "-")} ${reduced ? "reduce-motion" : ""}`}
    >
      <div
        className={`studio-preview-effect effect-${state.effect.toLowerCase().replaceAll(" ", "-")}`}
        aria-hidden="true"
      />
      <div className="studio-preview-cover">
        <span>PREVIEW AO VIVO</span>
        <small>{state.palette}</small>
      </div>
      <div className="studio-preview-identity">
        <div className={`studio-avatar aura-${state.aura.toLowerCase().replaceAll(" ", "-")}`}>
          <div className={`studio-frame frame-${state.frame.toLowerCase().replaceAll(" ", "-")}`}>
            AR
          </div>
        </div>
        <div>
          <h2>Antonio Rodrigues</h2>
          <span>@antoniorodrigues</span>
          <p>Construindo coisas, vivendo a fé e conhecendo gente boa.</p>
        </div>
      </div>
      <div className="studio-preview-meta">
        <strong>{state.title}</strong>
        <span>
          <i /> {state.status || "Sem status"}
        </span>
      </div>
      <div className="studio-preview-badges">
        {state.badges.map((badge) => (
          <span key={badge}>
            <BadgeCheck /> {badge}
          </span>
        ))}
      </div>
      <div className="studio-preview-modules">
        {visibleModules.slice(0, 4).map((module, index) => (
          <article
            key={module.id}
            className={`${module.size.toLowerCase()} ${index === 0 ? "first" : ""}`}
          >
            <span>{module.label.toUpperCase()}</span>
            <strong>
              {module.id === "walk"
                ? "Fé que aparece na vida real"
                : module.id === "pet"
                  ? "Bento está descansando"
                  : module.id === "showcase"
                    ? state.primaryShowcase
                    : "Um pouco sobre mim"}
            </strong>
            <small>{module.privacy}</small>
          </article>
        ))}
      </div>
      {state.track !== "Sem trilha" && (
        <div className="studio-preview-track">
          <Headphones />
          <span>
            <strong>{state.track}</strong>
            <small>Trilha do Perfil · {state.volume}%</small>
          </span>
        </div>
      )}
    </div>
  );
}

function StudioContent({
  visible,
  initialTab,
  source,
  onClose,
  showToast,
}: {
  visible: boolean;
  initialTab?: StudioTab;
  source?: string;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<StudioTab>(initialTab ?? "Visual");
  const [applied, setApplied] = useState<StudioState>(() => cloneState(defaults));
  const [draft, setDraft] = useState<StudioState>(initialDraft);
  const [status, setStatus] = useState<"idle" | "applying" | "applied" | "offline" | "error">(
    "idle",
  );
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(true);
  const reduced =
    typeof window !== "undefined" &&
    (document.documentElement.dataset.reduceMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(applied), [draft, applied]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setTab(initialTab ?? "Visual"), 0);
    return () => window.clearTimeout(timer);
  }, [visible, initialTab]);

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem("vdn-profile-studio-draft", JSON.stringify(draft));
  }, [draft, visible]);

  const patch = (next: Partial<StudioState>) => {
    setDraft((current) => ({ ...current, ...next }));
    setStatus(navigator.onLine ? "idle" : "offline");
  };

  const requestClose = () => {
    if (dirty && !window.confirm("Descartar alterações não aplicadas e voltar?")) return;
    setDraft(cloneState(applied));
    setAudioPlaying(false);
    onClose();
  };

  const apply = () => {
    if (!navigator.onLine) {
      setStatus("offline");
      showToast("Alterações preservadas para quando você voltar");
      return;
    }
    setStatus("applying");
    window.setTimeout(() => {
      setApplied(cloneState(draft));
      setStatus("applied");
      window.sessionStorage.removeItem("vdn-profile-studio-draft");
      showToast("Personalização aplicada neste protótipo");
    }, 520);
  };

  const moveModule = (index: number, delta: -1 | 1) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= draft.modules.length) return;
    const next = [...draft.modules];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    patch({ modules: next });
  };

  if (!visible) return null;
  return (
    <div
      className="studio-experience"
      data-studio-state={status}
      data-immersive-surface="personalizacao"
      data-state-preserved="true"
    >
      <header className="studio-topbar">
        <button aria-label={`Voltar para ${source ?? "Perfil"}`} onClick={requestClose}>
          <ArrowLeft />
        </button>
        <div>
          <span>ESTÚDIO</span>
          <h1>Personalizar Perfil</h1>
        </div>
        <button aria-label="Fechar Estúdio" onClick={requestClose}>
          <X />
        </button>
      </header>
      <nav className="studio-tabs" aria-label="Categorias do Estúdio">
        {tabs.map((value) => (
          <button
            key={value}
            aria-current={tab === value ? "page" : undefined}
            className={tab === value ? "active" : ""}
            onClick={() => {
              setTab(value);
              setMobileControlsOpen(true);
            }}
          >
            {value}
          </button>
        ))}
      </nav>

      <div className="studio-layout">
        <aside className="studio-categories">
          <span>Personalização</span>
          {tabs.map((value) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              {value}
              <ChevronRight />
            </button>
          ))}
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "loja" }))
            }
          >
            <Store /> Abrir Loja
          </button>
        </aside>

        <main className={`studio-controls ${mobileControlsOpen ? "open" : ""}`}>
          <button
            className="studio-mobile-handle"
            aria-label="Alternar controles"
            onClick={() => setMobileControlsOpen((value) => !value)}
          >
            <span />
          </button>
          <header className="studio-controls-header">
            <div>
              <span>{tab.toUpperCase()}</span>
              <h2>
                {tab === "Visual"
                  ? "Atmosfera do Perfil"
                  : tab === "Identidade"
                    ? "Como você se apresenta"
                    : tab === "Módulos"
                      ? "Organize sua história"
                      : tab === "Vitrine"
                        ? "O que merece destaque"
                        : "Trilha equipada"}
              </h2>
            </div>
            {dirty && <span className="studio-pending">Alterações não salvas</span>}
          </header>

          {tab === "Visual" && (
            <>
              <div className="studio-filter-row">
                {[
                  "Adquiridos",
                  "Favoritos",
                  "Recentes",
                  "Claro",
                  "Escuro",
                  "Natureza",
                  "Abstrato",
                  "Evento",
                  "Raro",
                  "Animado",
                ].map((filter) => (
                  <button key={filter}>{filter}</button>
                ))}
              </div>
              <OptionGrid
                label="Fundo"
                values={["Costa Serena", "Aurora Viva", "Jardim Calmo", "Sem fundo"]}
                selected={draft.background}
                onSelect={(background) => patch({ background })}
              />
              <OptionGrid
                label="Moldura"
                values={["Horizonte Coral", "Maré Violeta", "Traço Natural", "Sem moldura"]}
                selected={draft.frame}
                onSelect={(frame) => patch({ frame })}
              />
              <OptionGrid
                label="Aura"
                values={["Brilho sereno", "Partículas leves", "Estática", "Sem aura"]}
                selected={draft.aura}
                onSelect={(aura) => patch({ aura })}
              />
              <OptionGrid
                label="Efeito"
                values={["Entrada suave", "Detalhes luminosos", "Sem efeito"]}
                selected={draft.effect}
                onSelect={(effect) => patch({ effect })}
              />
              <label className="studio-select">
                Paleta aprovada
                <select
                  value={draft.palette}
                  onChange={(event) => patch({ palette: event.target.value })}
                >
                  <option>Pôr do sol</option>
                  <option>Oceano noturno</option>
                  <option>Areia clara</option>
                </select>
              </label>
            </>
          )}

          {tab === "Identidade" && (
            <div className="studio-form">
              <label>
                Título
                <select
                  value={draft.title}
                  onChange={(event) => patch({ title: event.target.value })}
                >
                  <option>Construtor de caminhos</option>
                  <option>Amigo da comunidade</option>
                  <option>Leitor constante</option>
                  <option>Sem título</option>
                </select>
              </label>
              <fieldset>
                <legend>
                  Badges <span>{draft.badges.length}/3</span>
                </legend>
                {[
                  "Perfil aprovado",
                  "Leitor constante",
                  "Bom amigo",
                  "Cinema em comunidade",
                  "Amigo do Bento",
                ].map((badge) => {
                  const selected = draft.badges.includes(badge);
                  return (
                    <button
                      key={badge}
                      aria-pressed={selected}
                      disabled={!selected && draft.badges.length >= 3}
                      onClick={() =>
                        patch({
                          badges: selected
                            ? draft.badges.filter((item) => item !== badge)
                            : [...draft.badges, badge],
                        })
                      }
                    >
                      <BadgeCheck /> {badge}
                      {selected && <Check />}
                    </button>
                  );
                })}
              </fieldset>
              <label>
                Status
                <input
                  value={draft.status}
                  maxLength={60}
                  onChange={(event) => patch({ status: event.target.value })}
                />
              </label>
              <div className="studio-form-grid">
                <label>
                  Duração
                  <select
                    value={draft.duration}
                    onChange={(event) => patch({ duration: event.target.value })}
                  >
                    <option>1 hora</option>
                    <option>Hoje</option>
                    <option>24 horas</option>
                    <option>Uma semana</option>
                    <option>Até remover</option>
                  </select>
                </label>
                <label>
                  Privacidade
                  <select
                    value={draft.statusPrivacy}
                    onChange={(event) => patch({ statusPrivacy: event.target.value })}
                  >
                    <option>Público</option>
                    <option>Amigos</option>
                    <option>Somente eu</option>
                  </select>
                </label>
              </div>
              <label>
                Username
                <input value="@antoniorodrigues" readOnly />
              </label>
              <label>
                Apresentação
                <textarea defaultValue="Construindo coisas, vivendo a fé e conhecendo gente boa." />
              </label>
            </div>
          )}

          {tab === "Módulos" && (
            <div className="studio-module-list">
              <p>Use o grip ou os botões. Apenas um módulo em destaque aparece na primeira tela.</p>
              {draft.modules.map((module, index) => (
                <article key={module.id}>
                  <GripVertical aria-hidden="true" />
                  <div>
                    <strong>{module.label}</strong>
                    <span>
                      {module.size} · {module.privacy}
                    </span>
                  </div>
                  <button
                    onClick={() => moveModule(index, -1)}
                    disabled={index === 0}
                    aria-label={`Mover ${module.label} para cima`}
                  >
                    <ArrowUp />
                  </button>
                  <button
                    onClick={() => moveModule(index, 1)}
                    disabled={index === draft.modules.length - 1}
                    aria-label={`Mover ${module.label} para baixo`}
                  >
                    <ArrowDown />
                  </button>
                  <button
                    aria-label={
                      module.visible ? `Ocultar ${module.label}` : `Mostrar ${module.label}`
                    }
                    onClick={() =>
                      patch({
                        modules: draft.modules.map((item) =>
                          item.id === module.id ? { ...item, visible: !item.visible } : item,
                        ),
                      })
                    }
                  >
                    {module.visible ? <Eye /> : <EyeOff />}
                  </button>
                  <select
                    aria-label={`Tamanho de ${module.label}`}
                    value={module.size}
                    onChange={(event) =>
                      patch({
                        modules: draft.modules.map((item) =>
                          item.id === module.id ? { ...item, size: event.target.value } : item,
                        ),
                      })
                    }
                  >
                    <option>Compacto</option>
                    <option>Padrão</option>
                    <option>Destaque</option>
                  </select>
                  <select
                    aria-label={`Privacidade de ${module.label}`}
                    value={module.privacy}
                    onChange={(event) =>
                      patch({
                        modules: draft.modules.map((item) =>
                          item.id === module.id ? { ...item, privacy: event.target.value } : item,
                        ),
                      })
                    }
                  >
                    <option>Público</option>
                    <option>Amigos</option>
                    <option>Somente eu</option>
                  </select>
                </article>
              ))}
            </div>
          )}

          {tab === "Vitrine" && (
            <div className="studio-showcase-editor">
              <p>Escolha até três showcases e um destaque principal.</p>
              {[
                "Plano 30 dias em João",
                "Costa Serena",
                "Bento · Nível 12",
                "Arcade · Fly Bird",
                "Cinema da comunidade",
                "Evento de julho",
              ].map((item) => {
                const selected = draft.showcase.includes(item);
                return (
                  <article key={item} className={selected ? "selected" : ""}>
                    <span>
                      <Sparkles />
                    </span>
                    <div>
                      <strong>{item}</strong>
                      <small>
                        {item.includes("João")
                          ? "Verbo · raro"
                          : item.includes("Bento")
                            ? "Pet"
                            : "Coleção"}
                      </small>
                    </div>
                    <button
                      disabled={!selected && draft.showcase.length >= 3}
                      onClick={() =>
                        patch({
                          showcase: selected
                            ? draft.showcase.filter((value) => value !== item)
                            : [...draft.showcase, item],
                        })
                      }
                    >
                      {selected ? "Remover" : "Adicionar"}
                    </button>
                    {selected && (
                      <button
                        className="principal"
                        onClick={() => patch({ primaryShowcase: item })}
                      >
                        {draft.primaryShowcase === item ? "Principal" : "Tornar principal"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {tab === "Áudio" && (
            <div className="studio-audio-list">
              <p>O áudio nunca inicia sozinho. O volume é apenas local.</p>
              {["Mar calmo", "Piano de domingo", "Noite serena", "Sem trilha"].map((track) => (
                <button
                  key={track}
                  className={draft.track === track ? "selected" : ""}
                  onClick={() => {
                    patch({ track });
                    setAudioPlaying(false);
                  }}
                >
                  <Headphones />
                  <span>
                    <strong>{track}</strong>
                    <small>
                      {track === "Mar calmo"
                        ? "Equipada · adquirida"
                        : track === "Sem trilha"
                          ? "Remover áudio"
                          : "Adquirida"}
                    </small>
                  </span>
                  {draft.track === track && <Check />}
                </button>
              ))}
              {draft.track !== "Sem trilha" && (
                <div className="studio-audio-player">
                  <button onClick={() => setAudioPlaying((value) => !value)}>
                    {audioPlaying ? <VolumeX /> : <Volume2 />}
                    {audioPlaying ? "Pausar preview" : "Ouvir preview"}
                  </button>
                  <label>
                    Volume{" "}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={draft.volume}
                      onChange={(event) => patch({ volume: Number(event.target.value) })}
                    />
                    <span>{draft.volume}%</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="studio-preview">
          <StudioPreview state={draft} reduced={reduced} />
        </aside>
      </div>

      <footer className="studio-actions">
        <div>
          {status === "offline" ? (
            <>
              <CircleAlert /> Offline · alterações preservadas
            </>
          ) : status === "applied" ? (
            <>
              <Check /> Aplicado
            </>
          ) : dirty ? (
            <>
              <CircleAlert /> Alterações não salvas
            </>
          ) : (
            <>
              <ShieldCheck /> Sem alterações
            </>
          )}
        </div>
        <button
          className="studio-reset"
          onClick={() => {
            setDraft(cloneState(defaults));
            setStatus("idle");
            showToast("Padrão restaurado no preview");
          }}
        >
          <RotateCcw /> Restaurar padrão
        </button>
        <button
          disabled={!dirty || status === "applying"}
          onClick={() => {
            setDraft(cloneState(applied));
            setStatus("idle");
            showToast("Alterações descartadas");
          }}
        >
          Descartar
        </button>
        <button className="studio-apply" disabled={!dirty || status === "applying"} onClick={apply}>
          <Save /> {status === "applying" ? "Aplicando…" : "Aplicar"}
        </button>
      </footer>
    </div>
  );
}

export default function ProfileStudioExperience(props: {
  visible: boolean;
  initialTab?: StudioTab;
  source?: string;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <StudioBoundary onClose={props.onClose}>
      <StudioContent {...props} />
    </StudioBoundary>
  );
}
