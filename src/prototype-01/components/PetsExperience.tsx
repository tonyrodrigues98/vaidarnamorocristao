"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  BedDouble,
  Bird,
  Bone,
  Check,
  ChevronRight,
  CircleAlert,
  Droplets,
  Fish,
  Gift,
  Heart,
  Home,
  LampDesk,
  Leaf,
  LockKeyhole,
  MessageCircle,
  Moon,
  PackageOpen,
  Palette,
  PawPrint,
  Rabbit,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  ToyBrick,
  UserRound,
  UsersRound,
  Utensils,
  X,
} from "lucide-react";
import React, { Component, useState } from "react";

type PetTab = "Meu Pet" | "Meus Pets" | "Habitat" | "Missões";
type PetMood = "feliz" | "cansado" | "descanso";
type AdoptionStep = 1 | 2 | 3 | 4 | 5;

const tabs: PetTab[] = ["Meu Pet", "Meus Pets", "Habitat", "Missões"];
const species = [
  { id: "cao", label: "Cão", icon: PawPrint, tone: "honey" },
  { id: "gato", label: "Gato", icon: Sparkles, tone: "violet" },
  { id: "ave", label: "Ave", icon: Bird, tone: "sky" },
  { id: "coelho", label: "Coelho", icon: Rabbit, tone: "rose" },
  { id: "peixe", label: "Peixe", icon: Fish, tone: "aqua" },
];

class PetsBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="pets-local-error" role="alert">
          <CircleAlert size={26} />
          <strong>Não foi possível abrir esta área</strong>
          <span>Tente novamente.</span>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BentoScene({ mood, action }: { mood: PetMood; action: string }) {
  return (
    <div className={`pet-scene pet-${mood} action-${action}`}>
      <div className="pet-scene-window">
        <span />
        <span />
      </div>
      <div className="pet-scene-plant">
        <i />
        <b />
      </div>
      <div className="pet-scene-lamp">
        <span />
        <i />
      </div>
      <div className="pet-bed" />
      <div className="pet-image-wrap">
        <img src="/pet-bento.png" alt="Bento, Pet caramelo estilizado" />
        {action && <span className="pet-action-feedback">{action}</span>}
      </div>
      <div className="pet-scene-floor" />
    </div>
  );
}

function CareAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Heart;
  onClick: () => void;
}) {
  return (
    <button className="care-action" onClick={onClick}>
      <span>
        <Icon size={19} />
      </span>
      <small>{label}</small>
    </button>
  );
}

