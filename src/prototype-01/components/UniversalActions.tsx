"use client";

import {
  Archive,
  BellOff,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  EyeOff,
  Flag,
  Link2,
  LockKeyhole,
  MoreHorizontal,
  Pin,
  Search,
  Send,
  Share2,
  ShieldAlert,
  Trash2,
  UserRound,
  UserRoundX,
  VolumeX,
  X,
} from "lucide-react";
import React, { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type ActionContext = {
  type: string;
  title: string;
  own?: boolean;
  source?: string;
  anchor?: { x: number; y: number };
};

type Flow = "main" | "share" | "external" | "save" | "report" | "mute" | "confirm" | "collections";

const inferContext = (target: HTMLElement): ActionContext => {
  const tagged = target.closest<HTMLElement>("[data-action-context]");
  if (tagged?.dataset.actionContext) {
    return {
      type: tagged.dataset.actionContext,
      title: tagged.dataset.actionTitle || tagged.getAttribute("aria-label") || "Conteúdo",
      own: tagged.dataset.actionOwn === "true",
    };
  }
  if (target.closest(".comment, .comment-row")) return { type: "comment", title: "Comentário" };
  if (target.closest(".chat-screen, .messages-screen"))
    return { type: "conversation", title: "Conversa" };
  if (target.closest(".profile-screen, .people-experience"))
    return { type: "profile", title: "Perfil" };
  if (target.closest(".events-experience")) return { type: "event", title: "Evento" };
  if (target.closest(".cinema-experience")) return { type: "cinema", title: "Sessão do Cinema" };
  if (target.closest(".verbo-experience")) return { type: "verbo", title: "Conteúdo do Verbo" };
  if (target.closest(".store-experience")) return { type: "store", title: "Item da Loja" };
  if (target.closest(".space-detail, .community-space")) return { type: "space", title: "Espaço" };
  if (target.closest(".profile-gallery, .vdn-media-layer"))
    return { type: "gallery", title: "Mídia" };
  return { type: "publication", title: "Publicação" };
};

const actionLabels: Record<string, string[]> = {
  publication: [
    "Salvar",
    "Compartilhar",
    "Ocultar",
    "Denunciar",
    "Silenciar autor",
    "Abrir Perfil",
  ],
  comment: ["Responder", "Copiar", "Denunciar"],
  profile: ["Compartilhar", "Silenciar", "Restringir", "Bloquear", "Denunciar"],
  conversation: ["Silenciar", "Fixar", "Arquivar", "Limpar", "Bloquear", "Denunciar"],
  "conversation-media": [
    "Responder",
    "Encaminhar",
    "Salvar",
    "Baixar",
    "Denunciar",
    "Abrir conversa",
  ],
  space: ["Compartilhar", "Silenciar", "Sair", "Denunciar"],
  event: ["Compartilhar", "Salvar", "Lembrar", "Denunciar"],
  cinema: ["Compartilhar", "Salvar", "Lembrar", "Denunciar", "Abrir sessão"],
  store: ["Favoritar", "Compartilhar", "Presentear", "Ver coleção"],
  verbo: ["Copiar", "Compartilhar", "Anotar", "Ouvir", "Criar publicação"],
  moment: ["Compartilhar", "Salvar", "Silenciar Momentos", "Denunciar", "Abrir Perfil"],
  gallery: ["Compartilhar", "Salvar", "Copiar link", "Denunciar"],
  "profile-media": ["Editar", "Definir como destaque", "Privacidade", "Compartilhar", "Remover"],
  share: ["Compartilhar"],
};

const iconFor = (label: string) => {
  if (/Compartilhar|Encaminhar|Presentear/.test(label)) return Share2;
  if (/Salvar|Favoritar/.test(label)) return Bookmark;
  if (/Denunciar/.test(label)) return Flag;
  if (/Silenciar/.test(label)) return VolumeX;
  if (/Ocultar/.test(label)) return EyeOff;
  if (/Restringir|Privacidade/.test(label)) return LockKeyhole;
  if (/Bloquear/.test(label)) return UserRoundX;
  if (/Copiar/.test(label)) return Copy;
  if (/Editar|Anotar/.test(label)) return Edit3;
  if (/Arquivar/.test(label)) return Archive;
  if (/Excluir|Remover|Limpar|Sair/.test(label)) return Trash2;
  if (/Fixar|Destaque/.test(label)) return Pin;
  if (/Baixar/.test(label)) return Download;
  if (/Lembrar/.test(label)) return BellOff;
  if (/Perfil|coleção|Ver coleção/.test(label)) return UserRound;
  if (/Abrir|Criar|Ouvir|Responder/.test(label)) return ExternalLink;
  return MoreHorizontal;
};

function UniversalActionExperience() {
  const [context, setContext] = useState<ActionContext | null>(null);
  const [flow, setFlow] = useState<Flow>("main");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [collection, setCollection] = useState("Geral");
  const [customCollection, setCustomCollection] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportContext, setReportContext] = useState("");
  const [reportStep, setReportStep] = useState(1);
  const [muteTarget, setMuteTarget] = useState("Notificações");
  const [muteDuration, setMuteDuration] = useState("1 semana");
  const [confirmAction, setConfirmAction] = useState("");
  const [toast, setToast] = useState("");
  const [dragY, setDragY] = useState(0);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number; target: HTMLElement } | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const open = (detail: ActionContext) => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setContext(detail);
    setFlow("main");
    setQuery("");
    setMessage("");
    setReportReason("");
    setReportContext("");
    setReportStep(1);
    setDragY(0);
    window.requestAnimationFrame(() => panelRef.current?.focus());
  };

  const close = () => {
    setContext(null);
    setFlow("main");
    setDragY(0);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const notify = (text: string, undo = false) => {
    setToast(undo ? `${text} · Desfazer` : text);
    window.setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    const onCustomOpen = (event: Event) => open((event as CustomEvent<ActionContext>).detail);
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button?.querySelector(".lucide-more-horizontal")) return;
      if (button.closest(".universal-actions, .vdn-media-layer")) return;
      event.preventDefault();
      event.stopPropagation();
      const inferred = inferContext(button);
      const rect = button.getBoundingClientRect();
      open({ ...inferred, anchor: { x: rect.right, y: rect.bottom + 6 } });
    };
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".app-shell") || target.closest("input, textarea")) return;
      event.preventDefault();
      open({ ...inferContext(target), anchor: { x: event.clientX, y: event.clientY } });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const target = event.target as HTMLElement;
      const actionable = target.closest<HTMLElement>("[data-action-context]");
      if (!actionable || actionable.closest(".vdn-media-layer, button, input, textarea")) return;
      pressStartRef.current = { x: event.clientX, y: event.clientY, target: actionable };
      pressTimerRef.current = window.setTimeout(() => {
        open({ ...inferContext(actionable), anchor: { x: event.clientX, y: event.clientY } });
        pressStartRef.current = null;
      }, 520);
    };
    const cancelPress = (event?: PointerEvent) => {
      if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
      if (
        event &&
        pressStartRef.current &&
        Math.hypot(
          event.clientX - pressStartRef.current.x,
          event.clientY - pressStartRef.current.y,
        ) > 10
      ) {
        pressStartRef.current = null;
      }
    };
    window.addEventListener("vdn-open-actions", onCustomOpen);
    document.addEventListener("click", onClick, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", cancelPress);
    document.addEventListener("pointerup", cancelPress);
    document.addEventListener("pointercancel", cancelPress);
    return () => {
      window.removeEventListener("vdn-open-actions", onCustomOpen);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", cancelPress);
      document.removeEventListener("pointerup", cancelPress);
      document.removeEventListener("pointercancel", cancelPress);
    };
  }, []);

  useEffect(() => {
    if (!context) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (flow === "main") close();
        else setFlow("main");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [context, flow]);

  const actions = useMemo(() => {
    const type = context?.type ?? "publication";
    const base = actionLabels[type] ?? actionLabels.publication;
    if (context?.own) {
      return [
        "Editar",
        "Arquivar",
        "Copiar",
        "Compartilhar",
        ...base.filter((item) => !/Denunciar|Bloquear/.test(item)),
        "Excluir",
      ];
    }
    return base;
  }, [context]);

  const startAction = (label: string) => {
    if (/Compartilhar|Encaminhar|Presentear/.test(label)) {
      setFlow("share");
      return;
    }
    if (/Salvar|Favoritar/.test(label)) {
      setFlow("save");
      return;
    }
    if (/Denunciar/.test(label)) {
      setFlow("report");
      return;
    }
    if (/Silenciar/.test(label)) {
      setFlow("mute");
      return;
    }
    if (/Bloquear|Restringir|Excluir|Remover|Limpar|Sair/.test(label)) {
      setConfirmAction(label);
      setFlow("confirm");
      return;
    }
    if (/Copiar/.test(label)) {
      navigator.clipboard?.writeText(context?.title ?? "Conteúdo").catch(() => undefined);
      close();
      notify("Copiado");
      return;
    }
    if (/Ocultar|Arquivar/.test(label)) {
      close();
      notify(label === "Ocultar" ? "Conteúdo ocultado" : "Conteúdo arquivado", true);
      return;
    }
    close();
    notify(`${label} aberto`);
  };

  const shareTargets = [
    ["Ana Clara", "Conversa", "AC"],
    ["Trio de Peruíbe", "Grupo", "TP"],
    ["Café, Bíblia & Amizade", "Espaço", "CB"],
    ["Meu Momento", "Momento", "AR"],
    ["Encontro de hoje", "Evento", "21"],
    ["Antonio Rodrigues", "Perfil", "AR"],
  ].filter(([name, type]) => `${name} ${type}`.toLowerCase().includes(query.toLowerCase()));

  const runShare = (target: string) => {
    close();
    notify(
      message.trim()
        ? `Compartilhado com ${target} e mensagem enviada`
        : `Compartilhado com ${target}`,
    );
  };

  if (!context) {
    return (
      <div className={`universal-action-toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    );
  }

  const title =
    flow === "share"
      ? "Compartilhar com"
      : flow === "external"
        ? "Compartilhar fora do app"
        : flow === "save"
          ? "Salvar em uma coleção"
          : flow === "report"
            ? "Denunciar"
            : flow === "mute"
              ? "Silenciar"
              : flow === "confirm"
                ? confirmAction
                : "Ações";

  return (
    <>
      <div
        className="universal-actions-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div
          ref={panelRef}
          className={`universal-actions flow-${flow} ${context.anchor ? "has-anchor" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          style={
            {
              "--action-x": `${context.anchor?.x ?? 0}px`,
              "--action-y": `${context.anchor?.y ?? 0}px`,
              "--action-drag-y": `${dragY}px`,
            } as React.CSSProperties
          }
        >
          <button
            className="universal-sheet-handle"
            aria-label="Arrastar para fechar"
            onPointerDown={(event) => {
              dragStartRef.current = event.clientY;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (dragStartRef.current !== null)
                setDragY(Math.max(0, event.clientY - dragStartRef.current));
            }}
            onPointerUp={() => {
              if (dragY > 80) close();
              else setDragY(0);
              dragStartRef.current = null;
            }}
          >
            <span />
          </button>
          <header>
            {flow !== "main" ? (
              <button onClick={() => setFlow("main")} aria-label="Voltar">
                <ChevronLeft />
              </button>
            ) : (
              <span className="universal-context-icon">
                <MoreHorizontal />
              </span>
            )}
            <div>
              <strong>{title}</strong>
              <small>
                {flow === "main"
                  ? context.title
                  : "Ação demonstrativa · nenhum dado real será alterado"}
              </small>
            </div>
            <button onClick={close} aria-label="Fechar">
              <X />
            </button>
          </header>

          {flow === "main" && (
            <div className="universal-action-list">
              {actions.map((label) => {
                const Icon = iconFor(label);
                const destructive = /Bloquear|Excluir|Remover|Limpar|Sair|Denunciar/.test(label);
                return (
                  <button
                    key={label}
                    className={destructive ? "destructive" : ""}
                    onClick={() => startAction(label)}
                  >
                    <Icon />
                    <span>{label}</span>
                    <ChevronRight />
                  </button>
                );
              })}
            </div>
          )}

          {flow === "share" && (
            <div className="universal-share-flow">
              <label className="universal-search">
                <Search />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  inputMode="search"
                  enterKeyHint="search"
                  placeholder="Buscar Amigos, grupos ou Espaços"
                  aria-label="Buscar destino para compartilhar"
                />
              </label>
              <div className="universal-share-shortcuts">
                <button onClick={() => setFlow("external")}>
                  <ExternalLink />
                  <span>Fora do app</span>
                </button>
                <button onClick={() => runShare("Meu Momento")}>
                  <UserRound />
                  <span>Momento</span>
                </button>
                <button onClick={() => runShare("uma publicação")}>
                  <Send />
                  <span>Publicação</span>
                </button>
                <button onClick={() => runShare("um evento")}>
                  <BellOff />
                  <span>Evento</span>
                </button>
              </div>
              <span className="universal-group-title">Recentes e Amigos</span>
              <div className="universal-target-list">
                {shareTargets.map(([name, type, initials]) => (
                  <button key={`${type}-${name}`} onClick={() => runShare(name)}>
                    <span className="avatar">{initials}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>{type}</small>
                    </span>
                    <Send />
                  </button>
                ))}
              </div>
              <label className="optional-share-message">
                Mensagem opcional
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Diga algo sobre este conteúdo"
                />
              </label>
            </div>
          )}

          {flow === "external" && (
            <div className="external-share-flow">
              <div className="external-preview">
                <span>
                  <Share2 />
                </span>
                <div>
                  <strong>{context.title}</strong>
                  <small>Link interno do VaiDarNamoro</small>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard
                    ?.writeText("https://vaidarnamoro.com/conteudo")
                    .catch(() => undefined);
                  close();
                  notify("Link copiado");
                }}
              >
                <Link2 />
                <span>
                  <strong>Copiar link</strong>
                  <small>Use em qualquer aplicativo</small>
                </span>
              </button>
              <button
                onClick={() => {
                  close();
                  notify("Texto copiado");
                }}
              >
                <Clipboard />
                <span>
                  <strong>Copiar texto</strong>
                  <small>Inclui título e referência</small>
                </span>
              </button>
              <button
                onClick={() => {
                  close();
                  notify("Card preparado para download");
                }}
              >
                <Download />
                <span>
                  <strong>Baixar card</strong>
                  <small>Geração visual simulada</small>
                </span>
              </button>
              <p>O compartilhamento nativo do aparelho não foi simulado como se fosse real.</p>
            </div>
          )}

          {flow === "save" && (
            <div className="save-flow">
              {["Geral", "Ver depois", "Inspirações", "Estudos", "Cinema", "Loja"].map((item) => (
                <button
                  key={item}
                  className={collection === item ? "active" : ""}
                  onClick={() => setCollection(item)}
                >
                  <Bookmark />
                  <span>{item}</span>
                  {collection === item && <Check />}
                </button>
              ))}
              <label>
                Nova coleção
                <input
                  value={customCollection}
                  onChange={(event) => setCustomCollection(event.target.value)}
                  placeholder="Nome da coleção"
                />
              </label>
              <button
                className="universal-primary"
                onClick={() => {
                  const target = customCollection.trim() || collection;
                  close();
                  notify(`Salvo em ${target}`);
                }}
              >
                Salvar
              </button>
            </div>
          )}

          {flow === "report" && (
            <div className="report-flow">
              <div className="report-progress" aria-label={`Etapa ${reportStep} de 3`}>
                <span className={reportStep >= 1 ? "active" : ""} />
                <span className={reportStep >= 2 ? "active" : ""} />
                <span className={reportStep >= 3 ? "active" : ""} />
              </div>
              {reportStep === 1 && (
                <div className="report-reasons">
                  {[
                    "Spam",
                    "Abuso",
                    "Impróprio",
                    "Fraude",
                    "Assédio",
                    "Risco",
                    "Identidade",
                    "Direitos",
                    "Outro",
                  ].map((reason) => (
                    <button
                      key={reason}
                      className={reportReason === reason ? "active" : ""}
                      onClick={() => setReportReason(reason)}
                    >
                      <span>{reason}</span>
                      {reportReason === reason && <Check />}
                    </button>
                  ))}
                </div>
              )}
              {reportStep === 2 && (
                <div className="report-context">
                  <label>
                    Contexto opcional
                    <textarea
                      value={reportContext}
                      onChange={(event) => setReportContext(event.target.value)}
                      placeholder="Explique brevemente o que aconteceu"
                    />
                  </label>
                  <button onClick={() => notify("Evidência simulada anexada")}>
                    <Download /> Anexar evidência simulada
                  </button>
                  <label>
                    <input type="checkbox" /> Silenciar este conteúdo
                  </label>
                  <label>
                    <input type="checkbox" /> Bloquear depois de enviar
                  </label>
                </div>
              )}
              {reportStep === 3 && (
                <div className="report-confirm">
                  <ShieldAlert />
                  <strong>Pronto para enviar</strong>
                  <p>
                    Motivo: {reportReason || "Não selecionado"}. A denúncia será demonstrativa e
                    revisada por uma pessoa.
                  </p>
                  <button
                    className="universal-primary"
                    onClick={() => {
                      close();
                      notify("Denúncia enviada");
                    }}
                  >
                    Confirmar denúncia
                  </button>
                </div>
              )}
              {reportStep < 3 && (
                <button
                  className="universal-primary"
                  disabled={reportStep === 1 && !reportReason}
                  onClick={() => setReportStep((current) => Math.min(3, current + 1))}
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {flow === "mute" && (
            <div className="mute-flow">
              <span className="universal-group-title">O que silenciar</span>
              {["Notificações", "Momentos", "Conteúdo"].map((item) => (
                <button
                  key={item}
                  className={muteTarget === item ? "active" : ""}
                  onClick={() => setMuteTarget(item)}
                >
                  <BellOff />
                  <span>{item}</span>
                  {muteTarget === item && <Check />}
                </button>
              ))}
              <span className="universal-group-title">Por quanto tempo</span>
              <div className="duration-row">
                {["8 horas", "1 semana", "Sempre"].map((item) => (
                  <button
                    key={item}
                    className={muteDuration === item ? "active" : ""}
                    onClick={() => setMuteDuration(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                className="universal-primary"
                onClick={() => {
                  close();
                  notify(`${muteTarget} silenciado por ${muteDuration}`);
                }}
              >
                Confirmar
              </button>
            </div>
          )}

          {flow === "confirm" && (
            <div className="critical-confirm-flow">
              {confirmAction === "Bloquear" ? (
                <UserRoundX />
              ) : confirmAction === "Restringir" ? (
                <LockKeyhole />
              ) : (
                <Trash2 />
              )}
              <strong>
                {confirmAction} {context.title}?
              </strong>
              <p>
                {confirmAction === "Bloquear"
                  ? "Esta pessoa deixa de ver seu Perfil e de interagir com você. A ação pode ser desfeita nas Configurações."
                  : confirmAction === "Restringir"
                    ? "As interações serão reduzidas e novas mensagens voltarão para Solicitações."
                    : "O conteúdo irá para a lixeira e poderá ser restaurado por um período."}
              </p>
              <button
                className="universal-danger"
                onClick={() => {
                  close();
                  notify(`${confirmAction} concluído`, !/Bloquear|Restringir/.test(confirmAction));
                }}
              >
                {confirmAction}
              </button>
              <button onClick={() => setFlow("main")}>Cancelar</button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`universal-action-toast ${toast ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}

class ActionsBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    window.dispatchEvent(new CustomEvent("vdn-actions-local-error"));
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <button className="actions-local-error" onClick={() => this.setState({ failed: false })}>
        Fechar ações indisponíveis
      </button>
    );
  }
}

export default function UniversalActions() {
  return (
    <ActionsBoundary>
      <UniversalActionExperience />
    </ActionsBoundary>
  );
}
