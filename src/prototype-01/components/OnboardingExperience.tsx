"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  Home,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  WifiOff,
  X,
} from "lucide-react";
import { Component, type ReactNode, useEffect, useMemo, useState } from "react";
import "../styles/OnboardingExperience.css";

type EntryView =
  | "access"
  | "login"
  | "signup"
  | "recovery"
  | "recovery-sent"
  | "new-password"
  | "review"
  | "offline"
  | "session";
type FirstStep = "welcome" | "identity" | "interests" | "region" | "privacy" | "ready";
type SessionState =
  | "Inicializando"
  | "Autenticado"
  | "Não autenticado"
  | "Sessão recuperável"
  | "Erro recuperável"
  | "Conta em análise"
  | "Conta restrita"
  | "Conta desativada";

const interests = [
  "Bíblia e estudos",
  "Amizades",
  "Cinema",
  "Música",
  "Oração",
  "Conversas leves",
  "Eventos online",
  "Voluntariado",
];

class LocalBoundary extends Component<
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
        <div className="onboarding-fatal-local" role="alert">
          <RefreshCw />
          <h1>Não foi possível abrir esta etapa</h1>
          <p>O restante do aplicativo continua disponível.</p>
          <button onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
          <button className="ghost" onClick={this.props.onClose}>
            Voltar ao aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BrandPanel() {
  return (
    <aside className="onboarding-brand-panel" aria-label="VaiDarNamoro">
      <img src="/logo-oficial-transparente.png" alt="" />
      <div>
        <span>VaiDarNamoro</span>
        <h2>Uma comunidade cristã para pertencer.</h2>
        <p>
          Amizades, fé, experiências e conexões com propósito — namoro é uma possibilidade, não uma
          obrigação.
        </p>
      </div>
      <small>Comunidade cristã · PWA</small>
    </aside>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className={`onboarding-field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

function AccessView({
  setView,
  onGoogle,
}: {
  setView: (view: EntryView) => void;
  onGoogle: () => void;
}) {
  return (
    <div className="entry-card">
      <div className="entry-mobile-logo">
        <img src="/logo-oficial-transparente.png" alt="" />
        <strong>VaiDarNamoro</strong>
      </div>
      <span className="entry-eyebrow">BEM-VINDO</span>
      <h1>Conexões que fazem sentido na vida real.</h1>
      <p>Uma comunidade para viver, compartilhar e criar conexões com propósito.</p>
      <div className="entry-actions">
        <button className="google-button" onClick={onGoogle}>
          <span>G</span> Continuar com Google
        </button>
        <button className="primary" onClick={() => setView("login")}>
          Entrar com e-mail
        </button>
        <button className="secondary" onClick={() => setView("signup")}>
          Criar conta
        </button>
      </div>
      <button className="text-link" onClick={() => setView("recovery")}>
        Recuperar acesso
      </button>
      <div className="legal-links">
        <button>Termos</button>
        <button>Privacidade</button>
      </div>
      <details className="session-demo">
        <summary>Testar estados do primeiro acesso</summary>
        <div>
          <button onClick={() => setView("session")}>Estados de sessão</button>
          <button onClick={() => setView("review")}>Conta em análise</button>
          <button onClick={() => setView("offline")}>Modo offline</button>
          <button onClick={() => setView("new-password")}>Link de recuperação</button>
        </div>
      </details>
    </div>
  );
}

function LoginView({
  setView,
  onAuthenticated,
  showToast,
}: {
  setView: (view: EntryView) => void;
  onAuthenticated: () => void;
  showToast: (message: string) => void;
}) {
  const [email, setEmail] = useState("antonio@email.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) {
      setError("Digite sua senha. Os dados preenchidos foram preservados.");
      return;
    }
    setError("");
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      if (password === "erro") {
        setError("E-mail ou senha não conferem. Tente novamente.");
        showToast("Falha recuperável demonstrada");
      } else {
        onAuthenticated();
      }
    }, 650);
  };

  return (
    <form className="entry-card auth-form" onSubmit={submit}>
      <button type="button" className="back-link" onClick={() => setView("access")}>
        <ArrowLeft /> Voltar
      </button>
      <span className="entry-eyebrow">ENTRAR</span>
      <h1>Bom ter você de volta.</h1>
      <p>Continue de onde parou na comunidade.</p>
      <Field label="E-mail">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Senha" error={error}>
        <span className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </span>
      </Field>
      <button className="text-link align-left" type="button" onClick={() => setView("recovery")}>
        Esqueci minha senha
      </button>
      <button className="primary" disabled={submitting}>
        {submitting ? "Entrando…" : "Entrar"}
      </button>
      <small className="form-hint">
        Use qualquer senha para entrar; digite “erro” para testar a falha.
      </small>
    </form>
  );
}

function SignupView({
  setView,
  onCreated,
}: {
  setView: (view: EntryView) => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const fields = [
    ["Como você quer ser chamado?", "Nome", "Antonio"],
    ["Qual é sua data de nascimento?", "Data de nascimento", "1998-05-18"],
    ["Qual é seu e-mail?", "E-mail", "antonio@email.com"],
    ["Crie uma senha segura", "Senha", "••••••••••"],
  ];

  return (
    <div className="entry-card auth-form">
      <button
        className="back-link"
        onClick={() => (step ? setStep((value) => value - 1) : setView("access"))}
      >
        <ArrowLeft /> Voltar
      </button>
      <div className="step-meter" aria-label={`Etapa ${step + 1} de 6`}>
        <span style={{ width: `${((step + 1) / 6) * 100}%` }} />
      </div>
      {step < 4 && (
        <>
          <span className="entry-eyebrow">CRIAR CONTA · {step + 1}/6</span>
          <h1>{fields[step][0]}</h1>
          <Field label={fields[step][1]}>
            <input
              type={step === 1 ? "date" : step === 2 ? "email" : step === 3 ? "password" : "text"}
              defaultValue={step === 3 ? "" : fields[step][2]}
              placeholder={fields[step][2]}
              autoComplete={
                step === 0 ? "name" : step === 2 ? "email" : step === 3 ? "new-password" : "bday"
              }
            />
          </Field>
          {step === 1 && (
            <small className="form-hint">
              O VaiDarNamoro é uma comunidade para maiores de 18 anos.
            </small>
          )}
        </>
      )}
      {step === 4 && (
        <>
          <span className="entry-eyebrow">CRIAR CONTA · 5/6</span>
          <h1>Antes de continuar</h1>
          <p>Leia os documentos que explicam como a comunidade funciona.</p>
          <label className="terms-check">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>Aceito os Termos e a Política de Privacidade.</span>
          </label>
        </>
      )}
      {step === 5 && (
        <div className="confirmation-block">
          <span className="confirmation-icon">
            <Check />
          </span>
          <span className="entry-eyebrow">CRIAR CONTA · 6/6</span>
          <h1>Tudo certo para começar.</h1>
          <p>
            Seu perfil inicial será criado com apenas as informações essenciais. Preferências
            românticas não fazem parte desta etapa.
          </p>
        </div>
      )}
      <button
        className="primary"
        disabled={step === 4 && !accepted}
        onClick={() => (step === 5 ? onCreated() : setStep((value) => value + 1))}
      >
        {step === 5 ? "Criar meu perfil" : "Continuar"}
      </button>
    </div>
  );
}

function RecoveryView({
  view,
  setView,
  showToast,
}: {
  view: EntryView;
  setView: (view: EntryView) => void;
  showToast: (message: string) => void;
}) {
  if (view === "recovery-sent") {
    return (
      <div className="entry-card status-card">
        <span className="status-icon">
          <Bell />
        </span>
        <h1>Confira seu e-mail</h1>
        <p>
          Enviamos um link para <strong>antonio@email.com</strong>. Ele restaura a sessão depois da
          nova senha.
        </p>
        <button className="primary" onClick={() => setView("new-password")}>
          Simular abertura do link
        </button>
        <button className="secondary" onClick={() => setView("login")}>
          Voltar ao login
        </button>
      </div>
    );
  }
  if (view === "new-password") {
    return (
      <div className="entry-card auth-form">
        <button className="back-link" onClick={() => setView("login")}>
          <ArrowLeft /> Voltar
        </button>
        <span className="entry-eyebrow">RESTAURAR ACESSO</span>
        <h1>Crie uma nova senha</h1>
        <Field label="Nova senha">
          <input type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" />
        </Field>
        <Field label="Confirmar senha">
          <input type="password" autoComplete="new-password" />
        </Field>
        <button
          className="primary"
          onClick={() => {
            showToast("Senha atualizada e sessão restaurada");
            setView("login");
          }}
        >
          Atualizar senha
        </button>
        <div className="recovery-states">
          <button onClick={() => showToast("Este link expirou. Solicite outro.")}>
            Testar link expirado
          </button>
          <button onClick={() => showToast("Link inválido. Seus dados continuam seguros.")}>
            Testar link inválido
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="entry-card auth-form">
      <button className="back-link" onClick={() => setView("login")}>
        <ArrowLeft /> Voltar
      </button>
      <span className="entry-eyebrow">RECUPERAR ACESSO</span>
      <h1>Vamos ajudar você a voltar.</h1>
      <p>Informe o e-mail usado na sua conta.</p>
      <Field label="E-mail">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue="antonio@email.com"
        />
      </Field>
      <button className="primary" onClick={() => setView("recovery-sent")}>
        Enviar link
      </button>
    </div>
  );
}

function FirstAccess({
  onComplete,
  showToast,
}: {
  onComplete: () => void;
  showToast: (message: string) => void;
}) {
  const steps: FirstStep[] = ["welcome", "identity", "interests", "region", "privacy", "ready"];
  const [step, setStep] = useState<FirstStep>("welcome");
  const [selected, setSelected] = useState(["Bíblia e estudos", "Amizades", "Cinema"]);
  const index = steps.indexOf(step);

  const toggleInterest = (interest: string) => {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  return (
    <div className="first-access-card">
      <div className="first-access-progress">
        <span>{index + 1} de 6</span>
        <i>
          <b style={{ width: `${((index + 1) / 6) * 100}%` }} />
        </i>
      </div>
      {step === "welcome" && (
        <div className="first-access-center">
          <span className="welcome-mark">
            <Sparkles />
          </span>
          <span className="entry-eyebrow">PRIMEIRO ACESSO</span>
          <h1>Este é um lugar para viver a fé acompanhado.</h1>
          <p>Participe de conversas, Espaços, estudos, Cinema e amizades no seu ritmo.</p>
        </div>
      )}
      {step === "identity" && (
        <>
          <span className="entry-eyebrow">SUA IDENTIDADE</span>
          <h1>Como a comunidade verá você?</h1>
          <button
            className="photo-picker"
            onClick={() => showToast("Foto selecionada neste protótipo")}
          >
            <Camera />
            <span>
              Adicionar foto<small>Opcional</small>
            </span>
          </button>
          <Field label="Nome">
            <input defaultValue="Antonio Rodrigues" autoComplete="name" />
          </Field>
          <Field label="Username">
            <input defaultValue="antoniorodrigues" autoCapitalize="none" />
          </Field>
          <Field label="Apresentação curta">
            <textarea defaultValue="Construindo coisas, vivendo a fé e conhecendo gente boa." />
          </Field>
        </>
      )}
      {step === "interests" && (
        <>
          <span className="entry-eyebrow">INTERESSES</span>
          <h1>O que faz sentido para você agora?</h1>
          <p>Isso melhora Comunidade, Espaços, Verbo, Cinema e Pessoas.</p>
          <div className="interest-grid">
            {interests.map((interest) => (
              <button
                className={selected.includes(interest) ? "selected" : ""}
                key={interest}
                onClick={() => toggleInterest(interest)}
              >
                {selected.includes(interest) && <Check />}
                {interest}
              </button>
            ))}
          </div>
        </>
      )}
      {step === "region" && (
        <>
          <span className="entry-eyebrow">REGIÃO</span>
          <h1>De qual região você faz parte?</h1>
          <p>Usamos apenas cidade e estado. Sua localização exata não é solicitada.</p>
          <Field label="Cidade">
            <span className="input-with-icon">
              <MapPin />
              <input defaultValue="Peruíbe" autoComplete="address-level2" />
            </span>
          </Field>
          <Field label="Estado">
            <select defaultValue="SP">
              <option>SP</option>
              <option>RJ</option>
              <option>MG</option>
              <option>PR</option>
            </select>
          </Field>
          <button className="text-link align-left">Prefiro informar depois</button>
        </>
      )}
      {step === "privacy" && (
        <>
          <span className="entry-eyebrow">PRIVACIDADE INICIAL</span>
          <h1>Você continua no controle.</h1>
          <div className="privacy-list">
            {[
              ["Descoberta", "Permitir que pessoas encontrem seu Perfil.", true],
              ["Solicitações", "Receber pedidos de amizade.", true],
              ["Momentos", "Mostrar seus Momentos para amigos.", true],
              ["Visitas ao Perfil", "Exibir que você visitou um Perfil.", false],
            ].map(([title, description, active]) => (
              <label key={String(title)}>
                <span>
                  <strong>{String(title)}</strong>
                  <small>{String(description)}</small>
                </span>
                <input type="checkbox" defaultChecked={Boolean(active)} />
              </label>
            ))}
          </div>
        </>
      )}
      {step === "ready" && (
        <div className="first-access-center">
          <span className="welcome-mark ready">
            <Check />
          </span>
          <span className="entry-eyebrow">TUDO PRONTO</span>
          <h1>Sua comunidade está esperando.</h1>
          <p>Você pode ajustar qualquer escolha depois em Configurações.</p>
          <div className="ready-preview">
            <Home />
            <span>
              <strong>Comece pela Home</strong>
              <small>O que importa para você, sem excesso.</small>
            </span>
            <ChevronRight />
          </div>
        </div>
      )}
      <div className="first-access-actions">
        {index > 0 && (
          <button className="secondary" onClick={() => setStep(steps[index - 1])}>
            Voltar
          </button>
        )}
        <button
          className="primary"
          onClick={() => (step === "ready" ? onComplete() : setStep(steps[index + 1]))}
        >
          {step === "ready" ? "Ir para a Home" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

function SessionStates({
  setView,
  showToast,
}: {
  setView: (view: EntryView) => void;
  showToast: (message: string) => void;
}) {
  const states: SessionState[] = [
    "Inicializando",
    "Autenticado",
    "Não autenticado",
    "Sessão recuperável",
    "Erro recuperável",
    "Conta em análise",
    "Conta restrita",
    "Conta desativada",
  ];
  const [active, setActive] = useState<SessionState>("Inicializando");
  return (
    <div className="entry-card session-card">
      <button className="back-link" onClick={() => setView("access")}>
        <ArrowLeft /> Voltar
      </button>
      <span className="entry-eyebrow">ESTADOS DE SESSÃO</span>
      <h1>{active}</h1>
      <div className="session-visual">
        {active === "Inicializando" ? (
          <div className="session-skeleton">
            <i />
            <span />
            <span />
          </div>
        ) : active === "Erro recuperável" ? (
          <RefreshCw />
        ) : active === "Conta restrita" || active === "Conta desativada" ? (
          <ShieldCheck />
        ) : (
          <UserRound />
        )}
        <p>
          {active === "Inicializando"
            ? "Resolvendo sua sessão sem deixar a tela vazia…"
            : active === "Sessão recuperável"
              ? "Encontramos uma sessão salva neste dispositivo."
              : active === "Erro recuperável"
                ? "Algo falhou, mas você pode tentar novamente ou sair."
                : "Estado demonstrativo reaproveitando o roteamento do protótipo."}
        </p>
      </div>
      <div className="session-state-grid">
        {states.map((state) => (
          <button
            className={active === state ? "active" : ""}
            key={state}
            onClick={() => setActive(state)}
          >
            {state}
          </button>
        ))}
      </div>
      <button
        className="primary"
        onClick={() =>
          showToast(active === "Erro recuperável" ? "Sessão recuperada" : `${active} confirmado`)
        }
      >
        Continuar
      </button>
    </div>
  );
}

function StatusView({
  view,
  setView,
  onClose,
  showToast,
}: {
  view: EntryView;
  setView: (view: EntryView) => void;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  if (view === "offline") {
    return (
      <div className="entry-card status-card">
        <span className="status-icon offline">
          <WifiOff />
        </span>
        <h1>Você está sem conexão</h1>
        <p>
          A sessão cacheada e o conteúdo disponível neste dispositivo continuam acessíveis. O login
          requer internet.
        </p>
        <button
          className="primary"
          onClick={() => {
            showToast("Conexão restaurada");
            setView("access");
          }}
        >
          Tentar novamente
        </button>
        <button className="secondary" onClick={onClose}>
          Usar conteúdo disponível
        </button>
      </div>
    );
  }
  return (
    <div className="entry-card status-card">
      <span className="status-icon">
        <ShieldCheck />
      </span>
      <span className="entry-eyebrow">APROVAÇÃO</span>
      <h1>Seu perfil está em análise</h1>
      <p>Enquanto isso, você pode conhecer as regras e configurar alguns detalhes.</p>
      <div className="review-steps">
        <span>
          <Check /> Conta criada
        </span>
        <span>
          <RefreshCw /> Revisão em andamento
        </span>
        <span>Próximo passo: aguardar a atualização do estado</span>
      </div>
      <button className="primary" onClick={() => showToast("Regras da comunidade abertas")}>
        Conhecer as regras
      </button>
      <button className="secondary" onClick={() => showToast("Ajuda aberta")}>
        <HelpCircle /> Preciso de ajuda
      </button>
      <button className="text-link" onClick={() => setView("access")}>
        Sair
      </button>
    </div>
  );
}

function OnboardingContent({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [splash, setSplash] = useState(true);
  const [view, setView] = useState<EntryView>("access");
  const [firstAccess, setFirstAccess] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 620);
    return () => window.clearTimeout(timer);
  }, []);

  const viewContent = useMemo(() => {
    if (firstAccess)
      return (
        <FirstAccess
          onComplete={() => {
            window.localStorage.setItem("vdn-onboarding-complete", "true");
            showToast("Primeiro acesso concluído");
            onClose();
          }}
          showToast={showToast}
        />
      );
    if (view === "access")
      return (
        <AccessView
          setView={setView}
          onGoogle={() => {
            showToast("Acesso Google simulado pelo fluxo existente");
            setFirstAccess(true);
          }}
        />
      );
    if (view === "login")
      return (
        <LoginView
          setView={setView}
          showToast={showToast}
          onAuthenticated={() => {
            showToast("Sessão restaurada");
            onClose();
          }}
        />
      );
    if (view === "signup")
      return <SignupView setView={setView} onCreated={() => setFirstAccess(true)} />;
    if (["recovery", "recovery-sent", "new-password"].includes(view))
      return <RecoveryView view={view} setView={setView} showToast={showToast} />;
    if (view === "session") return <SessionStates setView={setView} showToast={showToast} />;
    return <StatusView view={view} setView={setView} onClose={onClose} showToast={showToast} />;
  }, [firstAccess, onClose, showToast, view]);

  if (splash) {
    return (
      <div className="onboarding-splash" aria-label="Inicializando VaiDarNamoro">
        <img src="/logo-oficial-transparente.png" alt="" />
        <strong>VaiDarNamoro</strong>
        <span>Inicializando sua comunidade…</span>
      </div>
    );
  }

  return (
    <section className="onboarding-experience" aria-label="Acesso ao VaiDarNamoro">
      <button className="onboarding-close" aria-label="Fechar demonstração" onClick={onClose}>
        <X />
      </button>
      <BrandPanel />
      <main className="onboarding-main">{viewContent}</main>
      <div className="pwa-context-card">
        <Smartphone />
        <span>
          <strong>Instale quando quiser</strong>
          <small>No iPhone: Safari → Compartilhar → Adicionar à Tela de Início.</small>
        </span>
        <button onClick={() => showToast("Convite de instalação dispensado")}>Agora não</button>
      </div>
    </section>
  );
}

export default function OnboardingExperience({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  if (!visible) return null;
  return (
    <LocalBoundary onClose={onClose}>
      <OnboardingContent onClose={onClose} showToast={showToast} />
    </LocalBoundary>
  );
}
