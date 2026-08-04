"use client";

import {
  AlertTriangle,
  Check,
  Cloud,
  Download,
  HardDrive,
  LoaderCircle,
  LogIn,
  RefreshCw,
  Smartphone,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type QueueStatus = "waiting" | "sending" | "sent" | "failed";
type QueueItem = {
  id: number;
  label: string;
  status: QueueStatus;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithPwa = Navigator & {
  standalone?: boolean;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
  };
};

function isStandalone() {
  const deviceNavigator = navigator as NavigatorWithPwa;
  return (
    window.matchMedia("(display-mode: standalone)").matches || deviceNavigator.standalone === true
  );
}

export default function ResilienceLayer({
  onOpenSettings,
  onOpenLogin,
}: {
  onOpenSettings: () => void;
  onOpenLogin: () => void;
}) {
  const [coldStart, setColdStart] = useState(false);
  const [online, setOnline] = useState(true);
  const [slow, setSlow] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installInvite, setInstallInvite] = useState(false);
  const [iosInstallHelp, setIosInstallHelp] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [routeUnavailable, setRouteUnavailable] = useState(false);
  const [lowStorage, setLowStorage] = useState(false);
  const wasOffline = useRef(false);
  const usefulActions = useRef(0);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    const alreadyBooted = window.sessionStorage.getItem("vdn-shell-booted") === "true";
    if (!alreadyBooted) {
      const firstFrame = window.requestAnimationFrame(() => {
        setColdStart(true);
        const secondFrame = window.requestAnimationFrame(() => {
          window.sessionStorage.setItem("vdn-shell-booted", "true");
          setColdStart(false);
        });
        reconnectTimer.current = secondFrame;
      });
      return () => {
        window.cancelAnimationFrame(firstFrame);
        if (reconnectTimer.current) {
          window.cancelAnimationFrame(reconnectTimer.current);
        }
      };
    }
  }, []);

  useEffect(() => {
    const deviceNavigator = navigator as NavigatorWithPwa;
    const connection = deviceNavigator.connection;
    const evaluateConnection = () => {
      const effectiveType = connection?.effectiveType ?? "";
      setSlow(
        connection?.saveData === true || effectiveType === "slow-2g" || effectiveType === "2g",
      );
    };
    const handleOffline = () => {
      wasOffline.current = true;
      setOnline(false);
      setReconnected(false);
    };
    const handleOnline = () => {
      setOnline(true);
      if (!wasOffline.current) return;
      setReconnected(true);
      setQueue((items) =>
        items.map((item) =>
          item.status === "waiting" || item.status === "failed"
            ? { ...item, status: "sending" }
            : item,
        ),
      );
      const resolveQueue = window.setTimeout(() => {
        setQueue((items) =>
          items.map((item) => (item.status === "sending" ? { ...item, status: "sent" } : item)),
        );
        setReconnected(false);
      }, 900);
      reconnectTimer.current = resolveQueue;
      wasOffline.current = false;
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleUsefulAction = () => {
      usefulActions.current += 1;
      const dismissed = window.localStorage.getItem("vdn-install-dismissed") === "true";
      if (usefulActions.current >= 3 && !dismissed && !isStandalone()) {
        setInstallInvite(true);
      }
    };
    const handleInstallRequest = () => {
      if (isStandalone()) return;
      setInstallInvite(true);
    };
    const handleUpdate = () => setUpdateReady(true);
    const handleExpired = () => setSessionExpired(true);
    const handleQueue = (event: Event) => {
      const label = (event as CustomEvent<string>).detail || "Ação pendente";
      setQueue((items) => [
        ...items,
        {
          id: Date.now(),
          label,
          status: navigator.onLine ? "sending" : "waiting",
        },
      ]);
      setQueueOpen(true);
    };
    const params = new URLSearchParams(window.location.search);

    const initialize = window.requestAnimationFrame(() => {
      setOnline(navigator.onLine);
      wasOffline.current = !navigator.onLine;
      setRouteUnavailable(params.get("resilience") === "route");
      setSessionExpired(params.get("resilience") === "session");
      setLowStorage(params.get("resilience") === "storage");
      evaluateConnection();
    });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("vdn-useful-action", handleUsefulAction);
    window.addEventListener("vdn-install-request", handleInstallRequest);
    window.addEventListener("vdn-update-ready", handleUpdate);
    window.addEventListener("vdn-session-expired", handleExpired);
    window.addEventListener("vdn-queue-action", handleQueue);
    connection?.addEventListener?.("change", evaluateConnection as EventListener);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("vdn-useful-action", handleUsefulAction);
      window.removeEventListener("vdn-install-request", handleInstallRequest);
      window.removeEventListener("vdn-update-ready", handleUpdate);
      window.removeEventListener("vdn-session-expired", handleExpired);
      window.removeEventListener("vdn-queue-action", handleQueue);
      connection?.removeEventListener?.("change", evaluateConnection as EventListener);
      window.cancelAnimationFrame(initialize);
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
    };
  }, []);

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallInvite(false);
      if (choice.outcome === "dismissed") {
        window.localStorage.setItem("vdn-install-dismissed", "true");
      }
      return;
    }
    const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isAppleMobile) {
      setIosInstallHelp(true);
      setInstallInvite(false);
      return;
    }
    setInstallInvite(false);
    onOpenSettings();
  };

  const dismissInstall = () => {
    window.localStorage.setItem("vdn-install-dismissed", "true");
    setInstallInvite(false);
  };

  const retryItem = (id: number) => {
    if (!online) {
      setQueue((items) =>
        items.map((item) => (item.id === id ? { ...item, status: "waiting" } : item)),
      );
      return;
    }
    setQueue((items) => items.map((item) => (item.id === id ? { ...item, status: "sent" } : item)));
  };

  return (
    <>
      {coldStart && (
        <div className="resilience-splash" aria-label="Abrindo VaiDarNamoro">
          <img src="/logo-oficial-transparente.png" alt="" />
        </div>
      )}

      {!online && (
        <button className="connectivity-banner offline" onClick={() => setQueueOpen(true)}>
          <WifiOff size={16} />
          <span>
            <strong>Você está offline</strong>
            Algumas ações serão enviadas quando a conexão voltar.
          </span>
          {queue.length > 0 && <b>{queue.length}</b>}
        </button>
      )}

      {slow && online && (
        <div className="connectivity-banner slow" role="status">
          <Cloud size={16} />
          <span>
            <strong>Conexão lenta</strong>
            Texto e ações continuam disponíveis; mídia carrega sob demanda.
          </span>
        </div>
      )}

      {reconnected && (
        <div className="resilience-toast success" role="status">
          <Check size={17} /> Conexão restabelecida. Enviando pendências.
        </div>
      )}

      {queue.length > 0 && !queueOpen && (
        <button
          className="queue-pill"
          onClick={() => setQueueOpen(true)}
          aria-label="Abrir ações pendentes"
        >
          <Cloud size={16} />
          {queue.filter((item) => item.status !== "sent").length || "Tudo enviado"}
        </button>
      )}

      {queueOpen && (
        <div className="resilience-sheet-backdrop" onMouseDown={() => setQueueOpen(false)}>
          <section
            className="resilience-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="queue-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="resilience-sheet-handle" />
            <header>
              <div>
                <h2 id="queue-title">Ações pendentes</h2>
                <p>O aplicativo preserva a ordem e resolve cada item separadamente.</p>
              </div>
              <button aria-label="Fechar" onClick={() => setQueueOpen(false)}>
                <X size={20} />
              </button>
            </header>
            <div className="offline-queue-list">
              {queue.map((item) => (
                <article key={item.id}>
                  <span className={`queue-status ${item.status}`}>
                    {item.status === "sending" ? (
                      <LoaderCircle size={16} />
                    ) : item.status === "sent" ? (
                      <Check size={16} />
                    ) : item.status === "failed" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Cloud size={16} />
                    )}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>
                      {item.status === "waiting"
                        ? "Aguardando conexão"
                        : item.status === "sending"
                          ? "Enviando"
                          : item.status === "sent"
                            ? "Enviado"
                            : "Falhou"}
                    </small>
                  </div>
                  {item.status !== "sent" && (
                    <button onClick={() => retryItem(item.id)}>Tentar novamente</button>
                  )}
                  <button
                    className="queue-discard"
                    aria-label={`Descartar ${item.label}`}
                    onClick={() =>
                      setQueue((items) => items.filter((queued) => queued.id !== item.id))
                    }
                  >
                    <X size={16} />
                  </button>
                </article>
              ))}
              {queue.length === 0 && (
                <div className="queue-empty">
                  <Check size={22} /> Nenhuma ação pendente.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {installInvite && (
        <section className="resilience-card install-card" role="status">
          <Smartphone size={22} />
          <div>
            <strong>Use como aplicativo</strong>
            <span>Instale para abrir em tela cheia e manter seu contexto.</span>
          </div>
          <button onClick={install}>
            <Download size={16} /> Instalar
          </button>
          <button aria-label="Agora não" onClick={dismissInstall}>
            <X size={18} />
          </button>
        </section>
      )}

      {iosInstallHelp && (
        <div className="resilience-sheet-backdrop" onMouseDown={() => setIosInstallHelp(false)}>
          <section
            className="resilience-sheet compact"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="resilience-sheet-handle" />
            <header>
              <div>
                <h2>Instalar no iPhone</h2>
                <p>No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
              </div>
              <button aria-label="Fechar" onClick={() => setIosInstallHelp(false)}>
                <X size={20} />
              </button>
            </header>
          </section>
        </div>
      )}

      {updateReady && (
        <section className="resilience-card update-card" role="status">
          <RefreshCw size={21} />
          <div>
            <strong>Uma atualização está pronta</strong>
            <span>Seu contexto e seus rascunhos locais serão preservados.</span>
          </div>
          <button
            onClick={() => {
              window.sessionStorage.setItem("vdn-update-applied", "true");
              setUpdateReady(false);
            }}
          >
            Atualizar agora
          </button>
          <button aria-label="Adiar atualização" onClick={() => setUpdateReady(false)}>
            <X size={18} />
          </button>
        </section>
      )}

      {lowStorage && (
        <section className="resilience-card storage-card" role="alert">
          <HardDrive size={21} />
          <div>
            <strong>Pouco espaço disponível</strong>
            <span>Revise cache e downloads sem apagar seus dados.</span>
          </div>
          <button onClick={onOpenSettings}>Gerenciar</button>
          <button aria-label="Fechar aviso" onClick={() => setLowStorage(false)}>
            <X size={18} />
          </button>
        </section>
      )}

      {sessionExpired && (
        <div className="resilience-sheet-backdrop">
          <section className="resilience-modal" role="alertdialog" aria-modal="true">
            <LogIn size={25} />
            <h2>Sua sessão expirou</h2>
            <p>Entre novamente para continuar. Seu contexto local foi preservado.</p>
            <button
              onClick={() => {
                setSessionExpired(false);
                onOpenLogin();
              }}
            >
              Entrar novamente
            </button>
          </section>
        </div>
      )}

      {routeUnavailable && (
        <section className="route-unavailable" role="alert">
          <AlertTriangle size={28} />
          <h2>Esta página não está disponível</h2>
          <p>A navegação principal continua funcionando.</p>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("resilience");
              window.history.replaceState({}, "", url);
              setRouteUnavailable(false);
            }}
          >
            Voltar para o início
          </button>
        </section>
      )}
    </>
  );
}
