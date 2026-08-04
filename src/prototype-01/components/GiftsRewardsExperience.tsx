"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Gift,
  Heart,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trophy,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useState } from "react";
import "../styles/GiftsRewardsExperience.css";

export type GiftsTab = "Recebidos" | "Enviados" | "Caixas" | "Recompensas" | "Histórico";
export type GiftsAction = "none" | "send";

const tabs: GiftsTab[] = ["Recebidos", "Enviados", "Caixas", "Recompensas", "Histórico"];

const initialReceived = [
  {
    id: "luz",
    sender: "Ana Clara",
    item: "Luz de Encontro",
    type: "Aura social",
    message: "Lembrei da nossa conversa sobre João.",
    origin: "Conversa",
    date: "Hoje · 14:32",
    state: "pendente",
    compatibility: "Perfil e Momentos",
    romantic: false,
  },
  {
    id: "bento",
    sender: "Lucas Almeida",
    item: "Lenço Costa Serena",
    type: "Item de Pet",
    message: "Para o Bento ficar elegante.",
    origin: "Pets",
    date: "Ontem",
    state: "aceito",
    compatibility: "Bento · acessórios",
    romantic: false,
  },
  {
    id: "flor",
    sender: "Marina Souza",
    item: "Flor Efêmera",
    type: "Presente romântico efêmero",
    message: "Um gesto discreto.",
    origin: "Modo Namoro",
    date: "24 jul",
    state: "expirado",
    compatibility: "Modo Namoro ativo",
    romantic: true,
  },
];

const initialSent = [
  {
    id: "horizonte",
    recipient: "Ana Clara",
    item: "Moldura Horizonte Coral",
    date: "Hoje · 12:10",
    state: "aguardando",
  },
  {
    id: "sticker",
    recipient: "Lucas Almeida",
    item: "Sticker Luz Amiga",
    date: "26 jul",
    state: "aceito",
  },
  {
    id: "garden",
    recipient: "Marina Souza",
    item: "Mini Jardim",
    date: "22 jul",
    state: "recusado",
  },
];

const boxes = [
  {
    id: "caminhos",
    name: "Caixa Caminhos",
    origin: "Missão semanal",
    quantity: 2,
    guarantee: "Ao menos um item especial em 5 caixas",
    pity: "2 de 5 para a garantia",
    state: "disponível",
    probabilities: ["Comum · 55%", "Especial · 30%", "Raro · 12%", "Épico · 3%"],
    possible: ["Sticker Luz Amiga", "Fundo Manhã Serena", "Moldura Horizonte"],
  },
  {
    id: "cinema",
    name: "Caixa Cinema",
    origin: "Evento da comunidade",
    quantity: 1,
    guarantee: "Um item da coleção Cinema",
    pity: "Garantia desta caixa",
    state: "evento",
    probabilities: ["Comum · 50%", "Especial · 35%", "Raro · 15%"],
    possible: ["Ingresso de Perfil", "Aura Projetor", "Badge Sessão"],
  },
  {
    id: "welcome",
    name: "Boas-vindas",
    origin: "Primeiros passos",
    quantity: 0,
    guarantee: "Concluída",
    pity: "Sem caixas restantes",
    state: "aberta",
    probabilities: ["Item recebido · 100%"],
    possible: ["Badge Começo"],
  },
];

const initialRewards = [
  {
    id: "mission",
    origin: "Missão",
    item: "Caixa Caminhos",
    deadline: "5 dias",
    state: "disponível",
  },
  {
    id: "achievement",
    origin: "Conquista",
    item: "Badge Acolhida",
    deadline: "Sem prazo",
    state: "disponível",
  },
  {
    id: "maintenance",
    origin: "Manutenção",
    item: "80 moedas visuais",
    deadline: "30 dias",
    state: "coletada",
  },
  {
    id: "cinema",
    origin: "Cinema",
    item: "Sticker Sessão",
    deadline: "Expirou em 25 jul",
    state: "expirada",
  },
];

