"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  EyeOff,
  Filter,
  Flag,
  Gift,
  Heart,
  HeartHandshake,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pause,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useState } from "react";
import "../styles/DatingExperience.css";

type DatingTab = "Descobrir" | "Interesses" | "Conexões" | "Recados";
type InterestTab = "Recebidos" | "Enviados";
type DatingState = "normal" | "inactive" | "ineligible" | "empty" | "offline" | "error" | "paused";

type Person = {
  id: string;
  initials: string;
  name: string;
  age: number;
  location: string;
  intro: string;
  prompts: string[];
  children: string;
  family: string;
  faith: string;
  interests: string[];
  context: string;
  tone: string;
};

const people: Person[] = [
  {
    id: "ana",
    initials: "AC",
    name: "Ana Clara",
    age: 28,
    location: "Santos, SP",
    intro: "Quero construir uma história leve, verdadeira e com Deus no centro.",
    prompts: [
      "Domingo ideal: igreja, almoço em família e praia",
      "Tenho aprendido a ouvir antes de responder",
    ],
    children: "Não tenho filhos",
    family: "Desejo ter filhos",
    faith: "Fé presente no cotidiano",
    interests: ["Leitura", "Música", "Cinema"],
    context: "2 Espaços em comum",
    tone: "coral",
  },
  {
    id: "marina",
    initials: "MS",
    name: "Marina Souza",
    age: 31,
    location: "Itanhaém, SP",
    intro: "Acredito em amizade, propósito e conversas que não precisam de pressa.",
    prompts: ["Um valor indispensável: gentileza", "Sirvo com música e acolhimento"],
    children: "Tenho 1 filho",
    family: "Aberta a ter mais filhos",
    faith: "Participa ativamente da comunidade",
    interests: ["Praia", "Louvor", "Voluntariado"],
    context: "Café, Bíblia & Amizade",
    tone: "violet",
  },
  {
    id: "beatriz",
    initials: "BR",
    name: "Beatriz Rocha",
    age: 26,
    location: "Peruíbe, SP",
    intro: "Gosto de gente inteira: com fé, dúvidas, bom humor e vontade de crescer.",
    prompts: ["Meu lugar favorito: perto do mar", "Quero uma família que converse muito"],
    children: "Não tenho filhos",
    family: "Desejo ter filhos",
    faith: "Caminhada cristã há 9 anos",
    interests: ["Livros", "Culinária", "Eventos"],
    context: "3 amigos em comum",
    tone: "sage",
  },
];

const activationSteps = [
  ["Apresentação", "Uma experiência opcional para conhecer pessoas com propósito."],
  ["Elegibilidade", "Confirme os requisitos básicos para participar com segurança."],
  ["Quem você procura", "Escolha quem faz sentido conhecer nesta experiência."],
  ["Faixa etária", "Defina uma faixa confortável, sem ranking ou competição."],
  ["Região", "Use cidade, estado ou regiões — nunca distância exata."],
  ["Família", "Conte sobre filhos e seu desejo de construir família."],
  ["Fé e vida cristã", "Compartilhe como a fé participa da sua rotina."],
  ["Perfil romântico", "Uma camada breve da sua identidade, não um perfil duplicado."],
  ["Privacidade", "Somente pessoas ativas neste modo verão estas informações."],
  ["Revisão", "Revise suas escolhas antes de tornar o modo visível."],
] as const;

class DatingBoundary extends Component<
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
        <div className="dating-local-error" role="alert">
          <CircleAlert size={30} />
          <h2>O Modo Namoro encontrou um problema</h2>
          <p>O erro ficou contido aqui. A comunidade e as outras áreas continuam funcionando.</p>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={17} /> Tentar novamente
          </button>
          <button className="secondary" onClick={this.props.onClose}>
            Voltar para Explorar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Avatar({ person, large = false }: { person: Person; large?: boolean }) {
  return (
    <span className={`dating-avatar tone-${person.tone} ${large ? "large" : ""}`}>
      {person.initials}
    </span>
  );
}

