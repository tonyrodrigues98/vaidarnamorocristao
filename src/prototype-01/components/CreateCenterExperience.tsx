"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Film,
  Globe2,
  HeartHandshake,
  HelpCircle,
  Image as ImageIcon,
  Layers3,
  Lock,
  MapPinOff,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Save,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  Video,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useRef, useState } from "react";
import "../styles/CreateCenterExperience.css";

export type CreateContext = "Comunidade" | "Espaços" | "Verbo" | "Perfil" | "Cinema";

type CreateType =
  | "Publicação"
  | "Momento"
  | "Foto"
  | "Vídeo"
  | "Pergunta"
  | "Pedido de oração"
  | "Testemunho"
  | "Enquete"
  | "Evento"
  | "Atualização"
  | "Convite"
  | "Espaço novo"
  | "Nota"
  | "Estudo"
  | "Plano pessoal"
  | "Compartilhar versículo"
  | "Publicação com passagem"
  | "Adicionar foto"
  | "Editar apresentação"
  | "Configurar vitrine"
  | "Adicionar coleção"
  | "Alterar status"
  | "Lembrete"
  | "Sessão"
  | "Item de catálogo";

type Audience = "Comunidade" | "Amigos" | "Espaço" | "Somente eu";
type ComposerState = "editing" | "offline" | "error" | "publishing" | "published";

const contextActions: Record<CreateContext, { primary: CreateType[]; all: CreateType[] }> = {
  Comunidade: {
    primary: ["Publicação", "Momento", "Pedido de oração", "Evento"],
    all: [
      "Publicação",
      "Momento",
      "Foto",
      "Vídeo",
      "Pergunta",
      "Pedido de oração",
      "Testemunho",
      "Enquete",
      "Evento",
    ],
  },
  Espaços: {
    primary: ["Publicação", "Evento", "Atualização", "Convite"],
    all: ["Publicação", "Evento", "Atualização", "Convite", "Espaço novo"],
  },
  Verbo: {
    primary: ["Nota", "Estudo", "Compartilhar versículo", "Plano pessoal"],
    all: ["Nota", "Estudo", "Plano pessoal", "Compartilhar versículo", "Publicação com passagem"],
  },
  Perfil: {
    primary: ["Adicionar foto", "Editar apresentação", "Configurar vitrine", "Alterar status"],
    all: [
      "Adicionar foto",
      "Editar apresentação",
      "Configurar vitrine",
      "Adicionar coleção",
      "Alterar status",
    ],
  },
  Cinema: {
    primary: ["Lembrete", "Sessão", "Item de catálogo"],
    all: ["Lembrete", "Sessão", "Item de catálogo"],
  },
};

const actionIcon: Partial<Record<CreateType, typeof MessageCircle>> = {
  Publicação: MessageCircle,
  Momento: Sparkles,
  Foto: ImageIcon,
  Vídeo: Video,
  Pergunta: HelpCircle,
  "Pedido de oração": HeartHandshake,
  Testemunho: BookOpen,
  Enquete: Layers3,
  Evento: CalendarDays,
  Atualização: Send,
  Convite: UsersRound,
  "Espaço novo": Plus,
  Nota: FileText,
  Estudo: BookOpen,
  "Plano pessoal": Check,
  "Compartilhar versículo": BookOpen,
  "Publicação com passagem": MessageCircle,
  "Adicionar foto": Camera,
  "Editar apresentação": FileText,
  "Configurar vitrine": ShoppingBag,
  "Adicionar coleção": Layers3,
  "Alterar status": UserRound,
  Lembrete: Clock3,
  Sessão: Film,
  "Item de catálogo": ShoppingBag,
};

const typeDescriptions: Partial<Record<CreateType, string>> = {
  Publicação: "Compartilhe uma ideia com texto, mídia ou passagem.",
  Momento: "Foto ou vídeo leve, disponível por 24 horas.",
  "Pedido de oração": "Peça apoio com sua identidade ou de forma anônima.",
  Pergunta: "Abra uma conversa com contexto e respostas da comunidade.",
  Testemunho: "Conte uma história que fortaleça outras pessoas.",
  Enquete: "Faça uma pergunta com opções e duração definidas.",
  Evento: "Continue no fluxo completo de Eventos Online.",
  Nota: "Registre algo privado na sua Biblioteca do Verbo.",
  "Compartilhar versículo": "Leve uma passagem ao contexto certo.",
  "Adicionar foto": "Atualize a galeria do seu Perfil.",
  Lembrete: "Lembre você sobre uma sessão do Cinema.",
  Sessão: "Disponível visualmente para hosts autorizados.",
  "Item de catálogo": "Disponível visualmente para administração e hosts.",
};

