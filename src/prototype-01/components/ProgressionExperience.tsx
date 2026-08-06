"use client";

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  EyeOff,
  Gift,
  HeartHandshake,
  History,
  Medal,
  PackageOpen,
  PawPrint,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Store,
  Target,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useState } from "react";
import "../styles/ProgressionExperience.css";

type ProgressTab = "Hoje" | "Conquistas" | "Missões" | "Coleções" | "Histórico";
type MissionState = "ativa" | "concluída" | "dispensada" | "expirada";

const tabs: ProgressTab[] = ["Hoje", "Conquistas", "Missões", "Coleções", "Histórico"];
const categories = [
  "Todas",
  "Comunidade",
  "Amizades",
  "Verbo",
  "Cinema",
  "Pets",
  "Arcade",
  "Eventos",
  "Perfil",
  "Loja",
  "Segurança e cuidado",
];

const achievements = [
  {
    id: "acolhida",
    name: "Primeira acolhida",
    description: "Participou de uma conversa com cuidado.",
    category: "Comunidade",
    progress: 100,
    reward: "Badge Acolhida",
    rarity: "Marco",
    state: "concluída",
    date: "27 jul",
  },
  {
    id: "joao",
    name: "Caminhada em João",
    description: "Avance na leitura no seu próprio ritmo.",
    category: "Verbo",
    progress: 68,
    reward: "Fundo Manhã Serena",
    rarity: "Coleção",
    state: "em andamento",
  },
  {
    id: "bento",
    name: "Companhia fiel",
    description: "Cuide do Bento e conheça o habitat.",
    category: "Pets",
    progress: 75,
    reward: "Item de Pet",
    rarity: "Especial",
    state: "em andamento",
  },
  {
    id: "cinema",
    name: "Sessão em comunidade",
    description: "Participe de uma sessão do Cinema.",
    category: "Cinema",
    progress: 0,
    reward: "Moldura Cinema",
    rarity: "Evento",
    state: "limitada",
  },
  {
    id: "segredo",
    name: "Uma surpresa gentil",
    description: "Continue explorando para descobrir.",
    category: "Amizades",
    progress: 0,
    reward: "Recompensa secreta",
    rarity: "Secreta",
    state: "secreta",
  },
  {
    id: "cuidado",
    name: "Cuidado com a comunidade",
    description: "Conheça as ferramentas de segurança.",
    category: "Segurança e cuidado",
    progress: 0,
    reward: "Badge Cuidado",
    rarity: "Marco",
    state: "bloqueada",
  },
];

const initialMissions = [
  {
    id: "conversation",
    title: "Participe de uma conversa",
    copy: "Uma troca leve em qualquer Espaço.",
    type: "Diária leve",
    category: "Comunidade",
    progress: 0,
    total: 1,
    reward: "40 moedas visuais",
    time: "Até amanhã",
    state: "ativa" as MissionState,
  },
  {
    id: "reading",
    title: "Continue uma leitura",
    copy: "Retome João 8 quando fizer sentido.",
    type: "Diária leve",
    category: "Verbo",
    progress: 0,
    total: 1,
    reward: "Badge de coleção",
    time: "Até amanhã",
    state: "ativa" as MissionState,
  },
  {
    id: "save",
    title: "Salve algo para depois",
    copy: "Guarde uma publicação que fez bem.",
    type: "Diária leve",
    category: "Comunidade",
    progress: 0,
    total: 1,
    reward: "20 moedas visuais",
    time: "Até amanhã",
    state: "ativa" as MissionState,
  },
  {
    id: "weekly",
    title: "Explore três experiências",
    copy: "Verbo, Cinema, Pet, Arcade ou Eventos.",
    type: "Semanal",
    category: "Perfil",
    progress: 2,
    total: 3,
    reward: "Caixa Caminhos",
    time: "5 dias restantes",
    state: "ativa" as MissionState,
  },
  {
    id: "community",
    title: "Apoie um pedido de oração",
    copy: "Acompanhamento pessoal, sem comparar bondade.",
    type: "Comunitária",
    category: "Amizades",
    progress: 1,
    total: 2,
    reward: "Aura Esperança",
    time: "Nesta semana",
    state: "ativa" as MissionState,
  },
];