function ActivationFlow({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [choice, setChoice] = useState("");
  const [ageMin, setAgeMin] = useState(27);
  const [ageMax, setAgeMax] = useState(38);
  const [bio, setBio] = useState("");
  const [prompts, setPrompts] = useState(["", "", ""]);
  const current = activationSteps[step];
  const ageRangeValid = ageMin >= 18 && ageMax <= 80 && ageMin < ageMax;
  const ageTrack = {
    "--age-min-position": `${((ageMin - 18) / 62) * 100}%`,
    "--age-max-position": `${((ageMax - 18) / 62) * 100}%`,
  } as React.CSSProperties;

  const ageHaptic = () => {
    if (window.localStorage.getItem("vdn-haptics") === "false") return;
    if ("vibrate" in navigator) navigator.vibrate(6);
  };

  const next = () => {
    if (step === activationSteps.length - 1) onComplete();
    else {
      setChoice("");
      setStep((value) => value + 1);
    }
  };

  return (
    <div className="dating-activation">
      <header>
        <button aria-label="Voltar" onClick={step ? () => setStep((value) => value - 1) : onClose}>
          <ArrowLeft size={21} />
        </button>
        <span>Ativar Modo Namoro</span>
        <small>
          {step + 1} de {activationSteps.length}
        </small>
      </header>
      <div className="activation-progress">
        <i style={{ width: `${((step + 1) / activationSteps.length) * 100}%` }} />
      </div>
      <main>
        <span className="dating-overline">ETAPA {step + 1}</span>
        <h1>{current[0]}</h1>
        <p>{current[1]}</p>

        {step === 0 && (
          <div className="activation-intro">
            <HeartHandshake size={36} />
            <strong>Conhecer pessoas com propósito</strong>
            <span>
              Sem swipe, popularidade ou porcentagens. Aqui, o interesse é respeitoso e só vira
              conexão quando é mútuo.
            </span>
          </div>
        )}
        {step === 1 && (
          <div className="eligibility-list">
            <label>
              <input type="checkbox" defaultChecked />
              <span className="check-control" aria-hidden="true">
                <Check size={16} />
              </span>
              <span>Tenho 18 anos ou mais</span>
            </label>
            <label className="is-disabled" aria-disabled="true">
              <input type="checkbox" defaultChecked disabled />
              <span className="check-control" aria-hidden="true">
                <Check size={16} />
              </span>
              <span>Meu perfil foi aprovado</span>
            </label>
            {["Preenchi as informações essenciais", "Aceito os termos desta experiência"].map(
              (item) => (
                <label key={item}>
                  <input type="checkbox" defaultChecked />
                  <span className="check-control" aria-hidden="true">
                    <Check size={16} />
                  </span>
                  <span>{item}</span>
                </label>
              ),
            )}
            <label>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span className="check-control" aria-hidden="true">
                <Check size={16} />
              </span>
              <span>Confirmo que estou disponível para um relacionamento sério</span>
            </label>
          </div>
        )}
        {step >= 2 && step <= 6 && step !== 3 && (
          <div className="activation-options">
            {(step === 2
              ? ["Mulheres", "Homens"]
              : step === 4
                ? ["Baixada Santista", "Estado de São Paulo", "Outras regiões"]
                : step === 5
                  ? [
                      "Não tenho filhos e desejo ter",
                      "Tenho filhos",
                      "Não desejo ter filhos",
                      "Prefiro conversar sobre isso",
                    ]
                  : [
                      "A fé orienta minha rotina",
                      "Participo ativamente de uma igreja",
                      "Estou retomando minha caminhada",
                      "Prefiro contar com minhas palavras",
                    ]
            ).map((item) => (
              <button
                key={item}
                className={choice === item ? "selected" : ""}
                onClick={() => setChoice(item)}
              >
                <span>{choice === item && <Check size={15} />}</span>
                {item}
              </button>
            ))}
          </div>
        )}
        {step === 3 && (
          <section className="age-range-card" aria-labelledby="age-range-title">
            <div className="age-range-heading">
              <div>
                <span>Idade mínima</span>
                <strong>{ageMin} anos</strong>
              </div>
              <div>
                <span>Idade máxima</span>
                <strong>{ageMax} anos</strong>
              </div>
            </div>
            <p id="age-range-title">
              De {ageMin} a {ageMax} anos
            </p>
            <div className="dual-range" style={ageTrack}>
              <span className="dual-range-track" aria-hidden="true" />
              <input
                type="range"
                min="18"
                max="80"
                step="1"
                value={ageMin}
                aria-label="Idade mínima"
                aria-valuetext={`${ageMin} anos`}
                onChange={(event) => setAgeMin(Math.min(Number(event.target.value), ageMax - 1))}
                onPointerUp={ageHaptic}
                onKeyUp={ageHaptic}
              />
              <input
                type="range"
                min="18"
                max="80"
                step="1"
                value={ageMax}
                aria-label="Idade máxima"
                aria-valuetext={`${ageMax} anos`}
                onChange={(event) => setAgeMax(Math.max(Number(event.target.value), ageMin + 1))}
                onPointerUp={ageHaptic}
                onKeyUp={ageHaptic}
              />
            </div>
            <div className="age-range-limits" aria-hidden="true">
              <span>18 anos</span>
              <span>80 anos</span>
            </div>
          </section>
        )}
        {step === 7 && (
          <div className="romantic-profile-form">
            <label>
              Apresentação
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Conte o que você espera construir e o que valoriza..."
                maxLength={280}
              />
              <small>{bio.length}/280</small>
            </label>
            {prompts.map((value, index) => (
              <label key={index}>
                Prompt {index + 1}
                <input
                  value={value}
                  onChange={(event) =>
                    setPrompts((currentValues) =>
                      currentValues.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  placeholder={
                    [
                      "Um domingo ideal para mim...",
                      "Um valor indispensável...",
                      "Minha fé aparece quando...",
                    ][index]
                  }
                />
              </label>
            ))}
          </div>
        )}
        {step === 8 && (
          <div className="privacy-summary">
            <ShieldCheck size={30} />
            <strong>Separado da comunidade comum</strong>
            <span>
              Nada deste modo aparece na Home, Comunidade, Pessoas ou no seu Perfil comunitário.
            </span>
            {[
              "Mostrar Espaços em comum",
              "Permitir Recados anônimos",
              "Mostrar badge de perfil aprovado",
            ].map((item, index) => (
              <label key={item}>
                {item}
                <input type="checkbox" defaultChecked={index !== 1} />
              </label>
            ))}
          </div>
        )}
        {step === 9 && (
          <div className="activation-review">
            <span>
              <strong>Elegibilidade</strong>
              <small>Requisitos confirmados</small>
              <Check size={16} />
            </span>
            <span>
              <strong>Preferências</strong>
              <small>
                Mulheres · {ageMin}–{ageMax} · Baixada Santista
              </small>
              <Check size={16} />
            </span>
            <span>
              <strong>Família e fé</strong>
              <small>Informações preenchidas</small>
              <Check size={16} />
            </span>
            <span>
              <strong>Privacidade</strong>
              <small>Visível somente neste modo</small>
              <ShieldCheck size={16} />
            </span>
          </div>
        )}
      </main>
      <footer>
        <button
          className="activation-primary"
          disabled={(step === 1 && !accepted) || (step === 3 && !ageRangeValid)}
          onClick={next}
        >
          {step === activationSteps.length - 1 ? "Ativar Modo Namoro" : "Continuar"}{" "}
          <ChevronRight size={17} />
        </button>
        <button onClick={onClose}>Agora não</button>
      </footer>
    </div>
  );
}

function DatingContent({
  onClose,
  onOpenSettings,
  onOpenConversation,
  showToast,
}: {
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenConversation: (name: string) => void;
  showToast: (message: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [activating, setActivating] = useState(false);
  const [tab, setTab] = useState<DatingTab>("Descobrir");
  const [interestTab, setInterestTab] = useState<InterestTab>("Recebidos");
  const [selected, setSelected] = useState<Person>(people[0]);
  const [interestPerson, setInterestPerson] = useState<Person | null>(null);
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recadoOpen, setRecadoOpen] = useState(false);
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [demoState, setDemoState] = useState<DatingState>("inactive");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "datingState",
    ) as DatingState | null;
    if (!requested) return;
    const initialize = window.setTimeout(() => {
      setDemoState(requested);
      setActive(!["inactive", "ineligible"].includes(requested));
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

  const visiblePeople = useMemo(
    () => people.filter((person) => !hidden.includes(person.id)),
    [hidden],
  );

  if (activating) {
    return (
      <ActivationFlow
        onClose={() => setActivating(false)}
        onComplete={() => {
          setActive(true);
          setActivating(false);
          setDemoState("normal");
          showToast("Modo Namoro ativado");
        }}
      />
    );
  }

  if (!active || demoState === "inactive" || demoState === "ineligible") {
    return (
      <div className="dating-experience">
        <header className="dating-topbar">
          <button aria-label="Voltar para Explorar" onClick={onClose}>
            <ArrowLeft size={21} />
          </button>
          <h1>Modo Namoro</h1>
          <button aria-label="Configurações" onClick={onOpenSettings}>
            <MoreHorizontal size={21} />
          </button>
        </header>
        <main className="dating-inactive">
          <div className="dating-inactive-symbol">
            <HeartHandshake size={38} />
          </div>
          <span className="dating-overline">EXPERIÊNCIA OPCIONAL</span>
          <h2>Conhecer pessoas com propósito</h2>
          <p>
            Ative uma experiência voltada a relacionamentos cristãos sérios, separada da comunidade
            comum.
          </p>
          {demoState === "ineligible" ? (
            <div className="ineligible-state">
              <CircleAlert size={22} />
              <div>
                <strong>Falta concluir sua elegibilidade</strong>
                <span>Preencha as informações essenciais do Perfil antes de ativar.</span>
              </div>
              <button onClick={() => setDemoState("inactive")}>Revisar requisitos</button>
            </div>
          ) : (
            <>
              <div className="dating-principles">
                <span>
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Privado por padrão</strong>
                    <small>Nada romântico aparece fora deste modo.</small>
                  </div>
                </span>
                <span>
                  <Heart size={18} />
                  <div>
                    <strong>Interesse com respeito</strong>
                    <small>Sem swipe, ranking ou porcentagem.</small>
                  </div>
                </span>
                <span>
                  <UserRoundCheck size={18} />
                  <div>
                    <strong>Conexão mútua</strong>
                    <small>A conversa só começa quando ambos querem.</small>
                  </div>
                </span>
              </div>
              <button className="dating-primary" onClick={() => setActivating(true)}>
                Conhecer a experiência <ChevronRight size={18} />
              </button>
            </>
          )}
          <button className="dating-link" onClick={onOpenSettings}>
            Ver privacidade e requisitos
          </button>
        </main>
      </div>
    );
  }

  if (demoState === "error") throw new Error("Dating demo error");

  return (
    <div className="dating-experience">
      <header className="dating-topbar">
        <button aria-label="Voltar para Explorar" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Modo Namoro</h1>
          <span>{demoState === "paused" ? "Pausado" : "Ativo e privado"}</span>
        </div>
        <button aria-label="Pausar ou configurar" onClick={() => setPauseOpen(true)}>
          <MoreHorizontal size={21} />
        </button>
      </header>
      <nav className="dating-tabs" aria-label="Áreas do Modo Namoro">
        {(["Descobrir", "Interesses", "Conexões", "Recados"] as DatingTab[]).map((item) => (
          <button
            key={item}
            aria-current={tab === item ? "page" : undefined}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
            {item === "Interesses" && <i>2</i>}
          </button>
        ))}
      </nav>
      <div className="dating-layout">
        <main className="dating-main">
          {demoState === "offline" && (
            <div className="dating-status-banner">
              <WifiOff size={17} /> Você está offline. Mostrando perfis já carregados.
            </div>
          )}
          {demoState === "paused" && (
            <div className="dating-status-banner paused">
              <Pause size={17} /> Seu perfil não aparece em Descobrir. Suas conexões continuam
              disponíveis.
            </div>
          )}

          {tab === "Descobrir" && (
            <section className="dating-discover">
              <div className="dating-discover-heading">
                <div>
                  <span className="dating-overline">PARA CONHECER COM CALMA</span>
                  <h2>Pessoas com propósito</h2>
                </div>
                <button onClick={() => setFiltersOpen(true)}>
                  <Filter size={17} /> Filtros
                </button>
              </div>
              {demoState === "empty" || visiblePeople.length === 0 ? (
                <div className="dating-empty">
                  <Search size={28} />
                  <h2>Nenhuma recomendação agora</h2>
                  <p>Amplie sua região ou volte mais tarde. Não repetiremos pessoas ocultadas.</p>
                  <button
                    onClick={() => {
                      setHidden([]);
                      setDemoState("normal");
                    }}
                  >
                    Rever filtros
                  </button>
                </div>
              ) : (
                visiblePeople.map((person) => (
                  <article
                    className="dating-person-card"
                    key={person.id}
                    onClick={() => setSelected(person)}
                  >
                    <header>
                      <Avatar person={person} />
                      <div>
                        <h3>
                          {person.name}, {person.age}
                        </h3>
                        <span>
                          <MapPin size={13} /> {person.location}
                        </span>
                        <small>
                          <ShieldCheck size={13} /> Perfil aprovado
                        </small>
                      </div>
                      <button
                        aria-label={`Opções para ${person.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setHidden((current) => [...current, person.id]);
                          showToast("Pessoa ocultada por 90 dias");
                        }}
                      >
                        <EyeOff size={18} />
                      </button>
                    </header>
                    <p>{person.intro}</p>
                    <blockquote>“{person.prompts[0]}”</blockquote>
                    <div className="dating-facts">
                      <span>{person.children}</span>
                      <span>{person.family}</span>
                      <span>{person.faith}</span>
                    </div>
                    <div className="dating-interests">
                      {person.interests.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <small className="dating-context">
                      <UsersRound size={14} /> {person.context}
                    </small>
                    <footer>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setProfilePerson(person);
                        }}
                      >
                        Ver perfil
                      </button>
                      <button
                        className={sent.includes(person.id) ? "sent" : ""}
                        onClick={(event) => {
                          event.stopPropagation();
                          setInterestPerson(person);
                        }}
                      >
                        {sent.includes(person.id) ? (
                          <>
                            <Check size={17} /> Interesse enviado
                          </>
                        ) : (
                          <>
                            <Heart size={17} /> Demonstrar interesse
                          </>
                        )}
                      </button>
                    </footer>
                  </article>
                ))
              )}
            </section>
          )}

          {tab === "Interesses" && (
            <section className="dating-interest-view">
              <nav>
                {(["Recebidos", "Enviados"] as InterestTab[]).map((item) => (
                  <button
                    key={item}
                    className={interestTab === item ? "active" : ""}
                    onClick={() => setInterestTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </nav>
              {interestTab === "Recebidos" ? (
                <>
                  <article className="received-interest">
                    <header>
                      <Avatar person={people[1]} />
                      <div>
                        <strong>Marina Souza</strong>
                        <span>Enviado hoje · expira em 29 dias</span>
                      </div>
                    </header>
                    <blockquote>“Gostei do que você contou sobre família e propósito.”</blockquote>
                    <div>
                      <button
                        onClick={() => {
                          setTab("Conexões");
                          showToast("Interesse correspondido");
                        }}
                      >
                        Também tenho interesse
                      </button>
                      <button onClick={() => showToast("Marina ficará oculta por 90 dias")}>
                        Não tenho interesse
                      </button>
                    </div>
                  </article>
                  <article className="received-interest expired">
                    <header>
                      <Avatar person={people[2]} />
                      <div>
                        <strong>Beatriz Rocha</strong>
                        <span>Expirado há 2 dias</span>
                      </div>
                    </header>
                    <p>Este interesse expirou sem gerar insistência ou notificação adicional.</p>
                  </article>
                </>
              ) : sent.length ? (
                sent.map((id) => {
                  const person = people.find((item) => item.id === id)!;
                  return (
                    <article className="sent-interest" key={id}>
                      <Avatar person={person} />
                      <div>
                        <strong>{person.name}</strong>
                        <span>Pendente · expira em 30 dias</span>
                      </div>
                      <button
                        onClick={() => setSent((current) => current.filter((item) => item !== id))}
                      >
                        Cancelar
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="dating-empty compact">
                  <Clock3 size={27} />
                  <h2>Nenhum interesse enviado</h2>
                  <p>Quando alguém fizer sentido, demonstre interesse sem pressa.</p>
                </div>
              )}
            </section>
          )}

          {tab === "Conexões" && (
            <section className="connections-view">
              <div className="connection-celebration">
                <HeartHandshake size={31} />
                <span className="dating-overline">INTERESSE MÚTUO</span>
                <h2>Você e Ana querem se conhecer</h2>
                <p>A conexão abre uma conversa, não cria obrigação. Comecem com calma.</p>
              </div>
              <article className="connection-card">
                <Avatar person={people[0]} large />
                <div>
                  <strong>Ana Clara</strong>
                  <span>Santos, SP · conexão há 3 dias</span>
                </div>
                <button onClick={() => onOpenConversation("Ana Clara")}>
                  <MessageCircle size={17} /> Iniciar conversa
                </button>
                <button onClick={() => setCompatibilityOpen(true)}>
                  Compatibilidade descritiva
                </button>
                <button onClick={() => showToast("Presentes românticos abertos")}>
                  <Gift size={17} /> Enviar presente
                </button>
                <button onClick={() => setPurposeOpen(true)}>
                  <Sparkles size={17} /> Abrir Propósito
                </button>
              </article>
            </section>
          )}

          {tab === "Recados" && (
            <section className="anonymous-view">
              <header>
                <span className="anonymous-symbol">
                  <MessageCircle size={24} />
                </span>
                <div>
                  <span className="dating-overline">RECADO ANÔNIMO</span>
                  <h2>Uma conversa com duas pistas</h2>
                  <p>
                    A moderação conhece as identidades. A revelação só acontece se ambos aceitarem.
                  </p>
                </div>
              </header>
              <article className="anonymous-thread">
                <div className="anonymous-clues">
                  <span>
                    <i>1</i> Participa de um Espaço com você
                  </span>
                  <span>
                    <i>2</i> Também gosta de leitura
                  </span>
                </div>
                <div className="anonymous-messages">
                  <p>
                    Oi. Seu texto sobre recomeços me chamou atenção.<small>Mensagem 1 de 5</small>
                  </p>
                  <p className="mine">
                    Obrigado. O que mais fez sentido para você?<small>Sua mensagem 1 de 5</small>
                  </p>
                </div>
                <footer>
                  <span>Expira em 11 dias</span>
                  <button onClick={() => setRecadoOpen(true)}>Continuar conversa</button>
                </footer>
              </article>
              <div className="reveal-state">
                <ShieldCheck size={20} />
                <div>
                  <strong>Pedido de revelação pendente</strong>
                  <span>A identidade só aparece se os dois aceitarem.</span>
                </div>
                <button onClick={() => showToast("Você aceitou. Aguardando a outra pessoa.")}>
                  Aceitar
                </button>
              </div>
              <div className="anonymous-safety">
                <button>
                  <Flag size={16} /> Denunciar
                </button>
                <button>
                  <X size={16} /> Bloquear
                </button>
              </div>
            </section>
          )}
        </main>

        <aside className="dating-context-panel">
          <Avatar person={selected} large />
          <h2>
            {selected.name}, {selected.age}
          </h2>
          <span>
            <MapPin size={13} /> {selected.location}
          </span>
          <p>{selected.intro}</p>
          <div>
            {selected.interests.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <blockquote>“{selected.prompts[1]}”</blockquote>
          <button onClick={() => setProfilePerson(selected)}>Ver perfil romântico</button>
          <button className="secondary" onClick={() => setInterestPerson(selected)}>
            <Heart size={17} /> Demonstrar interesse
          </button>
        </aside>
      </div>

      {interestPerson && (
        <div className="dating-overlay" onMouseDown={() => setInterestPerson(null)}>
          <section className="dating-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2>Demonstrar interesse</h2>
              <button onClick={() => setInterestPerson(null)}>
                <X />
              </button>
            </header>
            <div className="interest-confirm">
              <Avatar person={interestPerson} large />
              <p>Seu interesse será enviado uma única vez e expirará em 30 dias.</p>
              <label>
                Mensagem curta opcional
                <textarea placeholder="Algo respeitoso que chamou sua atenção..." maxLength={180} />
              </label>
              <button
                onClick={() => {
                  setSent((current) =>
                    current.includes(interestPerson.id) ? current : [...current, interestPerson.id],
                  );
                  setInterestPerson(null);
                  showToast("Interesse enviado");
                }}
              >
                Confirmar interesse
              </button>
              <button onClick={() => setInterestPerson(null)}>Agora não</button>
            </div>
          </section>
        </div>
      )}

      {profilePerson && (
        <div className="dating-overlay" onMouseDown={() => setProfilePerson(null)}>
          <section
            className="dating-sheet dating-profile-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Perfil romântico</h2>
              <button onClick={() => setProfilePerson(null)}>
                <X />
              </button>
            </header>
            <div className="romantic-profile">
              <div className={`romantic-cover tone-${profilePerson.tone}`}>
                <Avatar person={profilePerson} large />
                <span>
                  <ShieldCheck size={14} /> Perfil aprovado
                </span>
              </div>
              <h2>
                {profilePerson.name}, {profilePerson.age}
              </h2>
              <span>
                <MapPin size={13} /> {profilePerson.location}
              </span>
              <p>{profilePerson.intro}</p>
              <div className="romantic-photos">
                <i />
                <i />
                <i />
                <i />
              </div>
              {profilePerson.prompts.map((prompt) => (
                <blockquote key={prompt}>“{prompt}”</blockquote>
              ))}
              <div className="romantic-details">
                <span>
                  <strong>Família</strong>
                  {profilePerson.children} · {profilePerson.family}
                </span>
                <span>
                  <strong>Fé</strong>
                  {profilePerson.faith}
                </span>
                <span>
                  <strong>Contexto permitido</strong>
                  {profilePerson.context}
                </span>
              </div>
              <button
                onClick={() => {
                  setProfilePerson(null);
                  setInterestPerson(profilePerson);
                }}
              >
                Demonstrar interesse
              </button>
            </div>
          </section>
        </div>
      )}

      {compatibilityOpen && (
        <div className="dating-overlay" onMouseDown={() => setCompatibilityOpen(false)}>
          <section className="dating-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2>Compatibilidade para conversar</h2>
              <button onClick={() => setCompatibilityOpen(false)}>
                <X />
              </button>
            </header>
            <div className="compatibility-list">
              {[
                ["Interesses", "Leitura, cinema e passeios tranquilos."],
                ["Valores", "Família, honestidade e serviço."],
                ["Rotina", "Ambos valorizam domingos com comunidade e família."],
                ["Visão de família", "Desejo de construir uma família com diálogo."],
                ["Fé", "A fé participa das decisões do cotidiano."],
                ["Comunicação", "Preferência por conversas diretas e gentis."],
                [
                  "Pontos para conversar",
                  "Cidade, ritmo da rotina e planos para os próximos anos.",
                ],
              ].map(([title, copy]) => (
                <span key={title}>
                  <Check size={15} />
                  <div>
                    <strong>{title}</strong>
                    <small>{copy}</small>
                  </div>
                </span>
              ))}
            </div>
          </section>
        </div>
      )}

      {filtersOpen && (
        <div className="dating-overlay" onMouseDown={() => setFiltersOpen(false)}>
          <section className="dating-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2>Filtros respeitosos</h2>
              <button onClick={() => setFiltersOpen(false)}>
                <X />
              </button>
            </header>
            <div className="dating-filters">
              {[
                "Idade · 24 a 34",
                "Cidade · Peruíbe e Santos",
                "Estado · São Paulo",
                "Região · Baixada Santista",
                "Filhos · Todos",
                "Desejo de filhos · Compatível",
                "Interesses · Leitura e Cinema",
                "Contexto comunitário · Permitido",
              ].map((item) => (
                <button key={item}>
                  {item}
                  <ChevronRight size={17} />
                </button>
              ))}
              <p>Aparência, altura, peso, renda, estado civil e ranking não são filtros.</p>
              <button
                className="dating-primary"
                onClick={() => {
                  setFiltersOpen(false);
                  showToast("Filtros aplicados");
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </section>
        </div>
      )}

      {pauseOpen && (
        <div className="dating-overlay" onMouseDown={() => setPauseOpen(false)}>
          <section className="dating-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2>Controle do Modo Namoro</h2>
              <button onClick={() => setPauseOpen(false)}>
                <X />
              </button>
            </header>
            <div className="pause-actions">
              <button
                onClick={() => {
                  setDemoState("paused");
                  setPauseOpen(false);
                }}
              >
                <Pause />
                <div>
                  <strong>Pausar</strong>
                  <span>Mantém dados e conexões, mas tira você da descoberta.</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActive(false);
                  setDemoState("inactive");
                  setPauseOpen(false);
                }}
              >
                <EyeOff />
                <div>
                  <strong>Desativar</strong>
                  <span>Encerra interesses pendentes sem afetar o Perfil comunitário.</span>
                </div>
              </button>
              <button onClick={onOpenSettings}>
                <ShieldCheck />
                <div>
                  <strong>Privacidade e preferências</strong>
                  <span>Controle tudo nas Configurações.</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      )}

      {recadoOpen && (
        <div className="dating-overlay" onMouseDown={() => setRecadoOpen(false)}>
          <section className="dating-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2>Recado anônimo</h2>
              <button onClick={() => setRecadoOpen(false)}>
                <X />
              </button>
            </header>
            <div className="anonymous-composer">
              <p>Somente texto. Sem imagem, áudio ou link.</p>
              <textarea placeholder="Escreva uma mensagem respeitosa..." maxLength={280} />
              <span>2 de 5 mensagens restantes</span>
              <button
                onClick={() => {
                  setRecadoOpen(false);
                  showToast("Recado enviado");
                }}
              >
                Enviar recado
              </button>
            </div>
          </section>
        </div>
      )}

      {purposeOpen && (
        <div className="dating-overlay" onMouseDown={() => setPurposeOpen(false)}>
          <section
            className="dating-sheet purpose-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Propósito</h2>
              <button onClick={() => setPurposeOpen(false)}>
                <X />
              </button>
            </header>
            <div>
              <HeartHandshake size={34} />
              <h3>Antonio & Ana</h3>
              <p>Um espaço compartilhado, privado e construído somente após uma conexão mútua.</p>
              <button onClick={() => showToast("Registro importante criado")}>
                Adicionar registro importante
              </button>
              <span>
                <Pause size={15} /> Pausa de 7 dias disponível
              </span>
              <span>
                <ShieldCheck size={15} /> Encerramento unilateral possível
              </span>
              <small>Após encerrar, o arquivo fica somente leitura por 30 dias.</small>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function DatingExperience(props: {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenConversation: (name: string) => void;
  showToast: (message: string) => void;
}) {
  if (!props.visible) return <div className="dating-experience is-hidden" aria-hidden="true" />;
  return (
    <DatingBoundary onClose={props.onClose}>
      <DatingContent {...props} />
    </DatingBoundary>
  );
}