class GiftsBoundary extends Component<
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
      <div className="gifts-local-error" role="alert">
        <CircleAlert />
        <h2>Presentes está temporariamente indisponível</h2>
        <p>Loja, Inventário e as outras áreas continuam funcionando.</p>
        <button onClick={() => this.setState({ failed: false })}>
          <RefreshCw /> Tentar novamente
        </button>
        <button onClick={this.props.onClose}>Voltar</button>
      </div>
    );
  }
}

function GiftArt({ label, kind = "gift" }: { label: string; kind?: "gift" | "box" | "reward" }) {
  return (
    <div className={`gift-art kind-${kind}`}>
      <span>{kind === "box" ? <Box /> : kind === "reward" ? <Trophy /> : <Gift />}</span>
      <strong>{label}</strong>
    </div>
  );
}

function GiftsContent({
  visible,
  initialTab,
  initialAction,
  initialItem,
  onClose,
  showToast,
}: {
  visible: boolean;
  initialTab: GiftsTab;
  initialAction: GiftsAction;
  initialItem?: string;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<GiftsTab>(() => {
    if (typeof window === "undefined") return initialTab;
    return (window.sessionStorage.getItem("vdn-gifts-tab") as GiftsTab) ?? initialTab;
  });
  const [received, setReceived] = useState(initialReceived);
  const [sent, setSent] = useState(initialSent);
  const [rewards, setRewards] = useState(initialRewards);
  const [selectedReceived, setSelectedReceived] = useState<(typeof initialReceived)[number] | null>(
    null,
  );
  const [selectedSent, setSelectedSent] = useState<(typeof initialSent)[number] | null>(null);
  const [selectedBox, setSelectedBox] = useState<(typeof boxes)[number] | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendStep, setSendStep] = useState(1);
  const [sendItem, setSendItem] = useState(initialItem ?? "Luz de Encontro");
  const [recipient, setRecipient] = useState("Ana Clara");
  const [message, setMessage] = useState("");
  const [confirmRefusal, setConfirmRefusal] = useState(false);
  const [boxStage, setBoxStage] = useState<"detail" | "opening" | "result">("detail");
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"idle" | "valid" | "invalid" | "expired" | "used">(
    "idle",
  );
  const [inventoryResult, setInventoryResult] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState("Tudo");

  useEffect(() => {
    if (!visible) return;
    const initialize = window.setTimeout(() => {
      setTab(initialTab);
      if (initialAction === "send") {
        setSendItem(initialItem ?? "Luz de Encontro");
        setSendStep(1);
        setSendOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(initialize);
  }, [visible, initialTab, initialAction, initialItem]);

  useEffect(() => {
    if (visible) window.sessionStorage.setItem("vdn-gifts-tab", tab);
  }, [tab, visible]);

  const commonReceived = useMemo(() => received.filter((item) => !item.romantic), [received]);
  const romanticReceived = useMemo(() => received.filter((item) => item.romantic), [received]);

  const acceptGift = (id: string) => {
    const item = received.find((candidate) => candidate.id === id);
    setReceived((current) =>
      current.map((candidate) =>
        candidate.id === id ? { ...candidate, state: "aceito" } : candidate,
      ),
    );
    setSelectedReceived(null);
    setInventoryResult(item?.item ?? "Novo item");
    showToast("Presente aceito e marcado como Novo no Inventário");
  };

  const refuseGift = (id: string) => {
    setReceived((current) =>
      current.map((candidate) =>
        candidate.id === id ? { ...candidate, state: "recusado" } : candidate,
      ),
    );
    setConfirmRefusal(false);
    setSelectedReceived(null);
    showToast("Presente recusado sem mensagem de culpa");
  };

  const cancelSent = (id: string) => {
    setSent((current) =>
      current.map((item) => (item.id === id ? { ...item, state: "cancelado" } : item)),
    );
    setSelectedSent(null);
    showToast("Envio cancelado visualmente");
  };

  const finishSend = () => {
    setSent((current) => [
      { id: `sent-${Date.now()}`, recipient, item: sendItem, date: "Agora", state: "aguardando" },
      ...current,
    ]);
    setSendOpen(false);
    setSendStep(1);
    setTab("Enviados");
    showToast("Presente demonstrativo enviado");
  };

  const openBox = () => {
    setBoxStage("opening");
    window.setTimeout(
      () => {
        setBoxStage("result");
        setInventoryResult("Aura Horizonte Calmo");
      },
      document.documentElement.dataset.reduceMotion === "true" ? 80 : 650,
    );
  };

  const collectReward = (id: string) => {
    const reward = rewards.find((item) => item.id === id);
    setRewards((current) =>
      current.map((item) => (item.id === id ? { ...item, state: "coletada" } : item)),
    );
    setInventoryResult(reward?.item ?? "Recompensa");
    showToast("Recompensa coletada visualmente");
  };

  const validateCode = () => {
    const normalized = code.trim().toUpperCase();
    if (normalized === "VDN-CAMINHOS") setCodeState("valid");
    else if (normalized === "USADO") setCodeState("used");
    else if (normalized === "EXPIRADO") setCodeState("expired");
    else setCodeState("invalid");
  };

  if (!visible) return <div className="gifts-experience is-hidden" aria-hidden="true" />;

  return (
    <div className="gifts-experience">
      <header className="gifts-topbar">
        <button aria-label="Voltar para a origem" onClick={onClose}>
          <ArrowLeft />
        </button>
        <div>
          <Gift />
          <span>
            <small>GESTOS E RECOMPENSAS</small>
            <h1>Presentes</h1>
          </span>
        </div>
        <button
          aria-label="Enviar presente"
          onClick={() => {
            setSendStep(1);
            setSendOpen(true);
          }}
        >
          <Send />
        </button>
      </header>
      <nav className="gifts-tabs" aria-label="Áreas de Presentes">
        {tabs.map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
          >
            {item}
            {item === "Recebidos" && (
              <span>{received.filter((gift) => gift.state === "pendente").length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="gifts-content">
        {tab === "Recebidos" && (
          <>
            <header className="gifts-heading">
              <div>
                <span>RECEBIDOS</span>
                <h2>Presentes para você</h2>
                <p>Aceite, recuse ou veja detalhes com tranquilidade.</p>
              </div>
              <button onClick={() => setSendOpen(true)}>
                <Send /> Enviar presente
              </button>
            </header>
            <section className="gift-list">
              {commonReceived.map((item) => (
                <button
                  key={item.id}
                  className={`gift-row state-${item.state}`}
                  onClick={() => setSelectedReceived(item)}
                >
                  <GiftArt label={item.item} />
                  <span>
                    <small>
                      {item.origin} · {item.date}
                    </small>
                    <strong>
                      {item.sender} enviou {item.item}
                    </strong>
                    <p>{item.message}</p>
                    <em>{item.state}</em>
                  </span>
                  <ChevronRight />
                </button>
              ))}
            </section>
            {romanticReceived.length > 0 && (
              <section className="romantic-gifts">
                <header>
                  <Heart />
                  <span>
                    <strong>Presentes do Modo Namoro</strong>
                    <small>Visíveis somente após interesse mútuo</small>
                  </span>
                </header>
                {romanticReceived.map((item) => (
                  <button key={item.id} onClick={() => setSelectedReceived(item)}>
                    <span>{item.item}</span>
                    <em>{item.state}</em>
                    <ChevronRight />
                  </button>
                ))}
              </section>
            )}
            {received.length === 0 && (
              <div className="gifts-empty">
                <Gift />
                <h2>Nenhum presente por enquanto</h2>
                <p>Quando alguém enviar algo, aparecerá aqui.</p>
              </div>
            )}
          </>
        )}

        {tab === "Enviados" && (
          <>
            <header className="gifts-heading">
              <div>
                <span>ENVIADOS</span>
                <h2>Gestos que você preparou</h2>
                <p>O destinatário vê apenas o estado, sem pressão.</p>
              </div>
              <button onClick={() => setSendOpen(true)}>
                <Send /> Novo presente
              </button>
            </header>
            <section className="sent-list">
              {sent.map((item) => (
                <button key={item.id} onClick={() => setSelectedSent(item)}>
                  <span className={`sent-state state-${item.state}`}>
                    <Send />
                  </span>
                  <span>
                    <small>{item.date}</small>
                    <strong>{item.item}</strong>
                    <p>Para {item.recipient}</p>
                    <em>{item.state}</em>
                  </span>
                  <ChevronRight />
                </button>
              ))}
            </section>
          </>
        )}

        {tab === "Caixas" && (
          <>
            <header className="gifts-heading">
              <div>
                <span>CAIXAS</span>
                <h2>Surpresas transparentes</h2>
                <p>Probabilidades públicas, animações curtas e nenhum dinheiro real.</p>
              </div>
            </header>
            <section className="boxes-grid">
              {boxes.map((item) => (
                <button
                  key={item.id}
                  className={`box-card state-${item.state}`}
                  onClick={() => {
                    setSelectedBox(item);
                    setBoxStage("detail");
                  }}
                >
                  <GiftArt label={item.name} kind="box" />
                  <span>
                    <small>{item.origin}</small>
                    <strong>{item.name}</strong>
                    <p>
                      {item.quantity} disponível{item.quantity === 1 ? "" : "is"}
                    </p>
                    <em>
                      {item.state} · {item.guarantee}
                    </em>
                  </span>
                </button>
              ))}
            </section>
            {boxes.every((item) => item.quantity === 0) && (
              <div className="gifts-empty">
                <Box />
                <h2>Nenhuma caixa disponível</h2>
                <p>Eventos e conquistas podem liberar novas caixas.</p>
              </div>
            )}
          </>
        )}

        {tab === "Recompensas" && (
          <>
            <header className="gifts-heading">
              <div>
                <span>RECOMPENSAS</span>
                <h2>Disponíveis para coletar</h2>
                <p>Missões, conquistas, eventos e compensações.</p>
              </div>
              <button onClick={() => setCodeOpen(true)}>
                <Tag /> Resgatar código
              </button>
            </header>
            <section className="rewards-list">
              {rewards.map((item) => (
                <article key={item.id} className={`state-${item.state}`}>
                  <GiftArt label={item.item} kind="reward" />
                  <span>
                    <small>
                      {item.origin} · {item.deadline}
                    </small>
                    <strong>{item.item}</strong>
                    <em>{item.state}</em>
                  </span>
                  {item.state === "disponível" ? (
                    <button onClick={() => collectReward(item.id)}>Coletar</button>
                  ) : (
                    <Check />
                  )}
                </article>
              ))}
            </section>
            <button className="code-entry" onClick={() => setCodeOpen(true)}>
              <Tag />
              <span>
                <strong>Resgatar código</strong>
                <small>Validação demonstrativa, sem sistema real.</small>
              </span>
              <ChevronRight />
            </button>
          </>
        )}

        {tab === "Histórico" && (
          <>
            <header className="gifts-heading">
              <div>
                <span>HISTÓRICO</span>
                <h2>Movimentações recentes</h2>
                <p>Presentes, caixas, recompensas e códigos.</p>
              </div>
            </header>
            <div className="gift-history-filters">
              {["Tudo", "7 dias", "Presentes", "Caixas", "Recompensas", "Códigos"].map((filter) => (
                <button
                  key={filter}
                  className={historyFilter === filter ? "active" : ""}
                  onClick={() => setHistoryFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <section className="gift-history">
              {[
                ["Hoje", "Presente recebido", "Luz de Encontro", "pendente", Gift],
                ["Hoje", "Recompensa coletada", "Badge Acolhida", "coletada", Trophy],
                ["27 jul", "Caixa aberta", "Caixa Boas-vindas", "aberta", PackageOpen],
                ["26 jul", "Presente enviado", "Sticker Luz Amiga", "aceito", Send],
                ["24 jul", "Código resgatado", "VDN-JULHO", "usado", Tag],
                ["22 jul", "Item recusado", "Mini Jardim", "recusado", X],
              ].map(([date, action, item, state, Icon]) => {
                const RowIcon = Icon as typeof Gift;
                return (
                  <article key={`${date}-${item}`}>
                    <span>
                      <RowIcon />
                    </span>
                    <div>
                      <small>{date as string}</small>
                      <strong>{item as string}</strong>
                      <p>{action as string}</p>
                    </div>
                    <em>{state as string}</em>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>

      {selectedReceived && (
        <div className="gifts-overlay">
          <section className="gift-detail">
            <header>
              <button aria-label="Voltar" onClick={() => setSelectedReceived(null)}>
                <ArrowLeft />
              </button>
              <strong>Presente recebido</strong>
              <button aria-label="Fechar" onClick={() => setSelectedReceived(null)}>
                <X />
              </button>
            </header>
            <GiftArt label={selectedReceived.item} />
            <span>{selectedReceived.type}</span>
            <h2>{selectedReceived.item}</h2>
            <p>“{selectedReceived.message}”</p>
            <dl>
              <div>
                <dt>De</dt>
                <dd>{selectedReceived.sender}</dd>
              </div>
              <div>
                <dt>Origem</dt>
                <dd>{selectedReceived.origin}</dd>
              </div>
              <div>
                <dt>Compatibilidade</dt>
                <dd>{selectedReceived.compatibility}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{selectedReceived.state}</dd>
              </div>
            </dl>
            {selectedReceived.state === "pendente" && (
              <footer>
                <button onClick={() => setConfirmRefusal(true)}>Recusar</button>
                <button onClick={() => acceptGift(selectedReceived.id)}>
                  <Check /> Aceitar
                </button>
              </footer>
            )}
            <button
              className="report-gift"
              onClick={() => showToast("Denúncia aberta no sistema universal")}
            >
              <ShieldCheck /> Denunciar presente
            </button>
          </section>
        </div>
      )}
      {selectedSent && (
        <div className="gifts-overlay">
          <section className="gift-detail">
            <header>
              <button aria-label="Voltar" onClick={() => setSelectedSent(null)}>
                <ArrowLeft />
              </button>
              <strong>Presente enviado</strong>
              <button aria-label="Fechar" onClick={() => setSelectedSent(null)}>
                <X />
              </button>
            </header>
            <GiftArt label={selectedSent.item} />
            <span>PARA {selectedSent.recipient.toUpperCase()}</span>
            <h2>{selectedSent.item}</h2>
            <p>Enviado em {selectedSent.date}. O destinatário verá apenas o estado.</p>
            <dl>
              <div>
                <dt>Estado</dt>
                <dd>{selectedSent.state}</dd>
              </div>
              <div>
                <dt>Cancelamento</dt>
                <dd>
                  {selectedSent.state === "aguardando"
                    ? "Disponível antes do aceite"
                    : "Indisponível"}
                </dd>
              </div>
            </dl>
            {selectedSent.state === "aguardando" && (
              <button className="cancel-gift" onClick={() => cancelSent(selectedSent.id)}>
                Cancelar envio
              </button>
            )}
          </section>
        </div>
      )}
      {confirmRefusal && selectedReceived && (
        <div className="gifts-overlay confirmation">
          <section>
            <AlertTriangle />
            <h2>Recusar este presente?</h2>
            <p>O item retorna visualmente ao remetente. Nenhuma mensagem de culpa será exibida.</p>
            <div>
              <button onClick={() => setConfirmRefusal(false)}>Manter pendente</button>
              <button onClick={() => refuseGift(selectedReceived.id)}>Recusar</button>
            </div>
          </section>
        </div>
      )}

      {sendOpen && (
        <div className="gifts-overlay">
          <section className="send-flow">
            <header>
              <button
                aria-label="Voltar etapa"
                onClick={() =>
                  sendStep > 1 ? setSendStep((step) => step - 1) : setSendOpen(false)
                }
              >
                <ArrowLeft />
              </button>
              <span>
                <small>ETAPA {sendStep} DE 4</small>
                <strong>Enviar presente</strong>
              </span>
              <button aria-label="Fechar" onClick={() => setSendOpen(false)}>
                <X />
              </button>
            </header>
            {sendStep === 1 && (
              <div className="send-step">
                <h2>Escolha um item presenteável</h2>
                {[
                  "Luz de Encontro",
                  "Sticker Luz Amiga",
                  "Moldura Horizonte Coral",
                  "Lenço Costa Serena",
                ].map((item) => (
                  <button
                    key={item}
                    className={sendItem === item ? "selected" : ""}
                    onClick={() => setSendItem(item)}
                  >
                    <GiftArt label={item} />
                    <span>
                      <strong>{item}</strong>
                      <small>
                        {item === "Luz de Encontro"
                          ? "Ana Clara ainda não possui"
                          : "Presenteável · Inventário"}
                      </small>
                    </span>
                    {sendItem === item && <Check />}
                  </button>
                ))}
                <button className="next-step" onClick={() => setSendStep(2)}>
                  Escolher destinatário
                </button>
              </div>
            )}
            {sendStep === 2 && (
              <div className="send-step">
                <h2>Para quem?</h2>
                {["Ana Clara", "Lucas Almeida", "Marina Souza"].map((name) => (
                  <button
                    key={name}
                    className={recipient === name ? "selected" : ""}
                    onClick={() => setRecipient(name)}
                  >
                    <span className="gift-avatar">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>
                      <strong>{name}</strong>
                      <small>
                        {name === "Ana Clara"
                          ? "Ainda não possui este item"
                          : "Já possui · você pode escolher outro"}
                      </small>
                    </span>
                    {recipient === name && <Check />}
                  </button>
                ))}
                <button className="next-step" onClick={() => setSendStep(3)}>
                  Adicionar mensagem
                </button>
              </div>
            )}
            {sendStep === 3 && (
              <div className="send-step message-step">
                <h2>Mensagem opcional</h2>
                <label>
                  Mensagem
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={180}
                    placeholder="Escreva algo gentil…"
                  />
                </label>
                <small>{message.length}/180</small>
                <button className="next-step" onClick={() => setSendStep(4)}>
                  Revisar
                </button>
              </div>
            )}
            {sendStep === 4 && (
              <div className="send-step review-step">
                <h2>Revise antes de enviar</h2>
                <GiftArt label={sendItem} />
                <dl>
                  <div>
                    <dt>Item</dt>
                    <dd>{sendItem}</dd>
                  </div>
                  <div>
                    <dt>Destinatário</dt>
                    <dd>{recipient}</dd>
                  </div>
                  <div>
                    <dt>Mensagem</dt>
                    <dd>{message || "Sem mensagem"}</dd>
                  </div>
                </dl>
                <p>
                  <ShieldCheck /> Nenhum saldo ou item real será transferido nesta demonstração.
                </p>
                <button className="next-step" onClick={finishSend}>
                  <Send /> Enviar presente
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {selectedBox && (
        <div className="gifts-overlay">
          <section className={`box-flow stage-${boxStage}`}>
            <header>
              <button aria-label="Voltar" onClick={() => setSelectedBox(null)}>
                <ArrowLeft />
              </button>
              <strong>{selectedBox.name}</strong>
              <button aria-label="Fechar" onClick={() => setSelectedBox(null)}>
                <X />
              </button>
            </header>
            {boxStage === "detail" && (
              <div>
                <GiftArt label={selectedBox.name} kind="box" />
                <span>{selectedBox.origin}</span>
                <h2>{selectedBox.name}</h2>
                <p>{selectedBox.guarantee}</p>
                <div className="probabilities">
                  <strong>Probabilidades públicas</strong>
                  {selectedBox.probabilities.map((probability) => (
                    <span key={probability}>{probability}</span>
                  ))}
                </div>
                <div className="pity">
                  <Clock3 />
                  <span>
                    <strong>Garantia</strong>
                    <small>{selectedBox.pity}</small>
                  </span>
                </div>
                <details>
                  <summary>Itens possíveis</summary>
                  {selectedBox.possible.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </details>
                <button disabled={selectedBox.quantity === 0} onClick={openBox}>
                  <PackageOpen /> Abrir caixa simulada
                </button>
              </div>
            )}
            {boxStage === "opening" && (
              <div className="opening-box" role="status">
                <Box />
                <h2>Abrindo com calma…</h2>
                <p>Animação curta, sem flashes ou roleta.</p>
              </div>
            )}
            {boxStage === "result" && (
              <div className="box-result">
                <span>
                  <Sparkles />
                </span>
                <small>NOVO · RARO</small>
                <h2>Aura Horizonte Calmo</h2>
                <p>Coleção Caminhos · origem {selectedBox.origin}</p>
                <GiftArt label="Aura Horizonte Calmo" kind="reward" />
                <div>
                  <button
                    onClick={() => {
                      setSelectedBox(null);
                      window.dispatchEvent(
                        new CustomEvent("vdn-open-profile-studio", {
                          detail: { tab: "Visual", source: "Caixa" },
                        }),
                      );
                    }}
                  >
                    Equipar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBox(null);
                      setTab("Caixas");
                    }}
                  >
                    Abrir próxima
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBox(null);
                      showToast("Item aberto no Inventário");
                    }}
                  >
                    Ver item
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {codeOpen && (
        <div className="gifts-overlay">
          <section className="code-modal">
            <header>
              <div>
                <Tag />
                <span>
                  <small>RECOMPENSAS</small>
                  <h2>Resgatar código</h2>
                </span>
              </div>
              <button aria-label="Fechar" onClick={() => setCodeOpen(false)}>
                <X />
              </button>
            </header>
            <label>
              Código promocional
              <div>
                <input
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setCodeState("idle");
                  }}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="VDN-CAMINHOS"
                />
                <button aria-label="Colar código" onClick={() => setCode("VDN-CAMINHOS")}>
                  <Copy />
                </button>
              </div>
            </label>
            <button className="validate-code" disabled={!code.trim()} onClick={validateCode}>
              Validar código simulado
            </button>
            {codeState !== "idle" && (
              <div className={`code-result state-${codeState}`}>
                {codeState === "valid" ? <Check /> : <CircleAlert />}
                <span>
                  <strong>
                    {codeState === "valid"
                      ? "Código válido"
                      : codeState === "used"
                        ? "Código já usado"
                        : codeState === "expired"
                          ? "Código expirado"
                          : "Código inválido"}
                  </strong>
                  <small>
                    {codeState === "valid"
                      ? "Caixa Caminhos disponível para coletar."
                      : "Confira o código e tente novamente."}
                  </small>
                </span>
                {codeState === "valid" && (
                  <button
                    onClick={() => {
                      setCodeOpen(false);
                      setTab("Recompensas");
                      showToast("Código resgatado visualmente");
                    }}
                  >
                    Resgatar
                  </button>
                )}
              </div>
            )}
            <p>
              <ShieldCheck /> Esta validação é demonstrativa e não conecta um sistema real.
            </p>
          </section>
        </div>
      )}

      {inventoryResult && (
        <div className="inventory-result" role="status">
          <PackageCheck />
          <span>
            <small>NOVO NO INVENTÁRIO</small>
            <strong>{inventoryResult}</strong>
            <p>Favoritar, ver coleção ou equipar agora.</p>
          </span>
          <button
            onClick={() => {
              setInventoryResult(null);
              showToast("Inventário aberto na Loja");
              window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "loja" }));
            }}
          >
            Ver no Inventário
          </button>
          <button
            onClick={() => {
              setInventoryResult(null);
              window.dispatchEvent(
                new CustomEvent("vdn-open-profile-studio", {
                  detail: { tab: "Vitrine", source: "Presentes" },
                }),
              );
            }}
          >
            Equipar
          </button>
          <button aria-label="Fechar" onClick={() => setInventoryResult(null)}>
            <X />
          </button>
        </div>
      )}
    </div>
  );
}

export default function GiftsRewardsExperience(props: {
  visible: boolean;
  initialTab: GiftsTab;
  initialAction: GiftsAction;
  initialItem?: string;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <GiftsBoundary onClose={props.onClose}>
      <GiftsContent {...props} />
    </GiftsBoundary>
  );
}