const collections = [
  {
    name: "Primeiros passos",
    owned: 4,
    total: 6,
    reward: "Badge Começo",
    period: "Permanente",
    origin: "Participação",
  },
  {
    name: "Caminhada no Verbo",
    owned: 7,
    total: 12,
    reward: "Fundo Manhã Serena",
    period: "Sem prazo",
    origin: "Verbo",
  },
  {
    name: "Cinema em comunidade",
    owned: 2,
    total: 5,
    reward: "Moldura Projetor",
    period: "Temporada atual",
    origin: "Cinema",
  },
  {
    name: "Companhia do Bento",
    owned: 5,
    total: 8,
    reward: "Habitat Jardim",
    period: "Permanente",
    origin: "Pets",
  },
];

class ProgressionBoundary extends Component<
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
      <div className="progression-local-error" role="alert">
        <CircleAlert />
        <h2>O progresso não pôde ser aberto</h2>
        <p>As outras áreas continuam funcionando normalmente.</p>
        <button onClick={() => this.setState({ failed: false })}>
          <RefreshCw /> Tentar novamente
        </button>
        <button onClick={this.props.onClose}>Voltar</button>
      </div>
    );
  }
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-line" aria-label={`${label}: ${value}%`}>
      <span>
        <i style={{ width: `${value}%` }} />
      </span>
      <small>{value}%</small>
    </div>
  );
}

