"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  HelpCircle,
  History,
  Image as ImageIcon,
  Info,
  KeyRound,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  UserRoundCheck,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import { Component, type ReactNode, useEffect, useState } from "react";
import "../styles/TrustCenterExperience.css";

type TrustTab = "Status" | "Verificar perfil" | "Verificar foto" | "Histórico" | "Ajuda";
type AccountState =
  | "not-started"
  | "incomplete"
  | "ready"
  | "sending"
  | "review"
  | "approved"
  | "action"
  | "declined"
  | "expired"
  | "appealed"
  | "offline"
  | "error";

const tabs: { id: TrustTab; icon: typeof ShieldCheck; label: string }[] = [
  { id: "Status", icon: ShieldCheck, label: "Status" },
  { id: "Verificar perfil", icon: UserRoundCheck, label: "Verificar perfil" },
  { id: "Verificar foto", icon: Camera, label: "Verificar foto" },
  { id: "Histórico", icon: History, label: "Histórico" },
  { id: "Ajuda", icon: HelpCircle, label: "Ajuda" },
];

const profileChecks = [
  { id: "name", title: "Nome", copy: "Antonio Rodrigues", state: "complete" },
  { id: "age", title: "Idade 18+", copy: "Elegível para usar a comunidade", state: "complete" },
  { id: "photo", title: "Foto", copy: "Precisa de uma imagem mais nítida", state: "fix" },
  { id: "region", title: "Região", copy: "Peruíbe, São Paulo", state: "complete" },
  {
    id: "essential",
    title: "Dados essenciais",
    copy: "Informações básicas preenchidas",
    state: "complete",
  },
  { id: "terms", title: "Termos", copy: "Aceitos em 26 jul. 2026", state: "complete" },
  {
    id: "consistency",
    title: "Inconsistências",
    copy: "Uma correção disponível",
    state: "pending",
  },
];

const historyItems = [
  {
    type: "Verificação de perfil",
    date: "28 jul. 2026",
    state: "Ação necessária",
    result: "Atualizar foto principal",
    action: "Corrigir",
  },
  {
    type: "Verificação de foto",
    date: "27 jul. 2026",
    state: "Em análise",
    result: "Envio demonstrativo recebido",
    action: "Acompanhar",
  },
  {
    type: "Dados essenciais",
    date: "26 jul. 2026",
    state: "Aprovado",
    result: "Informações conferidas",
    action: "Ver detalhes",
  },
  {
    type: "Recurso",
    date: "19 jul. 2026",
    state: "Concluído",
    result: "Revisão manual encerrada",
    action: "Ver resultado",
  },
];

class TrustBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.failed) {
      return (
        <section className="trust-local-error" role="alert">
          <CircleAlert />
          <h1>A Central não pôde ser aberta</h1>
          <p>Sua conta e as outras áreas continuam funcionando.</p>
          <button onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
          <button className="ghost" onClick={this.props.onClose}>
            Voltar
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

function TrustContent({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<TrustTab>("Status");
  const [accountState, setAccountState] = useState<AccountState>("action");
  const [photoStep, setPhotoStep] = useState(1);
  const [profileFixes, setProfileFixes] = useState<string[]>([]);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealStep, setAppealStep] = useState(1);
  const [appealText, setAppealText] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<(typeof historyItems)[number] | null>(
    null,
  );
  const [helpTopic, setHelpTopic] = useState("");
  const [cameraFacing, setCameraFacing] = useState<"frontal" | "traseira">("frontal");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const restore = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("trustState") as AccountState | null;
      if (
        requested &&
        [
          "not-started",
          "incomplete",
          "ready",
          "sending",
          "review",
          "approved",
          "action",
          "declined",
          "expired",
          "appealed",
          "offline",
          "error",
        ].includes(requested)
      )
        setAccountState(requested);
      const saved = window.sessionStorage.getItem("vdn-trust-state");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            tab?: TrustTab;
            photoStep?: number;
            fixes?: string[];
          };
          if (parsed.tab && tabs.some((item) => item.id === parsed.tab)) setTab(parsed.tab);
          if (parsed.photoStep) setPhotoStep(parsed.photoStep);
          if (parsed.fixes) setProfileFixes(parsed.fixes);
        } catch {}
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem(
      "vdn-trust-state",
      JSON.stringify({ tab, photoStep, fixes: profileFixes }),
    );
  }, [photoStep, profileFixes, tab, visible]);

  const statusInfo = {
    "not-started": {
      label: "Não iniciado",
      title: "Verifique quando fizer sentido",
      copy: "A comunidade continua disponível. A foto não é obrigatória nesta casca visual.",
      tone: "neutral",
      icon: ShieldQuestion,
    },
    incomplete: {
      label: "Incompleto",
      title: "Faltam alguns dados",
      copy: "Revise o checklist e conclua somente o que estiver pendente.",
      tone: "warning",
      icon: Clock3,
    },
    ready: {
      label: "Pronto para enviar",
      title: "Tudo preparado",
      copy: "Confira os dados antes do envio demonstrativo.",
      tone: "info",
      icon: Check,
    },
    sending: {
      label: "Enviando",
      title: "Preparando seu envio",
      copy: "Não feche esta etapa enquanto o estado local é atualizado.",
      tone: "info",
      icon: Upload,
    },
    review: {
      label: "Em análise",
      title: "Recebemos seu envio",
      copy: "Mostraremos qualquer atualização aqui. Não há prazo inventado.",
      tone: "info",
      icon: Clock3,
    },
    approved: {
      label: "Verificado",
      title: "Perfil aprovado",
      copy: "Foto verificada e conta em situação normal.",
      tone: "success",
      icon: BadgeCheck,
    },
    action: {
      label: "Ação necessária",
      title: "Precisamos de uma correção",
      copy: "Atualize a foto principal para que seu perfil possa ser revisado novamente.",
      tone: "warning",
      icon: CircleAlert,
    },
    declined: {
      label: "Recusado",
      title: "A verificação não foi aprovada",
      copy: "Você pode corrigir, fazer nova tentativa, pedir revisão manual ou falar com o suporte.",
      tone: "danger",
      icon: Ban,
    },
    expired: {
      label: "Expirado",
      title: "É preciso verificar novamente",
      copy: "O resultado anterior expirou. Seus dados públicos continuam como estavam.",
      tone: "neutral",
      icon: RefreshCw,
    },
    appealed: {
      label: "Recurso enviado",
      title: "Revisão solicitada",
      copy: "O acompanhamento aparece no histórico, sem prazo artificial.",
      tone: "info",
      icon: FileText,
    },
    offline: {
      label: "Offline",
      title: "Sem conexão",
      copy: "Seu progresso ficou salvo neste aparelho. Envie quando voltar.",
      tone: "neutral",
      icon: WifiOff,
    },
    error: {
      label: "Erro local",
      title: "Esta etapa não carregou",
      copy: "Tente novamente sem sair da Central.",
      tone: "danger",
      icon: CircleAlert,
    },
  } satisfies Record<
    AccountState,
    { label: string; title: string; copy: string; tone: string; icon: typeof ShieldCheck }
  >;

  const currentStatus = statusInfo[accountState];
  const StatusIcon = currentStatus.icon;
  const completedCount = profileChecks.filter(
    (item) => item.state === "complete" || profileFixes.includes(item.id),
  ).length;
  const captureSteps = ["Entender", "Preparar", "Capturar", "Revisar", "Enviar", "Análise"];

  const selectTab = (next: TrustTab) => {
    setTab(next);
    setPrivacyOpen(false);
  };

  const fixProfileItem = (id: string) => {
    setProfileFixes((current) => (current.includes(id) ? current : [...current, id]));
    showToast("Correção salva somente nesta demonstração");
  };

  const submitPhoto = () => {
    setPhotoStep(6);
    setAccountState("review");
    showToast("Foto demonstrativa enviada para análise");
  };

  const submitAppeal = () => {
    setAppealStep(5);
    setAccountState("appealed");
    showToast("Recurso demonstrativo enviado");
  };

  if (!visible) return null;

  return (
    <section
      className="trust-experience"
      data-trust-state={accountState}
      aria-label="Verificação e Central de Confiança"
    >
      <header className="trust-topbar">
        <button aria-label="Voltar" onClick={onClose}>
          <ArrowLeft />
        </button>
        <div>
          <span>CONTA E SEGURANÇA</span>
          <strong>Central de confiança</strong>
        </div>
        <button aria-label="Abrir ajuda" onClick={() => selectTab("Ajuda")}>
          <HelpCircle />
        </button>
      </header>

      <nav className="trust-mobile-tabs" aria-label="Áreas da Central de confiança">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            className={tab === id && !privacyOpen ? "active" : ""}
            aria-current={tab === id && !privacyOpen ? "page" : undefined}
            onClick={() => selectTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="trust-layout">
        <aside className="trust-navigation" aria-label="Etapas e status">
          <header>
            <span>ETAPAS E STATUS</span>
            <h1>Sua conta, com clareza</h1>
            <p>Verificação não é um score e não promete segurança absoluta.</p>
          </header>
          <nav>
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => selectTab(id)}
              >
                <Icon />
                <span>{label}</span>
                {id === "Status" && (
                  <em className={`tone-${currentStatus.tone}`}>{currentStatus.label}</em>
                )}
                <ChevronRight />
              </button>
            ))}
          </nav>
          <button className="trust-privacy-link" onClick={() => setPrivacyOpen(true)}>
            <LockKeyhole />
            <span>
              <strong>Privacidade</strong>
              <small>Como seus dados são usados</small>
            </span>
            <ChevronRight />
          </button>
        </aside>

        <main className="trust-content">
          {privacyOpen ? (
            <PrivacyView onBack={() => setPrivacyOpen(false)} showToast={showToast} />
          ) : tab === "Status" ? (
            <div className="trust-status-view">
              <header>
                <span>STATUS</span>
                <h1>Visão geral da verificação</h1>
                <p>Somente resultados claros, sem pontuação de confiança.</p>
              </header>
              <section className={`trust-status-hero tone-${currentStatus.tone}`}>
                <span>
                  <StatusIcon />
                </span>
                <div>
                  <small>{currentStatus.label}</small>
                  <h2>{currentStatus.title}</h2>
                  <p>{currentStatus.copy}</p>
                </div>
                {accountState === "action" && (
                  <button onClick={() => selectTab("Verificar perfil")}>Corrigir agora</button>
                )}
                {accountState === "declined" && (
                  <button onClick={() => setAppealOpen(true)}>Pedir revisão</button>
                )}
                {accountState === "error" && (
                  <button onClick={() => setAccountState("action")}>Tentar novamente</button>
                )}
              </section>

              <section className="trust-summary-grid">
                <button onClick={() => selectTab("Verificar perfil")}>
                  <UserRoundCheck />
                  <span>
                    <small>PERFIL</small>
                    <strong>{accountState === "approved" ? "Aprovado" : "Ação necessária"}</strong>
                    <em>
                      {completedCount} de {profileChecks.length} itens prontos
                    </em>
                  </span>
                  <ChevronRight />
                </button>
                <button onClick={() => selectTab("Verificar foto")}>
                  <Camera />
                  <span>
                    <small>FOTO</small>
                    <strong>{photoStep === 6 ? "Em análise" : "Não concluída"}</strong>
                    <em>Opcional nesta casca visual</em>
                  </span>
                  <ChevronRight />
                </button>
                <button onClick={() => showToast("Segurança da conta aberta")}>
                  <KeyRound />
                  <span>
                    <small>SEGURANÇA</small>
                    <strong>Conta em situação normal</strong>
                    <em>Sessões e acesso</em>
                  </span>
                  <ChevronRight />
                </button>
              </section>

              {accountState === "action" && (
                <section className="trust-action-card">
                  <CircleAlert />
                  <div>
                    <span>AÇÃO NECESSÁRIA</span>
                    <h2>Use uma foto principal mais nítida</h2>
                    <p>
                      Seu rosto precisa aparecer com boa iluminação e sem filtro. Não mostramos
                      regras internas de moderação.
                    </p>
                  </div>
                  <div className="trust-example">
                    <span className="bad">
                      <X /> Pouca luz
                    </span>
                    <span className="good">
                      <Check /> Rosto visível
                    </span>
                  </div>
                  <button onClick={() => selectTab("Verificar perfil")}>Atualizar foto</button>
                  <button className="ghost" onClick={() => selectTab("Ajuda")}>
                    Preciso de ajuda
                  </button>
                </section>
              )}

              {accountState === "declined" && (
                <section className="trust-declined-options">
                  <div>
                    <span>PRÓXIMOS CAMINHOS</span>
                    <h2>Escolha como continuar</h2>
                    <p>A decisão não bloqueia toda a comunidade.</p>
                  </div>
                  <button onClick={() => selectTab("Verificar perfil")}>
                    <RefreshCw />
                    <span>
                      <strong>Corrigir e reenviar</strong>
                      <small>Quando a correção estiver disponível</small>
                    </span>
                    <ChevronRight />
                  </button>
                  <button
                    onClick={() => {
                      selectTab("Verificar foto");
                      setPhotoStep(2);
                    }}
                  >
                    <Camera />
                    <span>
                      <strong>Nova tentativa</strong>
                      <small>Revise as orientações antes de capturar</small>
                    </span>
                    <ChevronRight />
                  </button>
                  <button onClick={() => setAppealOpen(true)}>
                    <FileText />
                    <span>
                      <strong>Revisão manual</strong>
                      <small>Explique sua situação para a equipe</small>
                    </span>
                    <ChevronRight />
                  </button>
                  <button onClick={() => selectTab("Ajuda")}>
                    <MessageCircle />
                    <span>
                      <strong>Suporte</strong>
                      <small>Peça orientação sobre seu caso</small>
                    </span>
                    <ChevronRight />
                  </button>
                </section>
              )}

              <section className="trust-badge-section">
                <div>
                  <span>BADGES</span>
                  <h2>O que as pessoas podem ver</h2>
                </div>
                <article>
                  <span className="verified-badge">
                    <BadgeCheck /> Perfil verificado
                  </span>
                  <p>
                    Indica que etapas básicas foram aprovadas. Não significa que toda interação será
                    segura.
                  </p>
                  <small>Aparece no Perfil, Pessoas e Modo Namoro quando aplicável.</small>
                </article>
                <article>
                  <span className="photo-badge">
                    <Camera /> Foto verificada
                  </span>
                  <p>
                    Indica o resultado da verificação de foto, não expõe a imagem usada no processo.
                  </p>
                  <small>A foto enviada e os detalhes da análise não são públicos.</small>
                </article>
              </section>

              <section className="trust-center-list">
                <div>
                  <span>CENTRAL DE CONFIANÇA</span>
                  <h2>Controle sem painel técnico</h2>
                </div>
                {[
                  [ShieldCheck, "Verificação", "Status, correções e histórico"],
                  [KeyRound, "Segurança da conta", "Acesso, senha e sessões"],
                  [Smartphone, "Sessões", "Dispositivos reconhecidos"],
                  [Ban, "Bloqueios", "Pessoas que você bloqueou"],
                  [CircleAlert, "Denúncias", "Acompanhamento disponível"],
                  [FileText, "Recursos", "Pedidos de revisão manual"],
                  [LockKeyhole, "Privacidade", "Uso e visibilidade de dados"],
                ].map(([Icon, title, copy]) => {
                  const ItemIcon = Icon as typeof ShieldCheck;
                  return (
                    <button
                      key={String(title)}
                      onClick={() =>
                        title === "Privacidade"
                          ? setPrivacyOpen(true)
                          : title === "Recursos"
                            ? setAppealOpen(true)
                            : showToast(`${String(title)} aberto`)
                      }
                    >
                      <ItemIcon />
                      <span>
                        <strong>{String(title)}</strong>
                        <small>{String(copy)}</small>
                      </span>
                      <ChevronRight />
                    </button>
                  );
                })}
              </section>
            </div>
          ) : tab === "Verificar perfil" ? (
            <div className="trust-profile-view">
              <header>
                <span>VERIFICAR PERFIL</span>
                <h1>Revise seus dados essenciais</h1>
                <p>Itens cinza continuam visíveis e indicam exatamente o que falta.</p>
              </header>
              <section className="trust-profile-progress">
                <span>
                  <strong>
                    {completedCount} de {profileChecks.length}
                  </strong>
                  <small>itens prontos</small>
                </span>
                <div>
                  <i style={{ width: `${(completedCount / profileChecks.length) * 100}%` }} />
                </div>
              </section>
              <div className="trust-checklist">
                {profileChecks.map((item) => {
                  const fixed = profileFixes.includes(item.id);
                  const complete = item.state === "complete" || fixed;
                  const needsFix = item.state === "fix" && !fixed;
                  return (
                    <article
                      key={item.id}
                      className={complete ? "complete" : needsFix ? "fix" : "pending"}
                    >
                      <span>{complete ? <Check /> : needsFix ? <CircleAlert /> : <Clock3 />}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{fixed ? "Correção salva para nova revisão" : item.copy}</small>
                      </div>
                      {needsFix ? (
                        <button onClick={() => fixProfileItem(item.id)}>Corrigir</button>
                      ) : !complete ? (
                        <button onClick={() => fixProfileItem(item.id)}>Revisar</button>
                      ) : (
                        <em>Aprovado</em>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="trust-profile-actions">
                <button
                  disabled={completedCount < profileChecks.length}
                  onClick={() => {
                    setAccountState("ready");
                    showToast("Perfil pronto para envio demonstrativo");
                  }}
                >
                  Continuar
                </button>
                <button className="ghost" onClick={() => selectTab("Status")}>
                  Salvar e sair
                </button>
              </div>
            </div>
          ) : tab === "Verificar foto" ? (
            <div className="trust-photo-view">
              <header>
                <span>VERIFICAR FOTO</span>
                <h1>Confirme sua foto com tranquilidade</h1>
                <p>Nenhuma câmera, biometria ou análise facial real é usada neste protótipo.</p>
              </header>
              <nav className="trust-stepper" aria-label={`Etapa ${photoStep} de 6`}>
                {captureSteps.map((step, index) => (
                  <span
                    key={step}
                    className={
                      photoStep === index + 1 ? "active" : photoStep > index + 1 ? "done" : ""
                    }
                  >
                    <i>{photoStep > index + 1 ? <Check /> : index + 1}</i>
                    <small>{step}</small>
                  </span>
                ))}
              </nav>

              {photoStep === 1 && (
                <section className="trust-photo-card intro">
                  <span>
                    <ShieldCheck />
                  </span>
                  <h2>Por que pedimos esta etapa?</h2>
                  <p>
                    Ela demonstra como o resultado de uma foto poderia ajudar a dar mais contexto ao
                    perfil. O envio é opcional nesta casca visual.
                  </p>
                  <ul>
                    <li>
                      <Check /> O resultado pode aparecer como badge.
                    </li>
                    <li>
                      <LockKeyhole /> A imagem usada no processo não é pública.
                    </li>
                    <li>
                      <HelpCircle /> Você pode procurar o suporte como alternativa.
                    </li>
                  </ul>
                  <button onClick={() => setPhotoStep(2)}>Entendi, continuar</button>
                  <button className="ghost" onClick={() => selectTab("Ajuda")}>
                    Falar com suporte
                  </button>
                </section>
              )}

              {photoStep === 2 && (
                <section className="trust-photo-card">
                  <h2>Prepare uma foto clara</h2>
                  <div className="trust-guidance-grid">
                    {[
                      [UserRoundCheck, "Rosto centralizado"],
                      [Sparkles, "Boa iluminação"],
                      [ImageIcon, "Sem filtro"],
                      [UsersRound, "Sem outra pessoa"],
                      [CircleAlert, "Sem óculos escuros"],
                      [BadgeCheck, "Imagem nítida"],
                    ].map(([Icon, label]) => {
                      const GuideIcon = Icon as typeof Check;
                      return (
                        <span key={String(label)}>
                          <GuideIcon /> {String(label)}
                        </span>
                      );
                    })}
                  </div>
                  <p>
                    Use uma posição confortável. Você poderá revisar e refazer antes do envio
                    demonstrativo.
                  </p>
                  <button onClick={() => setPhotoStep(3)}>Abrir captura simulada</button>
                  <button className="ghost" onClick={() => setPhotoStep(1)}>
                    Voltar
                  </button>
                </section>
              )}

              {photoStep === 3 && (
                <section
                  className={`trust-camera-simulation ${flash ? "flash" : ""}`}
                  aria-label="Captura de foto simulada"
                >
                  <header>
                    <span>CAPTURA SIMULADA</span>
                    <strong>Câmera {cameraFacing}</strong>
                  </header>
                  <div className="trust-camera-frame">
                    <span className="face-outline">
                      <UserRoundCheck />
                    </span>
                    <p>Centralize seu rosto dentro da moldura</p>
                  </div>
                  <footer>
                    <button
                      aria-label="Trocar câmera simulada"
                      onClick={() =>
                        setCameraFacing((current) =>
                          current === "frontal" ? "traseira" : "frontal",
                        )
                      }
                    >
                      <RotateCcw />
                    </button>
                    <button
                      className="capture"
                      aria-label="Capturar foto simulada"
                      onClick={() => {
                        setFlash(true);
                        window.setTimeout(() => {
                          setFlash(false);
                          setPhotoStep(4);
                        }, 180);
                      }}
                    >
                      <Camera />
                    </button>
                    <button
                      aria-label="Flash visual"
                      className={flash ? "active" : ""}
                      onClick={() => setFlash((current) => !current)}
                    >
                      <Sparkles />
                    </button>
                  </footer>
                  <small>Esta tela não acessa a câmera do aparelho.</small>
                </section>
              )}

              {photoStep === 4 && (
                <section className="trust-photo-card review">
                  <div className="trust-photo-preview">
                    <UserRoundCheck />
                    <span>PRÉVIA SIMULADA</span>
                  </div>
                  <h2>Revise antes de enviar</h2>
                  <p>Seu rosto está centralizado, com boa luz e sem outras pessoas?</p>
                  <div>
                    <button className="ghost" onClick={() => setPhotoStep(3)}>
                      <RotateCcw /> Refazer
                    </button>
                    <button onClick={() => setPhotoStep(5)}>Usar esta foto</button>
                  </div>
                </section>
              )}

              {photoStep === 5 && (
                <section className="trust-photo-card send">
                  <span>
                    <Upload />
                  </span>
                  <h2>Pronto para enviar</h2>
                  <p>
                    A demonstração mudará o status para “Em análise”. Nenhuma imagem real será
                    armazenada.
                  </p>
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Entendi como o resultado poderá ser usado e quem poderá vê-lo.</span>
                  </label>
                  <button onClick={submitPhoto}>Enviar para análise</button>
                  <button className="ghost" onClick={() => setPhotoStep(4)}>
                    Revisar novamente
                  </button>
                </section>
              )}

              {photoStep === 6 && (
                <section className="trust-review-state">
                  <span>
                    <Clock3 />
                  </span>
                  <small>EM ANÁLISE</small>
                  <h2>Seu item foi enviado</h2>
                  <p>
                    O resultado e qualquer ação necessária aparecerão aqui. Não estimamos um prazo
                    neste protótipo.
                  </p>
                  <dl>
                    <div>
                      <dt>Item</dt>
                      <dd>Verificação de foto</dd>
                    </div>
                    <div>
                      <dt>Enviado em</dt>
                      <dd>28 jul. 2026 · agora</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>Em análise</dd>
                    </div>
                  </dl>
                  <button onClick={() => selectTab("Histórico")}>Acompanhar no histórico</button>
                  <button className="ghost" onClick={() => selectTab("Ajuda")}>
                    Preciso de ajuda
                  </button>
                  <button className="text" onClick={onClose}>
                    Sair da Central
                  </button>
                </section>
              )}
            </div>
          ) : tab === "Histórico" ? (
            <div className="trust-history-view">
              <header>
                <span>HISTÓRICO</span>
                <h1>Acompanhe cada etapa</h1>
                <p>Sem notas internas ou regras confidenciais de moderação.</p>
              </header>
              <div className="trust-history-list">
                {historyItems.map((item) => (
                  <button
                    key={`${item.type}-${item.date}`}
                    onClick={() => setSelectedHistory(item)}
                  >
                    <span
                      className={`history-state state-${item.state.toLowerCase().replaceAll(" ", "-")}`}
                    >
                      {item.state === "Aprovado" || item.state === "Concluído" ? (
                        <Check />
                      ) : item.state === "Em análise" ? (
                        <Clock3 />
                      ) : (
                        <CircleAlert />
                      )}
                    </span>
                    <span>
                      <small>{item.date}</small>
                      <strong>{item.type}</strong>
                      <em>{item.result}</em>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
              {selectedHistory && (
                <section className="trust-history-detail">
                  <header>
                    <div>
                      <span>DETALHE</span>
                      <h2>{selectedHistory.type}</h2>
                    </div>
                    <button aria-label="Fechar detalhe" onClick={() => setSelectedHistory(null)}>
                      <X />
                    </button>
                  </header>
                  <dl>
                    <div>
                      <dt>Data</dt>
                      <dd>{selectedHistory.date}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>{selectedHistory.state}</dd>
                    </div>
                    <div>
                      <dt>Resultado</dt>
                      <dd>{selectedHistory.result}</dd>
                    </div>
                  </dl>
                  <button
                    onClick={() =>
                      selectedHistory.action === "Corrigir"
                        ? selectTab("Verificar perfil")
                        : showToast(`${selectedHistory.action} aberto`)
                    }
                  >
                    {selectedHistory.action}
                  </button>
                  <button className="ghost" onClick={() => setAppealOpen(true)}>
                    Pedir revisão
                  </button>
                  <button className="ghost" onClick={() => selectTab("Ajuda")}>
                    Suporte
                  </button>
                </section>
              )}
            </div>
          ) : (
            <div className="trust-help-view">
              <header>
                <span>AJUDA</span>
                <h1>Como podemos orientar?</h1>
                <p>Respostas sobre verificação, privacidade, correções e recursos.</p>
              </header>
              <label className="trust-help-search">
                <HelpCircle />
                <input
                  type="search"
                  inputMode="search"
                  value={helpTopic}
                  onChange={(event) => setHelpTopic(event.target.value)}
                  placeholder="Buscar ajuda"
                  aria-label="Buscar ajuda"
                />
                {helpTopic && (
                  <button aria-label="Limpar busca" onClick={() => setHelpTopic("")}>
                    <X />
                  </button>
                )}
              </label>
              <div className="trust-help-topics">
                {[
                  [
                    "Por que verificar o perfil?",
                    "A verificação ajuda a dar contexto, sem criar score ou garantia absoluta.",
                  ],
                  [
                    "Quem vê minha foto de verificação?",
                    "A imagem do processo não é pública; somente o resultado pode aparecer como badge.",
                  ],
                  [
                    "Posso tentar novamente?",
                    "Quando a correção for permitida, a ação aparecerá com instruções claras.",
                  ],
                  [
                    "Como pedir revisão manual?",
                    "Abra um item recusado ou o Histórico e selecione Pedir revisão.",
                  ],
                  [
                    "A verificação é obrigatória?",
                    "A foto não bloqueia toda a comunidade nesta casca visual.",
                  ],
                  [
                    "Como excluir informações?",
                    "A disponibilidade depende do dado e do estado da conta; o suporte orienta o caminho aplicável.",
                  ],
                ]
                  .filter(([title, copy]) =>
                    `${title} ${copy}`.toLowerCase().includes(helpTopic.toLowerCase()),
                  )
                  .map(([title, copy]) => (
                    <details key={title}>
                      <summary>
                        {title}
                        <ChevronRight />
                      </summary>
                      <p>{copy}</p>
                    </details>
                  ))}
              </div>
              <section className="trust-support-card">
                <MessageCircle />
                <div>
                  <span>SUPORTE</span>
                  <h2>Precisa falar com uma pessoa?</h2>
                  <p>Abra um atendimento demonstrativo com o contexto da verificação.</p>
                </div>
                <button onClick={() => showToast("Suporte aberto com contexto preservado")}>
                  Abrir suporte
                </button>
              </section>
              <section className="trust-separation-note">
                <ShieldCheck />
                <p>
                  Ferramentas administrativas ficam em uma área separada. Esta Central mostra apenas
                  informações e ações da sua própria conta.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>

      {appealOpen && (
        <div className="trust-overlay" onMouseDown={() => setAppealOpen(false)}>
          <section
            className="trust-appeal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trust-appeal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>RECURSO · ETAPA {appealStep} DE 5</span>
                <h2 id="trust-appeal-title">Pedir revisão manual</h2>
              </div>
              <button aria-label="Fechar recurso" onClick={() => setAppealOpen(false)}>
                <X />
              </button>
            </header>
            <div className="trust-appeal-progress">
              <i style={{ width: `${appealStep * 20}%` }} />
            </div>
            {appealStep === 1 && (
              <div>
                <Info />
                <h3>Entenda a decisão</h3>
                <p>
                  A verificação não foi aprovada porque a imagem enviada não estava nítida. Você
                  pode corrigir, tentar novamente ou explicar sua situação.
                </p>
                <button onClick={() => setAppealStep(2)}>Continuar</button>
              </div>
            )}
            {appealStep === 2 && (
              <div>
                <FileText />
                <h3>Explique a situação</h3>
                <label>
                  Mensagem
                  <textarea
                    value={appealText}
                    onChange={(event) => setAppealText(event.target.value)}
                    placeholder="Conte o que devemos considerar"
                    rows={5}
                  />
                </label>
                <button disabled={appealText.trim().length < 8} onClick={() => setAppealStep(3)}>
                  Continuar
                </button>
              </div>
            )}
            {appealStep === 3 && (
              <div>
                <Upload />
                <h3>Anexar informação</h3>
                <p>O anexo é apenas visual e não envia nenhum arquivo real.</p>
                <button
                  className="trust-attachment"
                  onClick={() => {
                    showToast("Anexo demonstrativo adicionado");
                    setAppealStep(4);
                  }}
                >
                  <ImageIcon /> Adicionar anexo simulado
                </button>
                <button className="ghost" onClick={() => setAppealStep(4)}>
                  Continuar sem anexo
                </button>
              </div>
            )}
            {appealStep === 4 && (
              <div>
                <ShieldCheck />
                <h3>Revise seu pedido</h3>
                <blockquote>{appealText}</blockquote>
                <p>O pedido será exibido como enviado para revisão manual.</p>
                <button onClick={submitAppeal}>
                  <Send /> Enviar recurso
                </button>
                <button className="ghost" onClick={() => setAppealStep(2)}>
                  Editar
                </button>
              </div>
            )}
            {appealStep === 5 && (
              <div className="appeal-sent">
                <Check />
                <h3>Recurso enviado</h3>
                <p>Acompanhe pelo Histórico. Não há prazo artificial nesta demonstração.</p>
                <button
                  onClick={() => {
                    setAppealOpen(false);
                    selectTab("Histórico");
                  }}
                >
                  Acompanhar
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function PrivacyView({
  onBack,
  showToast,
}: {
  onBack: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <div className="trust-privacy-view">
      <header>
        <button aria-label="Voltar para a Central" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <span>PRIVACIDADE</span>
          <h1>Como a verificação é apresentada</h1>
          <p>Explicações gerais, sem afirmação jurídica definitiva.</p>
        </div>
      </header>
      <section className="trust-privacy-hero">
        <LockKeyhole />
        <div>
          <h2>Seus dados não viram conteúdo público</h2>
          <p>
            O perfil pode mostrar o resultado em forma de badge. A foto de verificação, detalhes
            internos e informações de recurso não aparecem para outras pessoas.
          </p>
        </div>
      </section>
      <div className="trust-privacy-list">
        {[
          [
            "O que é usado",
            "Dados essenciais do perfil e a foto enviada nesta etapa demonstrativa.",
          ],
          [
            "Por que é usado",
            "Para revisar a consistência do perfil e apresentar um resultado compreensível.",
          ],
          ["Quem vê o resultado", "Pessoas podem ver badges aprovados nos locais indicados."],
          [
            "O que não é público",
            "Foto do processo, motivos internos, histórico detalhado e texto de recurso.",
          ],
          ["Ajuda e suporte", "Você pode pedir esclarecimentos e revisão manual quando aplicável."],
          [
            "Exclusão",
            "O caminho depende do tipo de dado e do estado da análise; o suporte orienta cada caso.",
          ],
        ].map(([title, copy]) => (
          <article key={title}>
            <Check />
            <div>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
      <button
        className="trust-danger-link"
        onClick={() => showToast("Orientações de exclusão abertas")}
      >
        <Trash2 />
        <span>
          <strong>Solicitar orientação sobre exclusão</strong>
          <small>Veja o que se aplica ao seu caso</small>
        </span>
        <ChevronRight />
      </button>
      <button className="trust-primary" onClick={onBack}>
        Entendi
      </button>
    </div>
  );
}

export default function TrustCenterExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <TrustBoundary onClose={props.onClose}>
      <TrustContent {...props} />
    </TrustBoundary>
  );
}