const audienceDescription: Record<Audience, string> = {
  Comunidade: "Qualquer pessoa da comunidade poderá ver.",
  Amigos: "Somente pessoas que já são suas amigas.",
  Espaço: "Aparece apenas no Espaço escolhido.",
  "Somente eu": "Fica privado no seu Perfil ou Biblioteca.",
};

type Draft = {
  id: number;
  type: CreateType;
  text: string;
  context: CreateContext;
  savedAt: string;
};

class CreateBoundary extends Component<
  { children: React.ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="create-center-root">
          <section className="create-center-fallback">
            <CircleAlert size={30} />
            <h2>Não foi possível abrir a criação</h2>
            <p>O restante do aplicativo continua funcionando normalmente.</p>
            <button onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
            <button className="secondary" onClick={this.props.onClose}>
              Fechar
            </button>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

function CreateContent({
  visible,
  context,
  onClose,
  onNavigate,
  showToast,
}: {
  visible: boolean;
  context: CreateContext;
  onClose: () => void;
  onNavigate: (destination: string) => void;
  showToast: (message: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [type, setType] = useState<CreateType | null>(null);
  const [audience, setAudience] = useState<Audience>("Comunidade");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [pollOptions, setPollOptions] = useState(["Sim", "Ainda estou pensando"]);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [composerState, setComposerState] = useState<ComposerState>("editing");
  const [exitWarning, setExitWarning] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const savedDrafts = window.localStorage.getItem("vdn-create-drafts");
    const savedAudience = window.localStorage.getItem(`vdn-audience-${context}`);
    const timer = window.setTimeout(() => {
      if (savedDrafts) {
        try {
          setDrafts(JSON.parse(savedDrafts));
        } catch {
          // Demonstration defaults stay empty.
        }
      }
      if (
        savedAudience === "Comunidade" ||
        savedAudience === "Amigos" ||
        savedAudience === "Espaço" ||
        savedAudience === "Somente eu"
      ) {
        setAudience(savedAudience);
      }
      setShowAll(false);
      setComposerState("editing");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [context, visible]);

  useEffect(() => {
    if (!type) return;
    const saved = window.localStorage.getItem(`vdn-draft-${context}-${type}`);
    const timer = window.setTimeout(() => {
      if (saved) setText(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [context, type]);

  useEffect(() => {
    if (!type) return;
    window.localStorage.setItem(`vdn-draft-${context}-${type}`, text);
  }, [context, text, type]);

  const actions = showAll ? contextActions[context].all : contextActions[context].primary;

  const hasChanges = Boolean(text.trim() || title.trim() || attachment);
  const isPoll = type === "Enquete";
  const isPrayer = type === "Pedido de oração";
  const isMoment = type === "Momento";

  const resetComposer = () => {
    if (type) window.localStorage.removeItem(`vdn-draft-${context}-${type}`);
    setText("");
    setTitle("");
    setAttachment(null);
    setAnonymous(false);
    setComposerState("editing");
  };

  const closeComposer = () => {
    if (hasChanges) {
      setExitWarning(true);
      return;
    }
    setType(null);
  };

  const saveDraft = () => {
    if (!type) return;
    const next = [
      {
        id: Date.now(),
        type,
        text: text || title || "Rascunho sem texto",
        context,
        savedAt: "agora",
      },
      ...drafts.filter((draft) => !(draft.type === type && draft.context === context)),
    ];
    setDrafts(next);
    window.localStorage.setItem("vdn-create-drafts", JSON.stringify(next));
    window.localStorage.setItem(`vdn-draft-${context}-${type}`, text);
    showToast("Rascunho salvo neste dispositivo");
  };

  const publish = () => {
    if (!type) return;
    if (!text.trim() && !title.trim() && !attachment && type !== "Lembrete") {
      showToast("Adicione conteúdo antes de continuar");
      textRef.current?.focus();
      return;
    }
    setComposerState("publishing");
    window.setTimeout(() => {
      setComposerState("published");
      window.setTimeout(() => {
        resetComposer();
        setType(null);
        onClose();
        showToast(`${type} publicado neste protótipo`);
      }, 720);
    }, 850);
  };

  const selectType = (nextType: CreateType) => {
    if (nextType === "Evento") {
      onClose();
      onNavigate("events");
      return;
    }
    if (nextType === "Espaço novo") {
      onClose();
      onNavigate("new-space");
      return;
    }
    setType(nextType);
    setComposerState("editing");
    window.requestAnimationFrame(() => textRef.current?.focus({ preventScroll: true }));
  };

  if (!visible) return null;

  if (type) {
    const TypeIcon = actionIcon[type] ?? MessageCircle;
    return (
      <div className="create-center-root">
        <section className="create-composer" role="dialog" aria-modal="true">
          <header className="create-composer-header">
            <button aria-label="Voltar para Central Criar" onClick={closeComposer}>
              <ArrowLeft size={21} />
            </button>
            <div>
              <strong>{type}</strong>
              <span>em {context}</span>
            </div>
            <button
              className="create-publish-header"
              disabled={composerState === "publishing"}
              onClick={publish}
            >
              {composerState === "publishing" ? "Publicando…" : "Publicar"}
            </button>
          </header>

          <div className="create-composer-layout">
            <main className="create-composer-main">
              {composerState === "offline" && (
                <div className="create-state-banner">
                  <WifiOff size={17} />
                  <span>
                    <strong>Você está offline</strong>O conteúdo será salvo localmente.
                  </span>
                </div>
              )}
              {composerState === "error" && (
                <div className="create-state-banner error">
                  <CircleAlert size={17} />
                  <span>
                    <strong>Uma mídia falhou</strong>Seu texto e o restante do rascunho estão
                    preservados.
                  </span>
                  <button onClick={() => setComposerState("editing")}>Tentar de novo</button>
                </div>
              )}
              {composerState === "published" && (
                <div className="create-published-state">
                  <Check size={30} />
                  <h2>Publicado</h2>
                  <p>Levando você de volta ao contexto correto.</p>
                </div>
              )}

              <section className="composer-identity">
                <div className="avatar avatar-sm">AR</div>
                <div>
                  <strong>Antonio Rodrigues</strong>
                  <button onClick={() => setAudienceOpen(true)}>
                    {audience} <ChevronDown size={15} />
                  </button>
                </div>
                <span className="composer-type-icon">
                  <TypeIcon size={19} />
                </span>
              </section>

              {(type === "Pergunta" || type === "Testemunho" || isPoll) && (
                <input
                  className="composer-title-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={
                    isPoll ? "Qual é a sua pergunta?" : `Título do ${type.toLowerCase()}`
                  }
                  aria-label="Título"
                />
              )}

              <textarea
                ref={textRef}
                className="create-composer-text"
                value={text}
                onChange={(event) => {
                  if (event.target.value.length <= 1600) setText(event.target.value);
                }}
                placeholder={
                  isPrayer
                    ? "Como a comunidade pode orar com você?"
                    : isMoment
                      ? "Escreva algo breve para acompanhar..."
                      : "O que você quer compartilhar?"
                }
                aria-label={`Conteúdo de ${type}`}
              />

              <div className="composer-character-count">
                <span>{text.length}/1600</span>
                {text.length > 1450 && <em>Você está perto do limite.</em>}
              </div>

              {isPrayer && (
                <button
                  className={`composer-option-row ${anonymous ? "active" : ""}`}
                  onClick={() => setAnonymous((value) => !value)}
                >
                  <Lock size={18} />
                  <span>
                    <strong>Publicar anonimamente</strong>
                    <small>Sua identidade continua visível apenas à moderação.</small>
                  </span>
                  <i>{anonymous ? <Check size={14} /> : null}</i>
                </button>
              )}

              {isPoll && (
                <div className="composer-poll-options">
                  {pollOptions.map((option, index) => (
                    <label key={index}>
                      <span>{index + 1}</span>
                      <input
                        value={option}
                        onChange={(event) =>
                          setPollOptions((current) =>
                            current.map((value, optionIndex) =>
                              optionIndex === index ? event.target.value : value,
                            ),
                          )
                        }
                        placeholder={`Opção ${index + 1}`}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          aria-label={`Remover opção ${index + 1}`}
                          onClick={() =>
                            setPollOptions((current) =>
                              current.filter((_, optionIndex) => optionIndex !== index),
                            )
                          }
                        >
                          <X size={16} />
                        </button>
                      )}
                    </label>
                  ))}
                  <button
                    disabled={pollOptions.length >= 5}
                    onClick={() => setPollOptions((current) => [...current, ""])}
                  >
                    <Plus size={16} /> Adicionar opção
                  </button>
                  <button onClick={() => setMultipleChoice((value) => !value)}>
                    <i className={multipleChoice ? "checked" : ""}>
                      {multipleChoice && <Check size={13} />}
                    </i>
                    Permitir múltipla escolha
                  </button>
                  <label className="poll-duration">
                    Duração
                    <select defaultValue="3 dias">
                      <option>1 dia</option>
                      <option>3 dias</option>
                      <option>7 dias</option>
                    </select>
                  </label>
                </div>
              )}

              {attachment && (
                <div className="composer-media-preview">
                  <div>
                    {attachment === "Vídeo" ? <Video size={28} /> : <ImageIcon size={28} />}
                    <span>Preview de {attachment.toLowerCase()}</span>
                    <small>Upload visual concluído</small>
                  </div>
                  <button aria-label="Remover anexo" onClick={() => setAttachment(null)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              <div className="composer-attachment-bar">
                <button onClick={() => setAttachmentOpen(true)}>
                  <Paperclip size={19} /> Anexar
                </button>
                <button onClick={saveDraft}>
                  <Save size={19} /> Salvar rascunho
                </button>
                <button
                  aria-label="Mais opções"
                  onClick={() =>
                    setComposerState((state) => (state === "offline" ? "editing" : "offline"))
                  }
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </main>

            <aside className="create-composer-preview">
              <span className="create-preview-kicker">PRÉVIA</span>
              <article>
                <header>
                  <div className="avatar avatar-sm">AR</div>
                  <div>
                    <strong>Antonio Rodrigues</strong>
                    <small>{audience} · agora</small>
                  </div>
                </header>
                {title && <h2>{title}</h2>}
                <p>{text || "Seu conteúdo aparecerá aqui enquanto você escreve."}</p>
                {attachment && (
                  <div className="preview-media">
                    <ImageIcon size={28} />
                    <span>{attachment}</span>
                  </div>
                )}
              </article>
              <div className="create-preview-note">
                <ShieldCheck size={17} />
                <span>
                  <strong>{audience}</strong>
                  {audienceDescription[audience]}
                </span>
              </div>
            </aside>
          </div>

          {audienceOpen && (
            <div className="create-suboverlay" onMouseDown={() => setAudienceOpen(false)}>
              <section className="create-subsheet" onMouseDown={(event) => event.stopPropagation()}>
                <header>
                  <h2>Quem pode ver?</h2>
                  <button onClick={() => setAudienceOpen(false)}>
                    <X size={20} />
                  </button>
                </header>
                {(["Comunidade", "Amigos", "Espaço", "Somente eu"] as Audience[]).map((option) => {
                  const Icon =
                    option === "Comunidade"
                      ? Globe2
                      : option === "Amigos"
                        ? UsersRound
                        : option === "Espaço"
                          ? HeartHandshake
                          : Lock;
                  return (
                    <button
                      key={option}
                      className={audience === option ? "selected" : ""}
                      onClick={() => {
                        setAudience(option);
                        window.localStorage.setItem(`vdn-audience-${context}`, option);
                        setAudienceOpen(false);
                      }}
                    >
                      <Icon size={19} />
                      <span>
                        <strong>{option}</strong>
                        <small>{audienceDescription[option]}</small>
                      </span>
                      {audience === option && <Check size={18} />}
                    </button>
                  );
                })}
              </section>
            </div>
          )}

          {attachmentOpen && (
            <div className="create-suboverlay" onMouseDown={() => setAttachmentOpen(false)}>
              <section
                className="create-subsheet attachment-sheet"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <header>
                  <h2>Adicionar</h2>
                  <button onClick={() => setAttachmentOpen(false)}>
                    <X size={20} />
                  </button>
                </header>
                <div className="create-attachment-grid">
                  {[
                    ["Câmera", Camera],
                    ["Biblioteca", ImageIcon],
                    ["Vídeo", Video],
                    ["Documento", FileText],
                    ["GIF", Film],
                    ["Sticker", Sparkles],
                    ["Versículo", BookOpen],
                    ["Evento", CalendarDays],
                    ["Perfil", UserRound],
                    ["Item da Loja", ShoppingBag],
                  ].map(([label, Icon]) => {
                    const AttachmentIcon = Icon as typeof Camera;
                    return (
                      <button
                        key={String(label)}
                        onClick={() => {
                          setAttachment(String(label));
                          setAttachmentOpen(false);
                        }}
                      >
                        <AttachmentIcon size={20} />
                        <span>{String(label)}</span>
                      </button>
                    );
                  })}
                  <button disabled>
                    <MapPinOff size={20} />
                    <span>Localização</span>
                    <small>Não permitida</small>
                  </button>
                </div>
                <button
                  className="simulate-media-error"
                  onClick={() => {
                    setAttachmentOpen(false);
                    setComposerState("error");
                  }}
                >
                  Demonstrar mídia inválida
                </button>
              </section>
            </div>
          )}

          {exitWarning && (
            <div className="create-suboverlay">
              <section className="create-exit-warning">
                <CircleAlert size={28} />
                <h2>Guardar suas alterações?</h2>
                <p>Seu conteúdo ainda não foi publicado.</p>
                <button
                  onClick={() => {
                    saveDraft();
                    setExitWarning(false);
                    setType(null);
                  }}
                >
                  Salvar e sair
                </button>
                <button
                  onClick={() => {
                    resetComposer();
                    setExitWarning(false);
                    setType(null);
                  }}
                >
                  Descartar
                </button>
                <button className="secondary" onClick={() => setExitWarning(false)}>
                  Continuar editando
                </button>
              </section>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="create-center-root" role="dialog" aria-modal="true" aria-label="Central Criar">
      <button
        className="create-center-backdrop"
        aria-label="Fechar Central Criar"
        onClick={onClose}
      />
      <section className="create-center-sheet">
        <div className="create-center-handle" />
        <header>
          <div>
            <span>Criar em {context}</span>
            <h1>Criar</h1>
          </div>
          <div>
            <button className="create-drafts-button" onClick={() => setDraftsOpen(true)}>
              <FileText size={18} /> Rascunhos {drafts.length > 0 && <b>{drafts.length}</b>}
            </button>
            <button aria-label="Fechar Central Criar" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <p className="create-center-intro">
          {context === "Comunidade" && "Compartilhe algo com a comunidade."}
          {context === "Espaços" && "Crie dentro do contexto deste Espaço."}
          {context === "Verbo" && "Registre, estude ou compartilhe uma passagem."}
          {context === "Perfil" && "Atualize como sua história aparece."}
          {context === "Cinema" && "Prepare sua próxima experiência no Cinema."}
        </p>

        <div className="create-action-list">
          {actions.map((action) => {
            const Icon = actionIcon[action] ?? MessageCircle;
            const restricted = action === "Sessão" || action === "Item de catálogo";
            return (
              <button key={action} onClick={() => selectType(action)}>
                <span className="create-action-icon">
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{action}</strong>
                  <small>
                    {typeDescriptions[action] ??
                      (restricted ? "Disponível conforme sua permissão." : `Criar em ${context}.`)}
                  </small>
                </span>
                {restricted && (
                  <em>
                    <Lock size={13} /> Host
                  </em>
                )}
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>

        {contextActions[context].all.length > contextActions[context].primary.length && (
          <button className="create-see-all" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Mostrar principais" : "Ver todas as opções"}
            <ChevronDown size={17} className={showAll ? "rotated" : ""} />
          </button>
        )}
      </section>

      {draftsOpen && (
        <div className="create-suboverlay" onMouseDown={() => setDraftsOpen(false)}>
          <section
            className="create-subsheet drafts-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Rascunhos</h2>
              <button onClick={() => setDraftsOpen(false)}>
                <X size={20} />
              </button>
            </header>
            {drafts.length ? (
              drafts.map((draft) => (
                <div className="create-draft-row" key={draft.id}>
                  <button
                    onClick={() => {
                      setType(draft.type);
                      setText(draft.text === "Rascunho sem texto" ? "" : draft.text);
                      setDraftsOpen(false);
                    }}
                  >
                    <span>
                      <strong>{draft.type}</strong>
                      <small>
                        {draft.context} · {draft.savedAt}
                      </small>
                    </span>
                    <p>{draft.text}</p>
                  </button>
                  <button
                    aria-label={`Excluir rascunho de ${draft.type}`}
                    onClick={() => {
                      const next = drafts.filter((item) => item.id !== draft.id);
                      setDrafts(next);
                      window.localStorage.setItem("vdn-create-drafts", JSON.stringify(next));
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="create-drafts-empty">
                <FileText size={27} />
                <h3>Nenhum rascunho</h3>
                <p>Conteúdos salvos aparecerão aqui, separados por contexto.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function CreateCenterExperience(props: {
  visible: boolean;
  context: CreateContext;
  onClose: () => void;
  onNavigate: (destination: string) => void;
  showToast: (message: string) => void;
}) {
  if (!props.visible) return null;
  return (
    <CreateBoundary onClose={props.onClose}>
      <CreateContent {...props} />
    </CreateBoundary>
  );
}