function ProgressionContent({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<ProgressTab>(() => {
    if (typeof window === "undefined") return "Hoje";
    return (window.sessionStorage.getItem("vdn-progress-tab") as ProgressTab) ?? "Hoje";
  });
  const [category, setCategory] = useState("Todas");
  const [selectedAchievement, setSelectedAchievement] = useState<
    (typeof achievements)[number] | null
  >(null);
  const [selectedMission, setSelectedMission] = useState<(typeof initialMissions)[number] | null>(
    null,
  );
  const [selectedCollection, setSelectedCollection] = useState<(typeof collections)[number] | null>(
    null,
  );
  const [missions, setMissions] = useState(initialMissions);
  const [rewardAvailable, setRewardAvailable] = useState(true);
  const [unlock, setUnlock] = useState(false);
  const [profileHighlights, setProfileHighlights] = useState<string[]>(["acolhida"]);
  const [badge, setBadge] = useState("Acolhida");
  const [historyFilter, setHistoryFilter] = useState("Tudo");

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem("vdn-progress-tab", tab);
  }, [tab, visible]);

  const filteredAchievements = useMemo(
    () => achievements.filter((item) => category === "Todas" || item.category === category),
    [category],
  );
  const daily = missions.filter((mission) => mission.type === "Diária leve").slice(0, 3);
  const weekly = missions.filter((mission) => mission.type !== "Diária leve");

  const updateMission = (id: string, state: MissionState) => {
    setMissions((current) =>
      current.map((mission) =>
        mission.id === id
          ? {
              ...mission,
              state,
              progress: state === "concluída" ? mission.total : mission.progress,
            }
          : mission,
      ),
    );
    setSelectedMission(null);
    if (state === "concluída") {
      setRewardAvailable(true);
      setUnlock(true);
    }
    showToast(
      state === "dispensada" ? "Missão dispensada sem penalidade" : "Progresso visual atualizado",
    );
  };

  const replaceMission = (id: string) => {
    setMissions((current) =>
      current.map((mission) =>
        mission.id === id
          ? {
              ...mission,
              title: "Visite um Espaço",
              copy: "Conheça uma conversa da comunidade.",
              category: "Comunidade",
              progress: 0,
              total: 1,
              state: "ativa",
            }
          : mission,
      ),
    );
    setSelectedMission(null);
    showToast("Missão substituída. Seu progresso continua guardado");
  };

  if (!visible) return <div className="progression-experience is-hidden" aria-hidden="true" />;

  return (
    <div className="progression-experience">
      <header className="progression-topbar">
        <button aria-label="Voltar para a origem" onClick={onClose}>
          <ArrowLeft />
        </button>
        <div>
          <Trophy />
          <span>
            <small>SEU CAMINHO</small>
            <h1>Progresso</h1>
          </span>
        </div>
        <button aria-label="Abrir histórico" onClick={() => setTab("Histórico")}>
          <History />
        </button>
      </header>

      <nav className="progression-tabs" aria-label="Áreas de progresso">
        {tabs.map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="progression-layout">
        <aside className="progression-categories" aria-label="Categorias">
          <span>CATEGORIAS</span>
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
              <ChevronRight />
            </button>
          ))}
        </aside>

        <main className="progression-content">
          {tab === "Hoje" && (
            <>
              <section className="progression-hero">
                <div>
                  <span>NÍVEL PESSOAL 8</span>
                  <h2>Uma caminhada feita no seu ritmo.</h2>
                  <p>Continue quando fizer sentido. Seu progresso continua guardado.</p>
                </div>
                <div className="level-medal">
                  <Trophy />
                  <strong>8</strong>
                  <small>participação</small>
                </div>
                <ProgressBar value={62} label="Progresso de participação" />
                <div className="progression-stats">
                  <span>
                    <strong>7</strong>
                    <small>categorias exploradas</small>
                  </span>
                  <span>
                    <strong>12</strong>
                    <small>marcos recentes</small>
                  </span>
                  <span>
                    <strong>3</strong>
                    <small>coleções ativas</small>
                  </span>
                </div>
              </section>

              <section className="today-grid">
                <button
                  className="today-focus"
                  onClick={() => {
                    setTab("Missões");
                    setSelectedMission(missions[3]);
                  }}
                >
                  <span>
                    <Target /> MISSÃO ATUAL
                  </span>
                  <h3>Explore três experiências</h3>
                  <p>Você já conheceu 2 de 3 áreas.</p>
                  <ProgressBar value={67} label="Missão semanal" />
                  <strong>
                    Continuar <ChevronRight />
                  </strong>
                </button>
                <button
                  onClick={() => {
                    setTab("Conquistas");
                    setSelectedAchievement(achievements[1]);
                  }}
                >
                  <Medal />
                  <span>
                    <small>CONQUISTA PRÓXIMA</small>
                    <strong>Caminhada em João</strong>
                    <em>68% concluído</em>
                  </span>
                  <ChevronRight />
                </button>
                <button
                  onClick={() =>
                    rewardAvailable ? setRewardAvailable(false) : setTab("Histórico")
                  }
                >
                  <Gift />
                  <span>
                    <small>RECOMPENSA</small>
                    <strong>
                      {rewardAvailable ? "Pronta para coletar" : "Coletada com cuidado"}
                    </strong>
                    <em>{rewardAvailable ? "Badge Acolhida" : "Ver no histórico"}</em>
                  </span>
                  <ChevronRight />
                </button>
                <button onClick={() => showToast("Espaço Café, Bíblia & Amizade aberto")}>
                  <UsersRound />
                  <span>
                    <small>RECOMENDADO</small>
                    <strong>Visite uma conversa leve</strong>
                    <em>Sem prazo e sem pressão</em>
                  </span>
                  <ChevronRight />
                </button>
              </section>
            </>
          )}

          {tab === "Conquistas" && (
            <>
              <header className="progression-section-heading">
                <div>
                  <span>CONQUISTAS</span>
                  <h2>Marcos da sua participação</h2>
                  <p>Raridade descreve o item, nunca o valor de uma pessoa.</p>
                </div>
                <button onClick={() => setCategory("Todas")}>Limpar filtro</button>
              </header>
              <div className="progression-mobile-categories">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={category === item ? "active" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="achievement-grid">
                {filteredAchievements.map((item) => (
                  <button
                    key={item.id}
                    className={`achievement-card state-${item.state.replaceAll(" ", "-")}`}
                    onClick={() => setSelectedAchievement(item)}
                  >
                    <span className="achievement-icon">
                      {item.state === "secreta" ? (
                        <EyeOff />
                      ) : item.state === "concluída" ? (
                        <Check />
                      ) : (
                        <Medal />
                      )}
                    </span>
                    <span className="achievement-copy">
                      <small>
                        {item.category} · {item.rarity}
                      </small>
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                      <ProgressBar value={item.progress} label={item.name} />
                      <em>
                        {item.state}
                        {item.date ? ` · ${item.date}` : ""}
                      </em>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "Missões" && (
            <>
              <header className="progression-section-heading">
                <div>
                  <span>MISSÕES</span>
                  <h2>Pequenos convites, nunca cobranças</h2>
                  <p>Não concluir uma missão não reduz seu progresso.</p>
                </div>
              </header>
              <section className="mission-section">
                <div className="mission-title">
                  <div>
                    <Clock3 />
                    <span>
                      <strong>Diárias leves</strong>
                      <small>No máximo três · podem ser dispensadas</small>
                    </span>
                  </div>
                  <span>{daily.filter((item) => item.state === "concluída").length}/3</span>
                </div>
                <div className="mission-list">
                  {daily.map((mission) => (
                    <button key={mission.id} onClick={() => setSelectedMission(mission)}>
                      <span className={`mission-state state-${mission.state}`}>
                        <Target />
                      </span>
                      <span>
                        <small>
                          {mission.type} · {mission.time}
                        </small>
                        <strong>{mission.title}</strong>
                        <p>{mission.copy}</p>
                        <ProgressBar
                          value={mission.progress === mission.total ? 100 : 0}
                          label={mission.title}
                        />
                        <em>
                          {mission.state} · {mission.reward}
                        </em>
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </section>
              <section className="mission-section">
                <div className="mission-title">
                  <div>
                    <CalendarDays />
                    <span>
                      <strong>Semanais e comunitárias</strong>
                      <small>Sem exigir atividade diária contínua</small>
                    </span>
                  </div>
                </div>
                <div className="mission-list">
                  {weekly.map((mission) => (
                    <button key={mission.id} onClick={() => setSelectedMission(mission)}>
                      <span className="mission-state">
                        <HeartHandshake />
                      </span>
                      <span>
                        <small>
                          {mission.type} · {mission.time}
                        </small>
                        <strong>{mission.title}</strong>
                        <p>{mission.copy}</p>
                        <ProgressBar
                          value={Math.round((mission.progress / mission.total) * 100)}
                          label={mission.title}
                        />
                        <em>
                          {mission.progress}/{mission.total} · {mission.reward}
                        </em>
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === "Coleções" && (
            <>
              <header className="progression-section-heading">
                <div>
                  <span>COLEÇÕES</span>
                  <h2>Histórias construídas aos poucos</h2>
                  <p>Conjuntos de badges, itens e marcos pessoais.</p>
                </div>
              </header>
              <div className="progress-collections">
                {collections.map((collection) => (
                  <button key={collection.name} onClick={() => setSelectedCollection(collection)}>
                    <PackageOpen />
                    <span>
                      <small>
                        {collection.origin} · {collection.period}
                      </small>
                      <strong>{collection.name}</strong>
                      <p>
                        {collection.owned} de {collection.total} itens
                      </p>
                      <ProgressBar
                        value={Math.round((collection.owned / collection.total) * 100)}
                        label={collection.name}
                      />
                      <em>Recompensa: {collection.reward}</em>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "Histórico" && (
            <>
              <header className="progression-section-heading">
                <div>
                  <span>HISTÓRICO</span>
                  <h2>Seu caminho recente</h2>
                  <p>Uma linha do tempo simples, sem calendário complexo.</p>
                </div>
              </header>
              <div className="history-filters">
                {["Tudo", "7 dias", "Conquistas", "Missões", "Recompensas"].map((filter) => (
                  <button
                    key={filter}
                    className={historyFilter === filter ? "active" : ""}
                    onClick={() => setHistoryFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="progress-history">
                {[
                  {
                    date: "Hoje",
                    action: "Recompensa coletada",
                    title: "Badge Acolhida",
                    icon: Gift,
                  },
                  {
                    date: "27 jul",
                    action: "Conquista obtida",
                    title: "Primeira acolhida",
                    icon: Trophy,
                  },
                  {
                    date: "26 jul",
                    action: "Missão concluída",
                    title: "Cuidar do Bento",
                    icon: PawPrint,
                  },
                  {
                    date: "24 jul",
                    action: "Coleção avançou",
                    title: "Caminhada no Verbo",
                    icon: BookOpen,
                  },
                  {
                    date: "21 jul",
                    action: "Marco de segurança",
                    title: "Conta protegida",
                    icon: ShieldCheck,
                  },
                ].map(({ date, action, title, icon: RowIcon }) => (
                  <article key={`${date}-${title}`}>
                    <span>
                      <RowIcon />
                    </span>
                    <div>
                      <small>{date}</small>
                      <strong>{title}</strong>
                      <p>{action}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        <aside
          className={`progression-detail ${selectedAchievement || selectedMission || selectedCollection ? "open" : ""}`}
        >
          {(selectedAchievement || selectedMission || selectedCollection) && (
            <>
              <header>
                <button
                  aria-label="Voltar ao conteúdo"
                  onClick={() => {
                    setSelectedAchievement(null);
                    setSelectedMission(null);
                    setSelectedCollection(null);
                  }}
                >
                  <ArrowLeft />
                </button>
                <strong>Detalhes</strong>
                <button
                  aria-label="Fechar detalhes"
                  onClick={() => {
                    setSelectedAchievement(null);
                    setSelectedMission(null);
                    setSelectedCollection(null);
                  }}
                >
                  <X />
                </button>
              </header>
              {selectedAchievement && (
                <div className="detail-body">
                  <span className="detail-emblem">
                    <Medal />
                  </span>
                  <small>
                    {selectedAchievement.category} · {selectedAchievement.rarity}
                  </small>
                  <h2>{selectedAchievement.name}</h2>
                  <p>{selectedAchievement.description}</p>
                  <ProgressBar
                    value={selectedAchievement.progress}
                    label={selectedAchievement.name}
                  />
                  <dl>
                    <div>
                      <dt>Estado</dt>
                      <dd>{selectedAchievement.state}</dd>
                    </div>
                    <div>
                      <dt>Recompensa visual</dt>
                      <dd>{selectedAchievement.reward}</dd>
                    </div>
                  </dl>
                  <button
                    className="primary-detail-action"
                    disabled={
                      selectedAchievement.state !== "concluída" ||
                      (profileHighlights.length >= 3 &&
                        !profileHighlights.includes(selectedAchievement.id))
                    }
                    onClick={() => {
                      setProfileHighlights((current) =>
                        current.includes(selectedAchievement.id)
                          ? current.filter((id) => id !== selectedAchievement.id)
                          : [...current, selectedAchievement.id],
                      );
                      showToast("Destaques do Perfil atualizados visualmente");
                    }}
                  >
                    {profileHighlights.includes(selectedAchievement.id)
                      ? "Remover do Perfil"
                      : "Adicionar ao Perfil"}
                  </button>
                  <button
                    onClick={() => {
                      setBadge(selectedAchievement.name);
                      window.dispatchEvent(
                        new CustomEvent("vdn-open-profile-studio", {
                          detail: { tab: "Vitrine", source: "Progresso" },
                        }),
                      );
                    }}
                  >
                    Abrir Estúdio · badge {badge}
                  </button>
                </div>
              )}
              {selectedMission && (
                <div className="detail-body">
                  <span className="detail-emblem">
                    <Target />
                  </span>
                  <small>
                    {selectedMission.type} · {selectedMission.time}
                  </small>
                  <h2>{selectedMission.title}</h2>
                  <p>{selectedMission.copy}</p>
                  <ProgressBar
                    value={Math.round((selectedMission.progress / selectedMission.total) * 100)}
                    label={selectedMission.title}
                  />
                  <dl>
                    <div>
                      <dt>Recompensa</dt>
                      <dd>{selectedMission.reward}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>{selectedMission.state}</dd>
                    </div>
                  </dl>
                  {selectedMission.state === "ativa" && (
                    <>
                      <button
                        className="primary-detail-action"
                        onClick={() => updateMission(selectedMission.id, "concluída")}
                      >
                        <Check /> Concluir visualmente
                      </button>
                      <button onClick={() => updateMission(selectedMission.id, "dispensada")}>
                        Dispensar sem penalidade
                      </button>
                      <button onClick={() => replaceMission(selectedMission.id)}>
                        <RotateCcw /> Substituir missão
                      </button>
                    </>
                  )}
                </div>
              )}
              {selectedCollection && (
                <div className="detail-body">
                  <span className="detail-emblem">
                    <PackageOpen />
                  </span>
                  <small>
                    {selectedCollection.origin} · {selectedCollection.period}
                  </small>
                  <h2>{selectedCollection.name}</h2>
                  <p>
                    {selectedCollection.owned} de {selectedCollection.total} itens encontrados.
                  </p>
                  <ProgressBar
                    value={Math.round((selectedCollection.owned / selectedCollection.total) * 100)}
                    label={selectedCollection.name}
                  />
                  <dl>
                    <div>
                      <dt>Recompensa</dt>
                      <dd>{selectedCollection.reward}</dd>
                    </div>
                    <div>
                      <dt>Origem</dt>
                      <dd>{selectedCollection.origin}</dd>
                    </div>
                  </dl>
                  <button
                    className="primary-detail-action"
                    onClick={() => showToast("Coleção aberta no Inventário")}
                  >
                    <Store /> Ver no Inventário
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      {unlock && (
        <div className="achievement-unlock" role="status">
          <span>
            <BadgeCheck />
          </span>
          <div>
            <small>CONQUISTA DESBLOQUEADA</small>
            <strong>Um passo de cada vez</strong>
            <p>Missão concluída · recompensa visual disponível</p>
          </div>
          <button
            onClick={() => {
              setUnlock(false);
              setTab("Conquistas");
            }}
          >
            Ver detalhes
          </button>
          <button aria-label="Fechar" onClick={() => setUnlock(false)}>
            <X />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProgressionExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <ProgressionBoundary onClose={props.onClose}>
      <ProgressionContent {...props} />
    </ProgressionBoundary>
  );
}
