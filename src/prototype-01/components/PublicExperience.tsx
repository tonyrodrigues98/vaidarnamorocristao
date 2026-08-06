"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Download,
  Gamepad2,
  Globe2,
  HeartHandshake,
  LockKeyhole,
  Mail,
  Menu,
  PawPrint,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import "../styles/PublicExperience.css";

type AuthView = "login" | "signup" | "recovery" | "recovery-sent" | "new-password";
type PublicLink = "perfil" | "evento" | "espaco" | "convite" | "indisponivel";

class PublicBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Public experience failed locally", error, info);
  }
  render() {
    if (this.state.failed) {
      return (
        <section className="public-local-error" role="alert">
          <ShieldCheck />
          <h1>A entrada pública não carregou por completo.</h1>
          <p>O restante do VaiDarNamoro continua preservado.</p>
          <button onClick={() => this.setState({ failed: false })}>Tentar de novo</button>
          <button className="ghost" onClick={this.props.onExit}>
            Voltar ao aplicativo
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

const experiences = [
  {
    title: "Comunidade",
    copy: "Momentos, publicações e amizades no seu ritmo.",
    icon: UsersRound,
    tone: "coral",
    size: "feature",
  },
  {
    title: "Espaços",
    copy: "Grupos com assunto, identidade e cuidado.",
    icon: Globe2,
    tone: "violet",
    size: "standard",
  },
  {
    title: "Verbo",
    copy: "Bíblia, estudos e devocionais conectados.",
    icon: BookOpen,
    tone: "ink",
    size: "standard",
  },
  {
    title: "Cinema",
    copy: "Sessões para assistir e conversar juntos.",
    icon: Clapperboard,
    tone: "night",
    size: "wide",
  },
  {
    title: "Pets",
    copy: "Companheiros, cuidado e pequenas conquistas.",
    icon: PawPrint,
    tone: "sand",
    size: "standard",
  },
  {
    title: "Arcade",
    copy: "Jogos leves dentro da comunidade.",
    icon: Gamepad2,
    tone: "violet",
    size: "standard",
  },
  {
    title: "Eventos",
    copy: "Encontros online e presenciais.",
    icon: Sparkles,
    tone: "coral",
    size: "standard",
  },
  {
    title: "Pessoas",
    copy: "Descoberta por interesses, região e contexto.",
    icon: UserRound,
    tone: "ink",
    size: "wide",
  },
  {
    title: "Loja",
    copy: "Personalização sem transformar expressão em disputa.",
    icon: ShoppingBag,
    tone: "sand",
    size: "standard",
  },
];

function PublicHeader({
  onAuth,
  onNavigate,
}: {
  onAuth: (view: AuthView) => void;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    ["como-funciona", "Como funciona"],
    ["experiencias", "Experiências"],
    ["comunidade-publica", "Comunidade"],
    ["seguranca-publica", "Segurança"],
    ["instalar", "Instalar"],
  ];
  return (
    <header className="public-header">
      <a href="#public-hero" className="public-brand" onClick={() => setOpen(false)}>
        <BrandLogo className="w-36" />
      </a>
      <nav aria-label="Navegação pública">
        {links.map(([id, label]) => (
          <button key={id} onClick={() => onNavigate(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="public-header-actions">
        <button className="public-login" onClick={() => onAuth("login")}>
          Entrar
        </button>
        <button className="public-signup" onClick={() => onAuth("signup")}>
          Criar conta
        </button>
        <button
          className="public-menu-trigger"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="public-mobile-menu">
          {links.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setOpen(false);
                onNavigate(id);
              }}
            >
              {label}
              <ChevronRight />
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              onAuth("login");
            }}
          >
            Entrar
            <ChevronRight />
          </button>
          <button
            className="primary"
            onClick={() => {
              setOpen(false);
              onAuth("signup");
            }}
          >
            Criar conta
          </button>
        </div>
      )}
    </header>
  );
}

function ProductPreview() {
  const [active, setActive] = useState("Início");
  const items = ["Início", "Comunidade", "Conversas", "Perfil", "Explorar"];
  return (
    <div className="public-product-preview" aria-label="Demonstração visual do produto">
      <div className="preview-sidebar">
        <span>
          <BrandLogo className="w-36" />
        </span>
        {items.map((item) => (
          <button
            key={item}
            className={active === item ? "active" : ""}
            onClick={() => setActive(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="preview-main">
        <header>
          <span>{active}</span>
          <Search />
          <span className="preview-avatar">AR</span>
        </header>
        {active === "Início" && (
          <div className="preview-home">
            <article className="preview-verse">
              <small>PALAVRA DO DIA</small>
              <strong>“O Senhor é a minha força e o meu escudo.”</strong>
              <span>Salmos 28:7 · NAA</span>
            </article>
            <div className="preview-shortcuts">
              <i>Verbo</i>
              <i>Cinema</i>
              <i>Pet</i>
              <i>Arcade</i>
            </div>
            <article className="preview-event">
              <Clapperboard />
              <span>
                <small>HOJE · 20H</small>
                <strong>Cinema em comunidade</strong>
              </span>
            </article>
          </div>
        )}
        {active === "Comunidade" && (
          <div className="preview-community">
            <div className="preview-moments">
              <i>AR</i>
              <i>AC</i>
              <i>LA</i>
              <i>CB</i>
            </div>
            <article>
              <span className="preview-avatar">AC</span>
              <div>
                <strong>Ana Clara</strong>
                <small>Café, Bíblia & Amizade</small>
              </div>
              <p>Tem espaço para uma conversa leve sobre João 8 hoje à noite.</p>
            </article>
            <article>
              <span className="preview-avatar violet">CB</span>
              <div>
                <strong>Café, Bíblia & Amizade</strong>
                <small>Espaço público</small>
              </div>
              <p>Uma comunidade pequena para viver a fé acompanhado.</p>
            </article>
          </div>
        )}
        {active === "Conversas" && (
          <div className="preview-list">
            {["Ana Clara", "Café, Bíblia & Amizade", "Trio de Peruíbe"].map((name, index) => (
              <article key={name}>
                <span className="preview-avatar">{name.slice(0, 2)}</span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {index ? "Há novidades na conversa" : "Também gostei daquele texto…"}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
        {active === "Perfil" && (
          <div className="preview-profile">
            <div className="preview-profile-cover" />
            <span className="preview-avatar large">AR</span>
            <h3>Antonio Rodrigues</h3>
            <p>Construindo coisas, vivendo a fé e conhecendo gente boa.</p>
            <div>
              <i>3 Espaços</i>
              <i>8 amigos</i>
              <i>Peruíbe</i>
            </div>
          </div>
        )}
        {active === "Explorar" && (
          <div className="preview-explore">
            <article>
              <BookOpen />
              <strong>Continue João 8</strong>
              <small>68% concluído</small>
            </article>
            <article>
              <Clapperboard />
              <strong>Cinema da Comunidade</strong>
              <small>Começa às 20h</small>
            </article>
            <article>
              <PawPrint />
              <strong>Bento está descansando</strong>
              <small>Tudo tranquilo</small>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthPanel({
  view,
  onView,
  onClose,
  onAuthenticated,
  destination,
}: {
  view: AuthView;
  onView: (view: AuthView) => void;
  onClose: () => void;
  onAuthenticated: () => void;
  destination: string | null;
}) {
  const [email, setEmail] = useState("antonio@email.com");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setError("");
    window.setTimeout(() => {
      setLoading(false);
      if (password.toLowerCase() === "erro")
        setError("Não foi possível entrar. Seus campos foram preservados.");
      else onAuthenticated();
    }, 520);
  };

  return (
    <div
      className="public-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-auth-title"
    >
      <button className="public-auth-backdrop" aria-label="Fechar" onClick={onClose} />
      <section className="public-auth-panel">
        <header>
          <button
            aria-label="Voltar"
            onClick={view === "login" || view === "signup" ? onClose : () => onView("login")}
          >
            <ArrowLeft />
          </button>
          <BrandLogo className="w-40" />
          <button aria-label="Fechar" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="public-auth-content">
          {destination && (
            <div className="auth-destination">
              <LockKeyhole />
              <span>
                <strong>Entre para continuar</strong>
                <small>Depois do acesso, você volta para {destination}.</small>
              </span>
            </div>
          )}
          {view === "login" && (
            <>
              <span className="public-kicker">ENTRAR</span>
              <h2 id="public-auth-title">Que bom ter você de volta.</h2>
              <p>Continue de onde parou na comunidade.</p>
              <button className="provider-button">
                <span>G</span>Continuar com Google
              </button>
              <div className="auth-divider">
                <span>ou com e-mail</span>
              </div>
              <label>
                E-mail
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}
              <button className="auth-link" onClick={() => onView("recovery")}>
                Recuperar acesso
              </button>
              <button className="auth-primary" disabled={loading} onClick={submit}>
                {loading ? "Entrando…" : "Entrar"}
              </button>
              <button className="auth-switch" onClick={() => onView("signup")}>
                Ainda não tenho conta
              </button>
            </>
          )}
          {view === "signup" && (
            <>
              <span className="public-kicker">CRIAR CONTA</span>
              <h2 id="public-auth-title">Comece apenas com o essencial.</h2>
              <p>Os detalhes do seu Perfil ficam para o onboarding, depois do acesso.</p>
              <button className="provider-button">
                <span>G</span>Continuar com Google
              </button>
              <div className="auth-divider">
                <span>ou com e-mail</span>
              </div>
              <label>
                E-mail
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                />
              </label>
              <label className="public-terms">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  Aceito os <button>Termos</button> e a <button>Política de Privacidade</button>.
                </span>
              </label>
              <button className="auth-primary" disabled={!accepted || loading} onClick={submit}>
                {loading ? "Criando…" : "Criar conta"}
              </button>
              <button className="auth-switch" onClick={() => onView("login")}>
                Já tenho conta
              </button>
            </>
          )}
          {view === "recovery" && (
            <>
              <span className="public-kicker">RECUPERAR ACESSO</span>
              <h2 id="public-auth-title">Informe seu e-mail.</h2>
              <p>Você receberá um link para criar uma nova senha.</p>
              <label>
                E-mail
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button className="auth-primary" onClick={() => onView("recovery-sent")}>
                Enviar link
              </button>
            </>
          )}
          {view === "recovery-sent" && (
            <div className="auth-status">
              <span>
                <Mail />
              </span>
              <h2 id="public-auth-title">Confira seu e-mail.</h2>
              <p>
                Enviamos as próximas instruções para <strong>{email}</strong>.
              </p>
              <button className="auth-primary" onClick={() => onView("new-password")}>
                Simular abertura do link
              </button>
              <button className="auth-switch" onClick={() => onView("login")}>
                Voltar ao login
              </button>
            </div>
          )}
          {view === "new-password" && (
            <>
              <span className="public-kicker">NOVA SENHA</span>
              <h2 id="public-auth-title">Proteja novamente seu acesso.</h2>
              <label>
                Nova senha
                <input type="password" autoComplete="new-password" />
              </label>
              <label>
                Confirmar senha
                <input type="password" autoComplete="new-password" />
              </label>
              <button className="auth-primary" onClick={() => onView("login")}>
                Atualizar e voltar ao login
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function PublicLinkPanel({
  link,
  onClose,
  onRequireAuth,
}: {
  link: PublicLink;
  onClose: () => void;
  onRequireAuth: (destination: string) => void;
}) {
  const content = {
    perfil: [
      "Perfil público",
      "Ana Clara",
      "Leitura, música e amizade · Peruíbe, SP",
      "Enviar solicitação",
    ],
    evento: ["Evento público", "Cinema em comunidade", "Hoje, 20h · Sala Oficial", "Participar"],
    espaco: [
      "Espaço público",
      "Café, Bíblia & Amizade",
      "Conversas leves e estudos · 248 membros",
      "Entrar no Espaço",
    ],
    convite: [
      "Convite",
      "Trio de Peruíbe",
      "Marina convidou você para uma conversa em grupo.",
      "Aceitar convite",
    ],
    indisponivel: [
      "Conteúdo indisponível",
      "Este link não está mais disponível.",
      "Ele pode ter expirado, mudado de privacidade ou sido removido.",
      "Voltar",
    ],
  }[link];
  return (
    <div className="public-link-overlay" role="dialog" aria-modal="true">
      <button className="public-auth-backdrop" aria-label="Fechar" onClick={onClose} />
      <section>
        <header>
          <span>{content[0]}</span>
          <button aria-label="Fechar" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className={`public-link-visual ${link}`}>
          <BrandLogo className="w-40" />
          <Globe2 />
        </div>
        <small>VAIDARNAMORO · LINK COMPARTILHADO</small>
        <h2>{content[1]}</h2>
        <p>{content[2]}</p>
        {link === "indisponivel" ? (
          <button className="auth-primary" onClick={onClose}>
            {content[3]}
          </button>
        ) : (
          <button className="auth-primary" onClick={() => onRequireAuth(content[1])}>
            {content[3]}
          </button>
        )}
        {link !== "indisponivel" && (
          <button className="auth-switch" onClick={onClose}>
            Continuar conhecendo sem entrar
          </button>
        )}
      </section>
    </div>
  );
}

export default function PublicExperience({
  visible,
  onExit,
  onAuthenticated,
  onOpenEditorial,
  showToast,
}: {
  visible: boolean;
  onExit: () => void;
  onAuthenticated: () => void;
  onOpenEditorial: (target?: string) => void;
  showToast: (message: string) => void;
}) {
  const scrollRef = useRef<HTMLElement | null>(null);
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<PublicLink | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const saved = Number(window.sessionStorage.getItem("vdn-public-scroll") ?? "0");
    window.requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: saved }));
  }, [visible]);

  if (!visible) return null;

  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const openAuth = (view: AuthView, requestedDestination: string | null = null) => {
    setDestination(requestedDestination);
    setAuthView(view);
  };
  const closePublic = () => {
    window.sessionStorage.setItem("vdn-public-scroll", String(scrollRef.current?.scrollTop ?? 0));
    onExit();
  };

  return (
    <PublicBoundary onExit={onExit}>
      <section className="public-experience" aria-label="Entrada pública do VaiDarNamoro">
        <PublicHeader onAuth={(view) => openAuth(view)} onNavigate={navigate} />
        <main ref={scrollRef} className="public-scroll">
          {offline && (
            <div className="public-state-banner">
              <WifiOff />
              Você está offline. Mostrando a apresentação já carregada.
              <button onClick={() => setOffline(false)}>Tentar novamente</button>
            </div>
          )}
          <section className="public-hero" id="public-hero">
            <div className="public-hero-copy">
              <span className="public-kicker">COMUNIDADE CRISTÃ · AMIZADE · PROPÓSITO</span>
              <h1>
                Uma comunidade cristã para viver, compartilhar e criar conexões com propósito.
              </h1>
              <p>
                Encontre pessoas, participe de experiências e cresça acompanhado. Relacionamento é
                uma possibilidade — não a condição para fazer parte.
              </p>
              <div className="public-hero-actions">
                <button className="primary" onClick={() => openAuth("signup")}>
                  Criar conta
                  <ChevronRight />
                </button>
                <button onClick={() => openAuth("login")}>Entrar</button>
                <button onClick={() => navigate("comunidade-publica")}>
                  Conhecer a comunidade
                </button>
              </div>
              <div className="public-hero-notes">
                <span>
                  <Check />
                  Sem swipe
                </span>
                <span>
                  <Check />
                  No seu ritmo
                </span>
                <span>
                  <Check />
                  Modo Namoro opcional
                </span>
              </div>
            </div>
            <div className="public-hero-composition" aria-label="Experiências da comunidade">
              <article className="hero-card hero-community">
                <UsersRound />
                <small>COMUNIDADE</small>
                <strong>Gente para conversar, não números para seguir.</strong>
                <div>
                  <i>AC</i>
                  <i>LA</i>
                  <i>MS</i>
                  <span>+8 ativos</span>
                </div>
              </article>
              <article className="hero-card hero-verbo">
                <BookOpen />
                <small>VERBO</small>
                <strong>João 8</strong>
                <span>Continue sua leitura · 68%</span>
              </article>
              <article className="hero-card hero-cinema">
                <Clapperboard />
                <small>HOJE · 20H</small>
                <strong>Cinema em comunidade</strong>
              </article>
              <article className="hero-card hero-space">
                <Globe2 />
                <small>ESPAÇO</small>
                <strong>Café, Bíblia & Amizade</strong>
                <span>248 membros</span>
              </article>
            </div>
          </section>

          <section className="public-product" aria-labelledby="public-product-title">
            <div className="public-section-heading">
              <span className="public-kicker">POR DENTRO DO PRODUTO</span>
              <h2 id="public-product-title">
                Organizado para você entrar, viver algo e voltar sem se perder.
              </h2>
              <p>
                Uma única base reúne sua Home, Comunidade, Conversas, Perfil e descoberta de
                experiências.
              </p>
            </div>
            <ProductPreview />
          </section>

          <section className="public-how" id="como-funciona" aria-labelledby="how-title">
            <div className="public-section-heading compact">
              <span className="public-kicker">COMO FUNCIONA</span>
              <h2 id="how-title">Comece simples. Descubra no caminho.</h2>
            </div>
            <ol>
              {[
                [
                  "01",
                  "Crie sua identidade",
                  "Mostre quem você é sem transformar o Perfil em currículo.",
                ],
                [
                  "02",
                  "Encontre sua comunidade",
                  "Pessoas e Espaços surgem por contexto, interesses e região.",
                ],
                [
                  "03",
                  "Participe de experiências",
                  "Converse, estude, assista, jogue e encontre gente.",
                ],
                [
                  "04",
                  "Construa conexões",
                  "Amizades crescem com presença e conversa, não com popularidade.",
                ],
                [
                  "05",
                  "Ative o Modo Namoro se desejar",
                  "Uma área separada, opcional e sem swipe.",
                ],
              ].map(([number, title, copy]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </div>
                  <ChevronRight />
                </li>
              ))}
            </ol>
          </section>

          <section
            className="public-experiences"
            id="experiencias"
            aria-labelledby="experiences-title"
          >
            <div className="public-section-heading">
              <span className="public-kicker">EXPERIÊNCIAS</span>
              <h2 id="experiences-title">Vários jeitos de pertencer. Nenhum deles obrigatório.</h2>
            </div>
            <div className="public-experience-mosaic">
              {experiences.map(({ title, copy, icon: Icon, tone, size }) => (
                <article key={title} className={`${tone} ${size}`}>
                  <Icon />
                  <span>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </span>
                  <ChevronRight />
                </article>
              ))}
            </div>
          </section>

          <section className="public-community" id="comunidade-publica">
            <div className="community-public-art">
              <span className="moment-ring">AC</span>
              <span className="moment-ring second">LA</span>
              <article>
                <small>MOMENTO</small>
                <strong>Um fim de tarde, uma conversa boa e nenhuma pressa.</strong>
                <span>Ana Clara · Amigos</span>
              </article>
              <article>
                <small>ESPAÇO</small>
                <strong>Cristãos do Litoral Sul</strong>
                <span>6 novas conversas</span>
              </article>
            </div>
            <div>
              <span className="public-kicker">COMUNIDADE</span>
              <h2>Presença, conversa e amizade — sem corrida por seguidores.</h2>
              <p>
                Momentos, publicações, Espaços e eventos ajudam você a encontrar contexto para
                participar. Conversas continuam privadas e amizades não viram placar.
              </p>
              <ul>
                <li>
                  <Check />
                  Momentos e publicações
                </li>
                <li>
                  <Check />
                  Espaços por assunto e região
                </li>
                <li>
                  <Check />
                  Eventos e conversas
                </li>
                <li>
                  <Check />
                  Amizades sem contagem pública
                </li>
              </ul>
            </div>
          </section>

          <section className="public-safety" id="seguranca-publica">
            <div className="public-section-heading compact">
              <span className="public-kicker">SEGURANÇA E CONFIANÇA</span>
              <h2>Ferramentas claras para participar com mais controle.</h2>
              <p>
                Nenhuma plataforma elimina todo risco. Por isso, o VaiDarNamoro combina revisão,
                escolhas de privacidade e caminhos de suporte.
              </p>
            </div>
            <div>
              {[
                [
                  ShieldCheck,
                  "Perfis aprovados",
                  "Estados de aprovação e verificação visíveis, sem promessa absoluta.",
                ],
                [
                  LockKeyhole,
                  "Privacidade",
                  "Você escolhe quem encontra, vê e interage com seu conteúdo.",
                ],
                [
                  CircleHelp,
                  "Suporte e recursos",
                  "Bloqueio, denúncia, moderação e recurso em fluxos explicados.",
                ],
              ].map(([Icon, title, copy]) => {
                const SafetyIcon = Icon as typeof ShieldCheck;
                return (
                  <article key={String(title)}>
                    <SafetyIcon />
                    <strong>{String(title)}</strong>
                    <p>{String(copy)}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="public-dating">
            <span>
              <HeartHandshake />
            </span>
            <div>
              <small>MODO NAMORO · OPCIONAL</small>
              <h2>Relacionamentos com propósito, quando fizer sentido para você.</h2>
              <p>
                Uma experiência separada da comunidade, cristã, séria, sem swipe e sem pressão para
                ativar.
              </p>
            </div>
            <button onClick={() => showToast("Explicação do Modo Namoro aberta")}>
              Entender como funciona
              <ChevronRight />
            </button>
          </section>

          <section className="public-testimonials">
            <div className="public-section-heading compact">
              <span className="public-kicker">EXPERIÊNCIAS DA COMUNIDADE</span>
              <h2>O que esta proposta quer tornar possível.</h2>
              <p>
                Conteúdo demonstrativo para visualizar o formato — não representa depoimentos reais
                publicados.
              </p>
            </div>
            <div>
              <article>
                <span>DEMONSTRAÇÃO</span>
                <p>
                  “Entrei por causa dos estudos, fiquei pelas conversas e encontrei gente da minha
                  região.”
                </p>
                <strong>Ana Clara</strong>
                <small>Contexto simulado · Comunidade</small>
              </article>
              <article>
                <span>DEMONSTRAÇÃO</span>
                <p>
                  “Gosto de poder participar sem precisar publicar o tempo todo ou ativar o Modo
                  Namoro.”
                </p>
                <strong>Lucas Almeida</strong>
                <small>Contexto simulado · Espaços</small>
              </article>
            </div>
          </section>

          <section className="public-install" id="instalar">
            <div>
              <Download />
              <span className="public-kicker">INSTALAR NO CELULAR</span>
              <h2>Entre mais rápido, em tela cheia e com menos distração.</h2>
              <p>
                O PWA oferece acesso pela Tela de Início, notificações quando autorizadas e parte do
                conteúdo já carregado mesmo com conexão instável. Não substitui internet para tudo.
              </p>
            </div>
            <div className="install-guides">
              <article>
                <span>iPhone</span>
                <ol>
                  <li>Abra no Safari.</li>
                  <li>Toque em Compartilhar.</li>
                  <li>Escolha “Adicionar à Tela de Início”.</li>
                </ol>
              </article>
              <article>
                <span>Android</span>
                <ol>
                  <li>Abra no Chrome.</li>
                  <li>Abra o menu do navegador.</li>
                  <li>Escolha “Instalar aplicativo”.</li>
                </ol>
              </article>
              {installed ? (
                <button disabled>
                  <Check />
                  Já instalado neste dispositivo
                </button>
              ) : installDismissed ? (
                <button onClick={() => setInstallDismissed(false)}>
                  Mostrar opção de instalação
                </button>
              ) : (
                <>
                  <button className="primary" onClick={() => setInstalled(true)}>
                    Simular instalação
                  </button>
                  <button onClick={() => setInstallDismissed(true)}>Agora não</button>
                </>
              )}
            </div>
          </section>

          <section className="public-links-demo">
            <div className="public-section-heading compact">
              <span className="public-kicker">LINKS PÚBLICOS</span>
              <h2>Conteúdo compartilhado mantém o contexto.</h2>
            </div>
            <div>
              {(["perfil", "evento", "espaco", "convite", "indisponivel"] as PublicLink[]).map(
                (link) => (
                  <button key={link} onClick={() => setPublicLink(link)}>
                    <Globe2 />
                    <span>
                      {link === "espaco" ? "Espaço" : link[0].toUpperCase() + link.slice(1)}
                    </span>
                    <ChevronRight />
                  </button>
                ),
              )}
            </div>
          </section>

          <footer className="public-footer">
            <div>
              <BrandLogo className="w-40" />
              <p>Comunidade cristã para amizade, experiências e conexões com propósito.</p>
            </div>
            <nav aria-label="Informações públicas">
              {[
                ["Sobre", "sobre"],
                ["Como funciona", "como-funciona"],
                ["Segurança", "seguranca-publica"],
                ["Ajuda", "manual"],
                ["Termos", "termos"],
                ["Privacidade", "privacidade"],
                ["Regras", "regras"],
                ["Blog", "blog"],
                ["Notícias", "noticias"],
                ["Instalar", "instalar"],
                ["Contato", "contato"],
              ].map(([label, target]) => (
                <button
                  key={label}
                  onClick={() =>
                    target === "como-funciona" ||
                    target === "seguranca-publica" ||
                    target === "instalar"
                      ? navigate(target)
                      : onOpenEditorial(target)
                  }
                >
                  {label}
                </button>
              ))}
            </nav>
            <small>Protótipo visual · Conteúdo jurídico sujeito a validação humana</small>
          </footer>
        </main>
        <button className="public-exit" onClick={closePublic}>
          Voltar ao aplicativo
        </button>
        <button
          className="public-state-demo"
          onClick={() => setOffline((value) => !value)}
          aria-label="Alternar demonstração offline"
        >
          <WifiOff />
        </button>
        {authView && (
          <AuthPanel
            view={authView}
            onView={setAuthView}
            onClose={() => {
              setAuthView(null);
              setDestination(null);
            }}
            destination={destination}
            onAuthenticated={() => {
              setAuthView(null);
              setDestination(null);
              onAuthenticated();
            }}
          />
        )}
        {publicLink && (
          <PublicLinkPanel
            link={publicLink}
            onClose={() => setPublicLink(null)}
            onRequireAuth={(requested) => {
              setPublicLink(null);
              openAuth("login", requested);
            }}
          />
        )}
      </section>
    </PublicBoundary>
  );
}