function AdoptionFlow({
  onClose,
  onAdopt,
}: {
  onClose: () => void;
  onAdopt: (name: string) => void;
}) {
  const [step, setStep] = useState<AdoptionStep>(1);
  const [selected, setSelected] = useState("cao");
  const [name, setName] = useState("Bento");
  const selectedSpecies = species.find((item) => item.id === selected) ?? species[0];
  const SelectedIcon = selectedSpecies.icon;

  return (
    <div className="adoption-flow" role="dialog" aria-modal="true" aria-label="Primeira adoção">
      <header>
        <button aria-label="Fechar adoção" onClick={onClose}>
          <X size={20} />
        </button>
        <div>
          <strong>Primeira adoção</strong>
          <span>Etapa {step} de 5 · primeiro Pet gratuito</span>
        </div>
        <i>{step}/5</i>
      </header>
      <main>
        {step === 1 && (
          <section className="adoption-intro">
            <span>
              <Heart size={28} />
            </span>
            <h2>Um companheiro para caminhar com você</h2>
            <p>
              Pets são uma parte leve e opcional da comunidade. Eles descansam quando você não está
              aqui e nunca perdem o que conquistaram.
            </p>
            <button onClick={() => setStep(2)}>
              Conhecer opções <ChevronRight size={16} />
            </button>
          </section>
        )}
        {step === 2 && (
          <section className="adoption-options">
            <div className="adoption-heading">
              <h2>Quem combina com você?</h2>
              <p>Toque para observar cada personalidade.</p>
            </div>
            <div>
              {species.map(({ id, label, icon: Icon, tone }) => (
                <button
                  key={id}
                  className={`${tone} ${selected === id ? "active" : ""}`}
                  onClick={() => setSelected(id)}
                >
                  <span>
                    <Icon size={27} />
                  </span>
                  <strong>{label}</strong>
                  <small>
                    {id === "cao"
                      ? "Afetuoso e curioso"
                      : id === "gato"
                        ? "Calmo e observador"
                        : id === "ave"
                          ? "Alegre e expressivo"
                          : id === "coelho"
                            ? "Gentil e brincalhão"
                            : "Sereno e contemplativo"}
                  </small>
                </button>
              ))}
            </div>
            <button className="adoption-next" onClick={() => setStep(3)}>
              Observar {selectedSpecies.label} <ChevronRight size={16} />
            </button>
          </section>
        )}
        {step === 3 && (
          <section className="adoption-observe">
            <div className={`adoption-species-preview ${selectedSpecies.tone}`}>
              <SelectedIcon size={76} />
              <Sparkles className="adoption-spark" size={18} />
            </div>
            <span>{selectedSpecies.label.toUpperCase()}</span>
            <h2>Uma presença {selected === "peixe" ? "tranquila" : "carinhosa"}</h2>
            <p>
              Ele reage aos seus cuidados com movimentos leves e acompanha sua caminhada sem criar
              obrigações.
            </p>
            <div>
              <button onClick={() => setStep(2)}>Ver outros</button>
              <button onClick={() => setStep(4)}>Escolher este Pet</button>
            </div>
          </section>
        )}
        {step === 4 && (
          <section className="adoption-name">
            <span className={selectedSpecies.tone}>
              <SelectedIcon size={46} />
            </span>
            <h2>Como ele vai se chamar?</h2>
            <p>Escolha com carinho. O nome será permanente.</p>
            <label>
              Nome do Pet
              <input
                value={name}
                maxLength={18}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </label>
            <button disabled={!name.trim()} onClick={() => setStep(5)}>
              Continuar
            </button>
          </section>
        )}
        {step === 5 && (
          <section className="adoption-confirm">
            <span className={selectedSpecies.tone}>
              <SelectedIcon size={52} />
            </span>
            <small>SEU NOVO COMPANHEIRO</small>
            <h2>{name || "Bento"}</h2>
            <p>{selectedSpecies.label} · fase jovem</p>
            <div>
              <LockKeyhole size={15} />
              <span>
                O nome é permanente, mas você poderá personalizar habitat e acessórios quando
                quiser.
              </span>
            </div>
            <button onClick={() => onAdopt(name || "Bento")}>
              <Heart size={16} /> Confirmar adoção
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function PetsContent({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<PetTab>("Meu Pet");
  const [mood, setMood] = useState<PetMood>("feliz");
  const [action, setAction] = useState("");
  const [activePet, setActivePet] = useState("Bento");
  const [adoptionOpen, setAdoptionOpen] = useState(false);
  const [friendOpen, setFriendOpen] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [demoState, setDemoState] = useState<"normal" | "loading" | "offline" | "no-pet">("normal");
  const [equipped, setEquipped] = useState("Bandana coral");
  const [habitat, setHabitat] = useState({
    fundo: "Fim de tarde",
    piso: "Madeira clara",
    cama: "Nuvem",
    brinquedo: "Corda",
    movel: "Estante",
    planta: "Ficus",
    luz: "Dourada",
    decoracao: "Livros",
  });
  const [missions, setMissions] = useState<Record<string, boolean>>({
    visitar: true,
    brincar: false,
    amigo: false,
  });

  const triggerCare = (nextAction: string, message: string) => {
    setAction(nextAction);
    setMood(nextAction === "descansou" ? "cansado" : "feliz");
    showToast(message);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setAction(""), 850);
    }
  };

  const showLoadingState = () => {
    setDemoState("loading");
    if (typeof window !== "undefined") {
      window.setTimeout(() => setDemoState("normal"), 720);
    }
  };

  if (!visible) return <div className="pets-experience is-hidden" aria-hidden="true" />;

  return (
    <div className="pets-experience" data-immersive-surface="pets" data-state-preserved="true">
      <header className="pets-topbar">
        <button aria-label="Voltar para Explorar" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Pets</h1>
          <span>Uma companhia leve para sua caminhada</span>
        </div>
        <button aria-label="Loja de Pets" onClick={() => showToast("Loja de Pets aberta")}>
          <ShoppingBag size={20} />
        </button>
      </header>

      <nav className="pets-tabs" aria-label="Áreas de Pets">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {demoState === "offline" && (
        <div className="pets-state-banner" role="status">
          <RefreshCw size={15} />
          <span>Você está offline. Seus cuidados serão sincronizados quando a conexão voltar.</span>
          <button onClick={() => setDemoState("normal")}>Fechar</button>
        </div>
      )}

      {demoState === "loading" && (
        <div className="pets-loading-state" aria-label="Carregando Pets">
          <div className="pets-loading-scene">
            <i />
            <span />
          </div>
          <div>
            <i />
            <i />
            <i />
          </div>
        </div>
      )}

      {demoState === "no-pet" && (
        <div className="no-pet-state">
          <span>
            <PawPrint size={34} />
          </span>
          <small>SEU PRIMEIRO COMPANHEIRO</small>
          <h2>Você ainda não adotou um Pet</h2>
          <p>
            Conheça cinco espécies, observe suas personalidades e escolha com calma. O primeiro Pet
            é gratuito.
          </p>
          <button
            onClick={() => {
              setDemoState("normal");
              setAdoptionOpen(true);
            }}
          >
            Começar primeira adoção
          </button>
          <button onClick={() => setDemoState("normal")}>Voltar para Bento demonstrativo</button>
        </div>
      )}

      <main className={`pets-content ${demoState !== "normal" ? "is-obscured" : ""}`}>
        {activeTab === "Meu Pet" && (
          <div className="my-pet-layout">
            <section className="my-pet-main">
              <div className="pet-identity">
                <div>
                  <span>SEU COMPANHEIRO</span>
                  <h2>{activePet}</h2>
                  <p>Cão · jovem · nível 12</p>
                </div>
                <button onClick={() => setActiveTab("Meus Pets")}>
                  Trocar Pet <ChevronRight size={15} />
                </button>
              </div>
              <BentoScene mood={mood} action={action} />
              <div className="pet-mood-row">
                <span className={`mood-orb ${mood}`}>
                  <Heart size={17} />
                </span>
                <div>
                  <small>HUMOR</small>
                  <strong>
                    {mood === "feliz"
                      ? "Feliz e curioso"
                      : mood === "cansado"
                        ? "Um pouco cansado"
                        : "Descansando tranquilo"}
                  </strong>
                </div>
                <button onClick={() => setMood(mood === "cansado" ? "feliz" : "cansado")}>
                  Ver estado
                </button>
              </div>
              <div className="pet-needs" aria-label="Necessidades do Pet">
                <span>
                  <Utensils size={15} />
                  <i>
                    <b style={{ width: "86%" }} />
                  </i>
                  <small>Alimentação</small>
                </span>
                <span>
                  <Moon size={15} />
                  <i>
                    <b style={{ width: mood === "cansado" ? "42%" : "74%" }} />
                  </i>
                  <small>Energia</small>
                </span>
                <span>
                  <Droplets size={15} />
                  <i>
                    <b style={{ width: "91%" }} />
                  </i>
                  <small>Higiene</small>
                </span>
                <span>
                  <Heart size={15} />
                  <i>
                    <b style={{ width: "96%" }} />
                  </i>
                  <small>Afeto</small>
                </span>
              </div>
              <div className="care-actions" aria-label="Cuidar de Bento">
                <CareAction
                  label="Alimentar"
                  icon={Utensils}
                  onClick={() => triggerCare("comeu", "Bento adorou o lanche")}
                />
                <CareAction
                  label="Acariciar"
                  icon={Heart}
                  onClick={() => triggerCare("carinho", "Bento ficou ainda mais feliz")}
                />
                <CareAction
                  label="Brincar"
                  icon={Bone}
                  onClick={() => {
                    triggerCare("brincou", "Brincadeira concluída");
                    setMissions((current) => ({ ...current, brincar: true }));
                  }}
                />
                <CareAction
                  label="Limpar"
                  icon={Droplets}
                  onClick={() => triggerCare("limpo", "Tudo limpo e confortável")}
                />
                <CareAction
                  label="Descansar"
                  icon={Moon}
                  onClick={() => triggerCare("descansou", "Bento foi descansar")}
                />
                <CareAction
                  label="Brinquedo"
                  icon={ToyBrick}
                  onClick={() => triggerCare("brinquedo", "Brinquedo favorito equipado")}
                />
              </div>
              <div className="pet-secondary-actions">
                <button onClick={() => setFriendOpen(true)}>
                  <UsersRound size={17} />
                  <span>
                    <strong>Visitar Pet de Amigo</strong>
                    <small>Ana deixou um recado para Bento</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => setProfileVisible((value) => !value)}>
                  <UserRound size={17} />
                  <span>
                    <strong>Exibir Pet no Perfil</strong>
                    <small>Somente o Pet ativo aparece</small>
                  </span>
                  <i className={profileVisible ? "on" : ""}>
                    <b />
                  </i>
                </button>
              </div>
            </section>

            <aside className="pet-context-panel">
              <span>HOJE COM {activePet.toUpperCase()}</span>
              <h3>Tudo tranquilo por aqui</h3>
              <p>
                Cuidados essenciais são sempre gratuitos. Se você ficar longe, Bento apenas
                descansa.
              </p>
              <div className="context-mission">
                <Check size={17} />
                <span>
                  <strong>Visita do dia</strong>
                  <small>Concluída · +20 experiência</small>
                </span>
              </div>
              <button onClick={() => setActiveTab("Missões")}>
                Ver missões <ChevronRight size={15} />
              </button>
              <div className="pet-quick-inventory">
                <span>EQUIPADO</span>
                <strong>{equipped}</strong>
                <small>Coleção Costa Serena</small>
              </div>
            </aside>
          </div>
        )}

        {activeTab === "Meus Pets" && (
          <section className="pet-collection">
            <div className="pets-page-intro">
              <span>SUA FAMÍLIA</span>
              <h2>Meus Pets</h2>
              <p>Um Pet acompanha você. Os outros descansam sem perder nível ou necessidades.</p>
            </div>
            <article className="active-pet-card">
              <img src="/pet-bento.png" alt="" />
              <div>
                <span>PET ATIVO</span>
                <h3>{activePet}</h3>
                <p>Cão · nível 12 · feliz</p>
                <button onClick={() => setActiveTab("Meu Pet")}>Visitar habitat</button>
              </div>
            </article>
            <div className="resting-pets-heading">
              <h3>Em descanso</h3>
              <span>Podem voltar gratuitamente</span>
            </div>
            <div className="resting-pets">
              {[
                ["Luma", "Gato", Sparkles, "Nível 8"],
                ["Sol", "Ave", Bird, "Nível 5"],
              ].map(([name, kind, Icon, level]) => {
                const PetIcon = Icon as typeof Bird;
                return (
                  <article key={String(name)}>
                    <span>
                      <PetIcon size={35} />
                    </span>
                    <div>
                      <strong>{String(name)}</strong>
                      <small>
                        {String(kind)} · {String(level)}
                      </small>
                      <em>
                        <Moon size={11} /> Em descanso
                      </em>
                    </div>
                    <button
                      onClick={() => {
                        setActivePet(String(name));
                        setMood("feliz");
                        showToast(`${String(name)} agora é seu Pet ativo`);
                      }}
                    >
                      Tornar ativo
                    </button>
                  </article>
                );
              })}
            </div>
            <button className="adopt-another" onClick={() => setAdoptionOpen(true)}>
              <PawPrint size={19} />
              <span>
                <strong>Adotar outro Pet</strong>
                <small>Conheça as espécies disponíveis</small>
              </span>
              <ChevronRight size={16} />
            </button>
          </section>
        )}

        {activeTab === "Habitat" && (
          <div className="habitat-layout">
            <section className="habitat-main">
              <div className="pets-page-intro">
                <span>SEU ESPAÇO</span>
                <h2>Habitat de {activePet}</h2>
                <p>Personalize por encaixes. Tudo permanece organizado e confortável.</p>
              </div>
              <BentoScene mood="feliz" action="" />
              <div className="habitat-slots">
                {[
                  ["fundo", "Fundo", Palette, ["Fim de tarde", "Manhã serena", "Noite violeta"]],
                  ["piso", "Piso", Home, ["Madeira clara", "Tapete creme", "Pedra suave"]],
                  ["cama", "Cama", BedDouble, ["Nuvem", "Cesta", "Almofada"]],
                  ["brinquedo", "Brinquedo", ToyBrick, ["Corda", "Bola coral", "Estrela"]],
                  ["movel", "Móvel", PackageOpen, ["Estante", "Baú", "Mesa baixa"]],
                  ["planta", "Planta", Leaf, ["Ficus", "Flores", "Samambaia"]],
                  ["luz", "Iluminação", LampDesk, ["Dourada", "Natural", "Violeta"]],
                  ["decoracao", "Decoração", Sparkles, ["Livros", "Quadros", "Luzes"]],
                ].map(([key, label, Icon, options]) => {
                  const SlotIcon = Icon as typeof Home;
                  const values = options as string[];
                  const current = habitat[key as keyof typeof habitat];
                  const next = values[(values.indexOf(current) + 1) % values.length];
                  return (
                    <button
                      key={String(key)}
                      onClick={() => {
                        setHabitat((value) => ({ ...value, [String(key)]: next }));
                        showToast(`${String(label)} alterado para ${next}`);
                      }}
                    >
                      <span>
                        <SlotIcon size={18} />
                      </span>
                      <div>
                        <small>{String(label)}</small>
                        <strong>{current}</strong>
                      </div>
                      <ChevronRight size={15} />
                    </button>
                  );
                })}
              </div>
            </section>
            <aside className="equipment-panel">
              <span>EQUIPAMENTOS</span>
              <h3>Detalhes que contam história</h3>
              <div className="equipment-slots">
                {[
                  "Cabeça",
                  "Pescoço",
                  "Corpo",
                  "Costas",
                  "Acessório",
                  "Efeito",
                  "Brinquedo favorito",
                ].map((slot, index) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setEquipped(index === 1 ? "Bandana coral" : `${slot} equipado`);
                      showToast(`${slot} atualizado`);
                    }}
                  >
                    {index === 1 ? (
                      <Shirt size={16} />
                    ) : index === 6 ? (
                      <Bone size={16} />
                    ) : (
                      <PlusIcon />
                    )}
                    <span>
                      <small>{slot}</small>
                      <strong>
                        {index === 1 ? "Bandana coral" : index === 6 ? "Corda macia" : "Vazio"}
                      </strong>
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="pet-store-link"
                onClick={() => showToast("Coleções para Pets abertas")}
              >
                <ShoppingBag size={16} /> Roupas, habitats e decorações
              </button>
              <p>Nem toda espécie usa todos os encaixes.</p>
            </aside>
          </div>
        )}

        {activeTab === "Missões" && (
          <section className="pet-missions">
            <div className="pets-page-intro">
              <span>PEQUENOS MOMENTOS</span>
              <h2>Missões de hoje</h2>
              <p>Até três atividades leves. Sem sequência obrigatória e sem punição por faltar.</p>
            </div>
            <div className="mission-progress">
              <span>{Object.values(missions).filter(Boolean).length} de 3 concluídas</span>
              <i>
                <b
                  style={{
                    width: `${(Object.values(missions).filter(Boolean).length / 3) * 100}%`,
                  }}
                />
              </i>
            </div>
            {[
              ["visitar", "Visitar seu Pet", "Passe um momento com Bento.", Heart, "20 XP"],
              ["brincar", "Brincar juntos", "Escolha qualquer brinquedo.", ToyBrick, "25 XP"],
              [
                "amigo",
                "Visitar Pet de Amigo",
                "Uma visita carinhosa, sem obrigações.",
                UsersRound,
                "30 XP",
              ],
            ].map(([id, title, copy, Icon, reward]) => {
              const MissionIcon = Icon as typeof Heart;
              const done = missions[String(id)];
              return (
                <article key={String(id)} className={done ? "done" : ""}>
                  <span>
                    <MissionIcon size={21} />
                  </span>
                  <div>
                    <strong>{String(title)}</strong>
                    <p>{String(copy)}</p>
                    <small>{String(reward)}</small>
                  </div>
                  <button
                    onClick={() => {
                      setMissions((current) => ({ ...current, [String(id)]: true }));
                      if (id === "amigo") setFriendOpen(true);
                      showToast(done ? "Missão já concluída" : "Missão concluída");
                    }}
                  >
                    {done ? <Check size={18} /> : "Fazer"}
                  </button>
                </article>
              );
            })}
            <div className="arcade-mission">
              <Star size={22} />
              <div>
                <strong>Missão extra opcional</strong>
                <span>Conclua uma atividade do Arcade e ganhe um mimo para o habitat.</span>
              </div>
              <button onClick={() => showToast("Arcade aberto")}>Abrir Arcade</button>
            </div>
          </section>
        )}
      </main>

      <details className="pets-demo-states">
        <summary>Estados demonstrativos</summary>
        <div>
          <button onClick={() => setMood("feliz")}>Pet feliz</button>
          <button onClick={() => setMood("cansado")}>Pet cansado</button>
          <button onClick={() => setMood("descanso")}>Em descanso</button>
          <button onClick={() => setDemoState("no-pet")}>Sem Pet</button>
          <button onClick={() => setAdoptionOpen(true)}>Primeira adoção</button>
          <button onClick={showLoadingState}>Loading</button>
          <button onClick={() => setDemoState("offline")}>Offline</button>
        </div>
      </details>

      {adoptionOpen && (
        <AdoptionFlow
          onClose={() => setAdoptionOpen(false)}
          onAdopt={(name) => {
            setActivePet(name);
            setAdoptionOpen(false);
            setActiveTab("Meu Pet");
            showToast(`${name} chegou ao novo habitat`);
          }}
        />
      )}

      {friendOpen && (
        <div className="friend-pet-visit" role="dialog" aria-modal="true">
          <header>
            <button aria-label="Voltar" onClick={() => setFriendOpen(false)}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <strong>Pet de Ana Clara</strong>
              <span>Visita autorizada</span>
            </div>
            <button aria-label="Fechar" onClick={() => setFriendOpen(false)}>
              <X size={19} />
            </button>
          </header>
          <div className="friend-pet-scene">
            <span>
              <Sparkles size={72} />
            </span>
            <div>
              <small>GATA · NÍVEL 9</small>
              <h2>Amora</h2>
              <p>Calma e observadora</p>
            </div>
          </div>
          <div className="friend-visit-actions">
            {[
              ["Observar", Sun],
              ["Acariciar", Heart],
              ["Brincar", ToyBrick],
              ["Reagir", Sparkles],
              ["Recado", MessageCircle],
              ["Presente", Gift],
            ].map(([label, Icon]) => {
              const ActionIcon = Icon as typeof Heart;
              return (
                <button
                  key={String(label)}
                  onClick={() => {
                    if (label === "Acariciar")
                      setMissions((current) => ({ ...current, amigo: true }));
                    showToast(`${String(label)}: ação realizada`);
                  }}
                >
                  <ActionIcon size={18} />
                  <span>{String(label)}</span>
                </button>
              );
            })}
          </div>
          <p className="friend-permission">
            <LockKeyhole size={14} /> Cuidados extras só aparecem quando Ana autoriza.
          </p>
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return <span className="equipment-plus">+</span>;
}

export function PetsExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <PetsBoundary>
      <PetsContent {...props} />
    </PetsBoundary>
  );
}
