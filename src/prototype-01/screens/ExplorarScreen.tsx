import {
  BookHeart,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Compass,
  Gamepad2,
  HeartHandshake,
  Newspaper,
  Package,
  Palette,
  PawPrint,
  Radio,
  Sparkles,
  Store,
  Trophy,
  UserRound,
} from "lucide-react";

import type { NativeExploreIconKey, NativeExploreItem } from "@/config/native-explore-registry";

import petBento from "../assets/pet-bento.png";

const icons: Record<NativeExploreIconKey, typeof BookOpen> = {
  "book-heart": BookHeart,
  "paw-print": PawPrint,
  gamepad: Gamepad2,
  "circle-help": CircleHelp,
  store: Store,
  "user-round": UserRound,
  package: Package,
  trophy: Trophy,
  newspaper: Newspaper,
  sparkles: Sparkles,
  "heart-handshake": HeartHandshake,
  radio: Radio,
};

export type Prototype01ExplorarScreenProps = {
  items: readonly NativeExploreItem[];
  onNavigate(path: string): void;
};

export function Prototype01ExplorarScreen({ items, onNavigate }: Prototype01ExplorarScreenProps) {
  const experiences = items.filter((item) => item.category === "experiences");
  const discoveries = items.filter((item) => item.category === "discoveries");

  return (
    <section className="screen explore-screen" aria-label="Explorar">
      <div className="page-scroll explore-page-scroll">
        <header className="topbar contextual-topbar">
          <h1>Explorar</h1>
          <button
            type="button"
            className="icon-button pressable"
            aria-label="Abrir loja"
            onClick={() => onNavigate("/loja")}
          >
            <Store size={20} />
          </button>
        </header>

        <div className="explore-content">
          <div className="editorial-switcher" aria-label="Filtrar Explorar">
            <button type="button" className="active">
              Tudo
            </button>
            <button type="button" onClick={() => onNavigate("/devocional")}>
              Fé
            </button>
            <button type="button" onClick={() => onNavigate("/pretendentes")}>
              Pessoas
            </button>
          </div>

          <section className="continue-section">
            <div className="section-heading">
              <h2>Continuar</h2>
              <span>Atalhos reais</span>
            </div>
            <div className="continue-list">
              {experiences.slice(0, 3).map((item) => {
                const Icon = icons[item.icon];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="continue-item pressable"
                    onClick={() => onNavigate(item.path)}
                  >
                    <span className={`continue-icon ${item.id === "my-pet" ? "pet" : ""}`}>
                      <Icon size={19} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="happening-section">
            <span className="section-overline">EXPERIÊNCIA PÚBLICA</span>
            <button
              type="button"
              className="live-official-card pressable"
              onClick={() => onNavigate("/")}
            >
              <span className="live-official-art">
                <span>
                  <i /> LIVE
                </span>
                <Radio size={38} />
                <small>Dados públicos atuais</small>
              </span>
              <span>
                <small>TRANSMISSÃO OFICIAL</small>
                <strong>Comunidade que acolhe</strong>
                <em>Abra a experiência pública atual.</em>
                <b>
                  Ver live <ChevronRight size={17} />
                </b>
              </span>
            </button>
            <div className="live-cinema" aria-label="Cinema em comunidade em breve">
              <div className="cinema-visual">
                <span className="live-pill">EM BREVE</span>
                <Clapperboard size={38} />
              </div>
              <div>
                <span>CINEMA DA COMUNIDADE</span>
                <h2>Experiência futura</h2>
                <p>Sem rota funcional ou dados persistentes neste momento.</p>
              </div>
            </div>
          </section>

          <section className="experiences-section">
            <div className="section-heading">
              <h2>Experiências</h2>
              <span>Entre quando fizer sentido</span>
            </div>
            <div className="experience-grid">
              {experiences.map((item, index) => {
                const Icon = icons[item.icon];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`experience-card experience-${index % 2 === 0 ? "coral" : "violet"} pressable ${
                      index === 0 || index === 3 ? "wide" : ""
                    }`}
                    onClick={() => onNavigate(item.path)}
                  >
                    {item.id === "my-pet" ? <img src={petBento} alt="Seu Pet" /> : null}
                    <span className="experience-icon">
                      <Icon size={22} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="discoveries-section">
            <div className="section-heading">
              <h2>Descobertas</h2>
              <span>Dados e rotas existentes</span>
            </div>
            <div className="discovery-layout">
              {discoveries.map((item) => {
                const Icon = icons[item.icon];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="store-discovery pressable"
                    onClick={() => onNavigate(item.path)}
                  >
                    <span>
                      <Icon size={20} />
                    </span>
                    <span>
                      <small>
                        {item.relationshipOptional ? "RELACIONAMENTO OPCIONAL" : "DESCOBERTA"}
                      </small>
                      <strong>{item.title}</strong>
                      <em>{item.description}</em>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
