"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Crop,
  Download,
  Flag,
  Link2,
  Maximize2,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Send,
  Share2,
  SmilePlus,
  Sparkles,
  Type,
  Undo2,
  UserRound,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type MediaKind = "moment" | "photo" | "album" | "video" | "chat" | "profile" | "create";

export type MediaRequest = {
  kind: MediaKind;
  title?: string;
  index?: number;
  state?: "ready" | "loading" | "low-resolution" | "error" | "offline" | "removed" | "private";
};

type MomentFrame = {
  author: string;
  initials: string;
  time: string;
  context: string;
  type: "photo" | "video" | "text" | "verse" | "event" | "space" | "profile" | "store";
  src?: string;
  eyebrow?: string;
  title: string;
  body?: string;
  accent: string;
};

const momentFrames: MomentFrame[] = [
  {
    author: "Ana Clara",
    initials: "AC",
    time: "há 12 min",
    context: "Amigos",
    type: "photo",
    src: "/community-peruibe.png",
    title: "Fim de tarde com gente que faz bem",
    body: "Peruíbe, SP",
    accent: "#f06d7f",
  },
  {
    author: "Lucas Almeida",
    initials: "LA",
    time: "há 25 min",
    context: "Amigos",
    type: "text",
    eyebrow: "UMA IDEIA PARA HOJE",
    title: "Nem toda pausa é atraso. Às vezes, é Deus reorganizando o caminho.",
    accent: "#6554d9",
  },
  {
    author: "Café, Bíblia & Amizade",
    initials: "CB",
    time: "há 41 min",
    context: "Espaço",
    type: "verse",
    eyebrow: "JOÃO 8:32 · NAA",
    title: "“E conhecereis a verdade, e a verdade vos libertará.”",
    body: "Abrir capítulo no Verbo",
    accent: "#ce7a45",
  },
  {
    author: "Encontro hoje",
    initials: "21",
    time: "há 1 h",
    context: "Evento",
    type: "event",
    src: "/profile-coast-dusk.png",
    eyebrow: "HOJE · 21H30 · ONLINE",
    title: "Conversa sobre João 8",
    body: "128 pessoas demonstraram interesse",
    accent: "#e04f67",
  },
  {
    author: "Marina Souza",
    initials: "MS",
    time: "há 1 h",
    context: "Vídeo vertical",
    type: "video",
    src: "/community-peruibe.png",
    title: "O que significa pertencer de verdade?",
    body: "Café, Bíblia & Amizade",
    accent: "#ec6f5c",
  },
  {
    author: "Antonio Rodrigues",
    initials: "AR",
    time: "há 2 h",
    context: "Perfil",
    type: "profile",
    src: "/profile-coast-dusk.png",
    eyebrow: "PERFIL EM DESTAQUE",
    title: "Construindo coisas, vivendo a fé e conhecendo gente boa.",
    body: "@antoniorodrigues",
    accent: "#52679b",
  },
  {
    author: "Loja VDN",
    initials: "VD",
    time: "há 3 h",
    context: "Item da Loja",
    type: "store",
    src: "/pet-bento.png",
    eyebrow: "NOVIDADE NA LOJA",
    title: "Cantinho do Bento",
    body: "Visualizar item e experimentar no Perfil",
    accent: "#a96a45",
  },
  {
    author: "Cristãos do Litoral Sul",
    initials: "CL",
    time: "há 4 h",
    context: "Espaço",
    type: "space",
    src: "/community-peruibe.png",
    eyebrow: "ESPAÇO · 1.204 MEMBROS",
    title: "Um lugar para amizade, fé e vida real",
    body: "Abrir Espaço",
    accent: "#2f8474",
  },
];

const albumItems = [
  {
    src: "/community-peruibe.png",
    alt: "Amigos caminhando no litoral",
    caption: "Um sábado simples e muito bom.",
  },
  { src: "/profile-coast-dusk.png", alt: "Costa ao entardecer", caption: "A luz do fim do dia." },
  {
    src: "/pet-bento.png",
    alt: "Bento no cantinho de leitura",
    caption: "Bento também participou.",
  },
];

const openActions = (type: string, title: string, own = false) => {
  window.dispatchEvent(
    new CustomEvent("vdn-open-actions", {
      detail: { type, title, own, source: "media" },
    }),
  );
};

function ImmersiveMediaExperience() {
  const [request, setRequest] = useState<MediaRequest | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [albumIndex, setAlbumIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reply, setReply] = useState("");
  const [zoom, setZoom] = useState(1);
  const [createStep, setCreateStep] = useState(0);
  const [createType, setCreateType] = useState("Foto");
  const [createText, setCreateText] = useState("");
  const [audience, setAudience] = useState("Amigos");
  const [draftSaved, setDraftSaved] = useState(false);
  const [toast, setToast] = useState("");
  const [dragY, setDragY] = useState(0);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchZoomRef = useRef(1);
  const holdTimerRef = useRef<number | null>(null);
  const wasHeldRef = useRef(false);

  const frame = momentFrames[frameIndex % momentFrames.length];
  const state = request?.state ?? "ready";
  const isStory = request?.kind === "moment" || request?.kind === "video";
  const isAlbum =
    request?.kind === "album" ||
    request?.kind === "photo" ||
    request?.kind === "profile" ||
    request?.kind === "chat";

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const close = () => {
    setRequest(null);
    setPaused(false);
    setReply("");
    setZoom(1);
    setDragY(0);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const open = (detail: MediaRequest) => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setRequest(detail);
    setFrameIndex(Math.max(0, detail.index ?? 0) % momentFrames.length);
    setAlbumIndex(Math.max(0, detail.index ?? 0) % albumItems.length);
    setPaused(false);
    setMuted(true);
    setZoom(1);
    setCreateStep(0);
    setDraftSaved(Boolean(window.localStorage.getItem("vdn-moment-draft")));
    window.requestAnimationFrame(() => layerRef.current?.focus());
  };

  useEffect(() => {
    const onOpen = (event: Event) => open((event as CustomEvent<MediaRequest>).detail);
    window.addEventListener("vdn-open-media", onOpen);
    return () => window.removeEventListener("vdn-open-media", onOpen);
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isAlbum) {
          setAlbumIndex((current) => (current + 1) % albumItems.length);
        } else {
          setFrameIndex((current) => (current + 1) % momentFrames.length);
        }
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (isAlbum) {
          setAlbumIndex((current) => (current - 1 + albumItems.length) % albumItems.length);
        } else {
          setFrameIndex((current) => (current - 1 + momentFrames.length) % momentFrames.length);
        }
      }
      if (event.key === " " && isStory) {
        event.preventDefault();
        setPaused((current) => !current);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isAlbum, isStory, request]);

  useEffect(() => {
    if (!request || !isStory || paused || request.kind === "create") return;
    const timer = window.setTimeout(
      () => setFrameIndex((current) => (current + 1) % momentFrames.length),
      frame.type === "video" ? 6400 : 5200,
    );
    return () => window.clearTimeout(timer);
  }, [frame.type, frameIndex, isStory, paused, request]);

  useEffect(() => {
    if (!request) return;
    const previous = document.documentElement.style.getPropertyValue("--vdn-immersive-open");
    document.documentElement.style.setProperty("--vdn-immersive-open", "1");
    return () => {
      if (previous) document.documentElement.style.setProperty("--vdn-immersive-open", previous);
      else document.documentElement.style.removeProperty("--vdn-immersive-open");
    };
  }, [request]);

  const saveDraft = () => {
    window.localStorage.setItem(
      "vdn-moment-draft",
      JSON.stringify({ createType, createText, audience, step: createStep }),
    );
    setDraftSaved(true);
    notify("Rascunho salvo neste dispositivo");
  };

  const publishMoment = () => {
    window.localStorage.removeItem("vdn-moment-draft");
    notify("Momento publicado na demonstração");
    window.setTimeout(close, 720);
  };

  const navigate = (direction: -1 | 1) => {
    if (isAlbum) {
      setAlbumIndex((current) => (current + direction + albumItems.length) % albumItems.length);
      setZoom(1);
      return;
    }
    setFrameIndex((current) => (current + direction + momentFrames.length) % momentFrames.length);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input, textarea, select")) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchDistanceRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      pinchZoomRef.current = zoom;
      return;
    }
    pointerStartRef.current = { x: event.clientX, y: event.clientY, at: Date.now() };
    wasHeldRef.current = false;
    if (isStory) {
      holdTimerRef.current = window.setTimeout(() => {
        wasHeldRef.current = true;
        setPaused(true);
      }, 360);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pointersRef.current.size === 2 && isAlbum) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistanceRef.current) {
        setZoom(
          Math.min(3, Math.max(1, pinchZoomRef.current * (distance / pinchDistanceRef.current))),
        );
      }
      return;
    }
    if (!pointerStartRef.current || zoom > 1) return;
    const nextY = Math.max(0, event.clientY - pointerStartRef.current.y);
    setDragY(Math.min(180, nextY));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    if (wasHeldRef.current) {
      setPaused(false);
      wasHeldRef.current = false;
      pointerStartRef.current = null;
      setDragY(0);
      return;
    }
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || pinchDistanceRef.current) {
      if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    setDragY(0);
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
      close();
      return;
    }
    if (Math.abs(dx) > 72) {
      navigate(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && isStory) {
      const rect = event.currentTarget.getBoundingClientRect();
      navigate(event.clientX < rect.left + rect.width * 0.42 ? -1 : 1);
    }
  };

  const mediaContent = useMemo(() => {
    if (state === "loading")
      return (
        <div className="media-state-card">
          <span className="media-spinner" />
          <strong>Carregando mídia…</strong>
        </div>
      );
    if (state === "offline")
      return (
        <div className="media-state-card">
          <WifiOff />
          <strong>Esta mídia ainda não está disponível offline</strong>
          <button onClick={() => notify("Tentativa agendada para a reconexão")}>
            Tentar ao reconectar
          </button>
        </div>
      );
    if (state === "error")
      return (
        <div className="media-state-card">
          <RotateCcw />
          <strong>Não foi possível abrir esta mídia</strong>
          <button
            onClick={() =>
              setRequest((current) => (current ? { ...current, state: "ready" } : current))
            }
          >
            Tentar novamente
          </button>
        </div>
      );
    if (state === "removed" || state === "private")
      return (
        <div className="media-state-card">
          <Flag />
          <strong>
            {state === "removed" ? "Esta mídia foi removida" : "Esta mídia agora é privada"}
          </strong>
          <button onClick={close}>Voltar</button>
        </div>
      );
    if (isAlbum) {
      const item = albumItems[albumIndex];
      return (
        <div
          className="global-photo-stage"
          onDoubleClick={() => setZoom((current) => (current > 1 ? 1 : 2))}
        >
          <img
            src={item.src}
            alt={item.alt}
            className={state === "low-resolution" ? "is-low-resolution" : ""}
            style={{ transform: `scale(${zoom})` }}
          />
          {state === "low-resolution" && (
            <span className="media-quality-chip">Versão reduzida · carregando original</span>
          )}
        </div>
      );
    }
    if (frame.type === "text" || frame.type === "verse") {
      return (
        <div className={`moment-text-card type-${frame.type}`} style={{ background: frame.accent }}>
          {frame.eyebrow && <span>{frame.eyebrow}</span>}
          <h2>{frame.title}</h2>
          {frame.body && <p>{frame.body}</p>}
        </div>
      );
    }
    return (
      <div className={`moment-visual type-${frame.type}`}>
        <img src={frame.src} alt={frame.title} />
        <span className="moment-visual-shade" />
        {frame.type === "video" && (
          <button
            className="media-center-control"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? "Reproduzir vídeo" : "Pausar vídeo"}
          >
            {paused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}
          </button>
        )}
      </div>
    );
  }, [albumIndex, frame, isAlbum, paused, state, zoom]);

  if (!request) return null;

  if (request.kind === "create") {
    const steps = ["Selecionar", "Editar", "Texto", "Audiência", "Publicar"];
    return (
      <div
        className="vdn-media-layer moment-creator"
        data-immersive-surface="momentos"
        data-state-preserved="true"
        role="dialog"
        aria-modal="true"
        aria-label="Criar Momento"
      >
        <header className="creator-topbar">
          <button onClick={close} aria-label="Fechar criação">
            <X />
          </button>
          <div>
            <strong>Criar Momento</strong>
            <span>{steps[createStep]}</span>
          </div>
          <button onClick={saveDraft}>Salvar</button>
        </header>
        <div className="creator-progress" aria-label={`Etapa ${createStep + 1} de ${steps.length}`}>
          {steps.map((step, index) => (
            <span key={step} className={index <= createStep ? "active" : ""} />
          ))}
        </div>
        <main className="creator-body">
          {createStep === 0 && (
            <section className="creator-choice-grid">
              {[
                ["Foto", Maximize2],
                ["Vídeo curto", Play],
                ["Fundo de texto", Type],
                ["Versículo", Sparkles],
                ["Música", Music2],
                ["Sticker", SmilePlus],
                ["Menção", UserRound],
                ["Link interno", Link2],
              ].map(([label, Icon]) => {
                const ChoiceIcon = Icon as typeof Maximize2;
                return (
                  <button
                    key={String(label)}
                    className={createType === label ? "active" : ""}
                    onClick={() => setCreateType(String(label))}
                  >
                    <ChoiceIcon />
                    <span>{String(label)}</span>
                  </button>
                );
              })}
            </section>
          )}
          {createStep === 1 && (
            <section className="moment-edit-stage">
              <div className="moment-edit-preview">
                <img src="/community-peruibe.png" alt="Prévia da mídia escolhida" />
                <span>{createType}</span>
              </div>
              <div className="editor-toolbar">
                <button onClick={() => notify("Crop simulado aplicado")}>
                  <Crop />
                  Crop
                </button>
                <button onClick={() => notify("Posição ajustada")}>
                  <Maximize2 />
                  Posição
                </button>
                <button onClick={() => notify("Ação desfeita")}>
                  <Undo2 />
                  Desfazer
                </button>
                <button onClick={() => notify("Ação refeita")}>
                  <Redo2 />
                  Refazer
                </button>
              </div>
              <label>
                Duração{" "}
                <input
                  type="range"
                  min="3"
                  max="15"
                  defaultValue="7"
                  aria-label="Duração do Momento"
                />
              </label>
            </section>
          )}
          {createStep === 2 && (
            <section className="moment-text-editor">
              <div className="moment-edit-preview with-copy" style={{ background: "#6554d9" }}>
                <img src="/community-peruibe.png" alt="" />
                <strong>{createText || "Seu texto aparece aqui"}</strong>
              </div>
              <label>
                Texto{" "}
                <textarea
                  value={createText}
                  onChange={(event) => setCreateText(event.target.value)}
                  placeholder="Adicione uma frase, menção ou contexto"
                />
              </label>
              <div className="color-row" aria-label="Escolher cor">
                {["#ffffff", "#f06d7f", "#6554d9", "#2f8474", "#17171a"].map((color) => (
                  <button
                    key={color}
                    style={{ background: color }}
                    aria-label={`Cor ${color}`}
                    onClick={() => notify("Cor aplicada")}
                  />
                ))}
              </div>
              <button
                className="editor-placeholder-action"
                onClick={() => notify("Sticker adicionado à prévia")}
              >
                <SmilePlus /> Adicionar sticker
              </button>
              <button
                className="editor-placeholder-action"
                onClick={() => notify("Música adicionada como placeholder")}
              >
                <Music2 /> Adicionar música
              </button>
            </section>
          )}
          {createStep === 3 && (
            <section className="audience-picker">
              <h2>Quem pode ver?</h2>
              {["Amigos", "Melhores amigos", "Espaços selecionados", "Somente eu"].map((item) => (
                <button
                  key={item}
                  className={audience === item ? "active" : ""}
                  onClick={() => setAudience(item)}
                >
                  <span>
                    <strong>{item}</strong>
                    <small>
                      {item === "Amigos"
                        ? "Todos os seus Amigos"
                        : "Controle a distribuição deste Momento"}
                    </small>
                  </span>
                  {audience === item && <Check />}
                </button>
              ))}
            </section>
          )}
          {createStep === 4 && (
            <section className="moment-final-preview">
              <div>
                <img src="/community-peruibe.png" alt="Prévia final do Momento" />
                <span>{createText || "Pronto para publicar"}</span>
              </div>
              <dl>
                <div>
                  <dt>Formato</dt>
                  <dd>{createType}</dd>
                </div>
                <div>
                  <dt>Audiência</dt>
                  <dd>{audience}</dd>
                </div>
                <div>
                  <dt>Rascunho</dt>
                  <dd>{draftSaved ? "Salvo" : "Ainda não salvo"}</dd>
                </div>
              </dl>
              <button onClick={publishMoment}>
                <Send /> Publicar Momento
              </button>
            </section>
          )}
        </main>
        <footer className="creator-footer">
          <button
            disabled={createStep === 0}
            onClick={() => setCreateStep((current) => Math.max(0, current - 1))}
          >
            Voltar
          </button>
          {createStep < 4 && (
            <button onClick={() => setCreateStep((current) => Math.min(4, current + 1))}>
              Continuar
            </button>
          )}
        </footer>
        <div className={`media-toast ${toast ? "show" : ""}`} role="status">
          {toast}
        </div>
      </div>
    );
  }

  const activeAuthor = isAlbum ? (request.title ?? "Antonio Rodrigues") : frame.author;
  const activeContext = isAlbum
    ? request.kind === "chat"
      ? "Conversa com Ana Clara · Hoje, 14:34"
      : request.kind === "profile"
        ? "Galeria do Perfil · Amigos"
        : `${albumIndex + 1} de ${albumItems.length}`
    : `${frame.context} · ${frame.time}`;

  return (
    <div
      ref={layerRef}
      className={`vdn-media-layer media-kind-${request.kind} ${paused ? "is-paused" : ""}`}
      data-immersive-surface="momentos"
      data-state-preserved="true"
      role="dialog"
      aria-modal="true"
      aria-label={
        request.kind === "moment" ? "Visualizador de Momentos" : "Visualizador imersivo de mídia"
      }
      tabIndex={-1}
      style={{ "--media-drag-y": `${dragY}px` } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="media-drag-surface">
        {isStory && (
          <div
            className="moment-progress"
            aria-label={`${frameIndex + 1} de ${momentFrames.length}`}
          >
            {momentFrames.map((item, index) => (
              <span
                key={`${item.author}-${index}`}
                className={index < frameIndex ? "done" : index === frameIndex ? "active" : ""}
              >
                <i />
              </span>
            ))}
          </div>
        )}
        <header className="media-topbar">
          <button onClick={close} aria-label="Fechar visualizador">
            <X />
          </button>
          <div className="media-author">
            <span className="avatar">{isAlbum ? "AR" : frame.initials}</span>
            <span>
              <strong>{activeAuthor}</strong>
              <small>{activeContext}</small>
            </span>
          </div>
          {frame.type === "video" && (
            <button
              onClick={() => setMuted((current) => !current)}
              aria-label={muted ? "Ativar som" : "Desativar som"}
            >
              {muted ? <VolumeX /> : <Volume2 />}
            </button>
          )}
          <button
            onClick={() =>
              openActions(
                request.kind === "chat"
                  ? "conversation-media"
                  : request.kind === "profile"
                    ? "profile-media"
                    : "moment",
                activeAuthor,
                request.kind === "profile",
              )
            }
            aria-label="Mais ações"
          >
            <MoreHorizontal />
          </button>
        </header>

        <main className="media-main">
          {mediaContent}
          {!isAlbum && state === "ready" && (
            <div className="moment-caption">
              {frame.eyebrow && <span>{frame.eyebrow}</span>}
              <strong>{frame.title}</strong>
              {frame.body && <small>{frame.body}</small>}
            </div>
          )}
          {isAlbum && state === "ready" && (
            <div className="album-caption">
              <strong>{albumItems[albumIndex].caption}</strong>
              <span>
                {request.kind === "chat"
                  ? "Enviada por Ana Clara"
                  : "Legenda desta foto · Galeria de Antonio"}
              </span>
            </div>
          )}
          {isAlbum && (
            <div className="zoom-controls" aria-label="Controles de zoom">
              <button
                onClick={() => setZoom((current) => Math.max(1, current - 0.5))}
                aria-label="Diminuir zoom"
              >
                <ZoomOut />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((current) => Math.min(3, current + 0.5))}
                aria-label="Aumentar zoom"
              >
                <ZoomIn />
              </button>
            </div>
          )}
          <button
            className="media-nav previous"
            onClick={() => navigate(-1)}
            aria-label="Mídia anterior"
          >
            <ChevronLeft />
          </button>
          <button className="media-nav next" onClick={() => navigate(1)} aria-label="Próxima mídia">
            <ChevronRight />
          </button>
        </main>

        {isAlbum && (
          <div className="album-strip" aria-label="Itens do álbum">
            {albumItems.map((item, index) => (
              <button
                key={item.src}
                className={index === albumIndex ? "active" : ""}
                onClick={() => {
                  setAlbumIndex(index);
                  setZoom(1);
                }}
                aria-label={`Abrir item ${index + 1}`}
              >
                <img src={item.src} alt="" />
              </button>
            ))}
          </div>
        )}

        <aside className="media-side-actions">
          <button
            className={liked ? "active" : ""}
            onClick={() => setLiked((current) => !current)}
            aria-pressed={liked}
          >
            <Sparkles />
            <span>{liked ? "Celebrado" : "Reagir"}</span>
          </button>
          <button
            className={saved ? "active" : ""}
            onClick={() => {
              setSaved((current) => !current);
              notify(saved ? "Removido dos salvos" : "Salvo em Geral");
            }}
            aria-pressed={saved}
          >
            <Bookmark />
            <span>Salvar</span>
          </button>
          <button onClick={() => openActions("share", activeAuthor)}>
            <Share2 />
            <span>Compartilhar</span>
          </button>
          {request.kind === "chat" && (
            <button onClick={() => notify("Encaminhamento aberto")}>
              <Send />
              <span>Encaminhar</span>
            </button>
          )}
          {request.kind === "chat" && (
            <button onClick={() => notify("Download simulado")}>
              <Download />
              <span>Baixar</span>
            </button>
          )}
        </aside>

        <footer className="media-reply">
          {request.kind === "chat" ? (
            <button
              className="media-reply-context"
              onClick={() => notify("Respondendo na conversa de origem")}
            >
              <ArrowLeft /> Responder na conversa
            </button>
          ) : (
            <>
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                inputMode="text"
                enterKeyHint="send"
                placeholder={`Responder a ${activeAuthor}`}
                aria-label={`Responder a ${activeAuthor}`}
              />
              <button
                onClick={() => {
                  if (!reply.trim()) return;
                  setReply("");
                  notify("Resposta enviada por mensagem");
                }}
                aria-label="Enviar resposta"
              >
                <Send />
              </button>
            </>
          )}
        </footer>
        <div className="media-gesture-hint">
          Segure para pausar · arraste para baixo para fechar
        </div>
      </div>
      <div className={`media-toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

class MediaBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    window.dispatchEvent(new CustomEvent("vdn-media-local-error"));
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="vdn-media-local-error" role="alert">
        <strong>A mídia não pôde ser aberta</strong>
        <span>O restante do VaiDarNamoro continua funcionando.</span>
        <button onClick={() => this.setState({ failed: false })}>Fechar</button>
      </div>
    );
  }
}

export default function ImmersiveMediaLayer() {
  return (
    <MediaBoundary>
      <ImmersiveMediaExperience />
    </MediaBoundary>
  );
}
