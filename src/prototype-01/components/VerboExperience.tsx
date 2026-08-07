"use client";

import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  Headphones,
  Highlighter,
  History,
  Library,
  ListMusic,
  MessageCircle,
  Minus,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Repeat2,
  Search,
  Send,
  Share2,
  Sparkles,
  Sun,
  Timer,
  Type,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useState } from "react";
import "../styles/VerboExperience.css";

type VerboTab = "Hoje" | "Bíblia" | "Explorar" | "Biblioteca";
type LibraryTab =
  | "Notas"
  | "Marcações"
  | "Favoritos"
  | "Estudos"
  | "Planos"
  | "Downloads"
  | "Histórico";
type ReaderTheme = "light" | "sepia" | "dark";
type DemoState =
  | "normal"
  | "loading"
  | "offline"
  | "no-plan"
  | "no-notes"
  | "unavailable"
  | "error";

const verses = [
  {
    number: 1,
    text: "Jesus, porém, foi para o monte das Oliveiras.",
  },
  {
    number: 2,
    text: "De madrugada voltou novamente para o templo, e todo o povo se reuniu em volta dele. Jesus estava sentado e os ensinava.",
  },
  {
    number: 3,
    text: "Os escribas e fariseus trouxeram à presença de Jesus uma mulher surpreendida em adultério e, fazendo-a ficar de pé no meio de todos,",
  },
  {
    number: 4,
    text: "disseram a Jesus: Mestre, esta mulher foi surpreendida em flagrante adultério.",
  },
  {
    number: 5,
    text: "Na Lei, Moisés nos ordenou que tais mulheres sejam apedrejadas. E o senhor, o que tem a dizer?",
  },
  {
    number: 6,
    text: "Eles diziam isso tentando-o, para terem de que o acusar. Mas Jesus, inclinando-se, escrevia na terra com o dedo.",
  },
  {
    number: 7,
    text: "Como eles insistiam na pergunta, Jesus se levantou e lhes disse: Quem de vocês estiver sem pecado seja o primeiro a atirar uma pedra nela.",
  },
  {
    number: 8,
    text: "E, tornando a inclinar-se, continuou a escrever no chão.",
  },
  {
    number: 9,
    text: "Mas eles, ouvindo isto, foram saindo um por um, a começar pelos mais velhos, ficando só Jesus e a mulher no meio onde estava.",
  },
  {
    number: 10,
    text: "Levantando-se, Jesus perguntou a ela: Mulher, onde estão eles? Ninguém condenou você?",
  },
  {
    number: 11,
    text: "Ela respondeu: Ninguém, Senhor. Então Jesus disse: Também eu não condeno você; vá e não peque mais.",
  },
] as const;

const plans = [
  ["Bíblia em um ano", "Equipe Verbo", "365 dias", "18%"],
  ["Novo Testamento", "Sociedade Bíblica", "90 dias", "42%"],
  ["Evangelhos", "Equipe Verbo", "30 dias", "Dia 8"],
  ["Salmos para a esperança", "Equipe Verbo", "14 dias", "Novo"],
  ["Sabedoria para relacionamentos", "Conteúdo aprovado", "10 dias", "Novo"],
] as const;

const libraryTabs: LibraryTab[] = [
  "Notas",
  "Marcações",
  "Favoritos",
  "Estudos",
  "Planos",
  "Downloads",
  "Histórico",
];

class VerboBoundary extends Component<
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
        <div className="verbo-local-error" role="alert">
          <CircleAlert size={28} />
          <strong>O Verbo encontrou um problema</strong>
          <span>As outras áreas continuam funcionando normalmente.</span>
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

function MiniPlayer({
  expanded,
  setExpanded,
  playing,
  setPlaying,
  onClose,
}: {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  onClose: () => void;
}) {
  if (expanded) {
    return (
      <div className="verbo-player-expanded" role="dialog" aria-modal="true">
        <header>
          <button aria-label="Recolher player" onClick={() => setExpanded(false)}>
            <ArrowLeft size={21} />
          </button>
          <span>Áudio bíblico</span>
          <button aria-label="Fechar player" onClick={onClose}>
            <X size={21} />
          </button>
        </header>
        <div className="verbo-audio-art">
          <BookOpen size={42} />
          <span>JOÃO</span>
          <strong>Capítulo 8</strong>
          <small>Nova Almeida Atualizada</small>
        </div>
        <div className="verbo-audio-meta">
          <span>Áudio oficial</span>
          <h2>João 8</h2>
          <p>Leitura acompanhada · versículo 7</p>
        </div>
        <div className="verbo-audio-progress">
          <span style={{ width: "38%" }} />
        </div>
        <div className="verbo-audio-time">
          <span>08:42</span>
          <span>22:58</span>
        </div>
        <div className="verbo-audio-controls">
          <button aria-label="Velocidade">1×</button>
          <button aria-label="Voltar 15 segundos">−15</button>
          <button
            className="primary"
            aria-label={playing ? "Pausar" : "Reproduzir"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause /> : <Play fill="currentColor" />}
          </button>
          <button aria-label="Avançar 15 segundos">+15</button>
          <button aria-label="Repetição">
            <Repeat2 size={20} />
          </button>
        </div>
        <div className="verbo-audio-options">
          <button>
            <ListMusic size={19} /> Fila
          </button>
          <button>
            <Timer size={19} /> Temporizador
          </button>
          <button>
            <Type size={19} /> Acompanhar
          </button>
        </div>
        <div className="verbo-audio-source">
          <Volume2 size={16} />
          Origem: Áudio oficial
        </div>
      </div>
    );
  }

  return (
    <div className="verbo-mini-player">
      <button className="verbo-mini-copy" onClick={() => setExpanded(true)}>
        <span className="verbo-mini-art">
          <BookOpen size={18} />
        </span>
        <span>
          <strong>João 8</strong>
          <small>Áudio oficial · 08:42</small>
        </span>
      </button>
      <button
        aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
      </button>
      <button aria-label="Fechar player" onClick={onClose}>
        <X size={19} />
      </button>
      <span className="verbo-mini-progress" style={{ width: "38%" }} />
    </div>
  );
}

function VerseActions({
  selected,
  onClose,
  showToast,
  openShare,
  openNote,
  openPlayer,
}: {
  selected: number[];
  onClose: () => void;
  showToast: (message: string) => void;
  openShare: () => void;
  openNote: () => void;
  openPlayer: () => void;
}) {
  const actions = [
    [Highlighter, "Destacar"],
    [FileText, "Anotar"],
    [Bookmark, "Favoritar"],
    [BookMarked, "Copiar"],
    [Share2, "Compartilhar"],
    [Headphones, "Ouvir"],
    [Library, "Comparar versões"],
    [BookOpen, "Abrir contexto"],
    [Plus, "Adicionar ao estudo"],
    [MessageCircle, "Criar publicação"],
  ] as const;

  return (
    <div className="verbo-sheet-backdrop" onMouseDown={onClose}>
      <section
        className="verbo-sheet"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header>
          <div>
            <strong>
              João 8:{Math.min(...selected)}
              {selected.length > 1 ? `–${Math.max(...selected)}` : ""}
            </strong>
            <span>{selected.length} versículo(s) selecionado(s)</span>
          </div>
          <button aria-label="Fechar ações" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="verbo-action-grid">
          {actions.map(([Icon, label]) => (
            <button
              key={label}
              onClick={() => {
                if (label === "Compartilhar") openShare();
                else if (label === "Anotar") openNote();
                else if (label === "Ouvir") openPlayer();
                else showToast(`${label} preparado`);
              }}
            >
              <span>
                <Icon size={19} />
              </span>
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function BibleReader({
  onClose,
  showToast,
  onOpenPlayer,
}: {
  onClose: () => void;
  showToast: (message: string) => void;
  onOpenPlayer: () => void;
}) {
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = useState(20);
  const [selected, setSelected] = useState<number[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const selectVerse = (number: number) => {
    setSelected((current) =>
      current.includes(number) ? current.filter((item) => item !== number) : [...current, number],
    );
  };

  return (
    <div className={`verbo-reader theme-${theme}`}>
      <header className="verbo-reader-header">
        <button aria-label="Voltar para o Verbo" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <button className="reader-location" onClick={() => showToast("Seletor de livro aberto")}>
          <strong>João 8</strong>
          <span>NAA</span>
        </button>
        <button aria-label="Controles de leitura" onClick={() => setToolsOpen(true)}>
          <Type size={20} />
        </button>
        <button aria-label="Mais opções">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <main className="verbo-reader-scroll">
        <div className="verbo-reader-title">
          <span>EVANGELHO SEGUNDO JOÃO</span>
          <h1>Capítulo 8</h1>
          <p>A mulher apanhada em adultério</p>
        </div>
        <article
          className="verbo-passage"
          style={{ "--reader-font-size": `${fontSize}px` } as React.CSSProperties}
        >
          {verses.map((verse) => (
            <button
              key={verse.number}
              className={`${selected.includes(verse.number) ? "selected" : ""} ${
                verse.number === 7 ? "audio-current" : ""
              }`}
              onClick={() => selectVerse(verse.number)}
            >
              <sup>{verse.number}</sup>
              <span>{verse.text}</span>
            </button>
          ))}
        </article>
        <div className="verbo-reader-next">
          <span>PRÓXIMO CAPÍTULO</span>
          <strong>João 9</strong>
          <ChevronRight size={20} />
        </div>
      </main>

      <div className="verbo-reading-progress">
        <span style={{ width: "68%" }} />
      </div>

      {selected.length > 0 && (
        <button className="verbo-selection-bar" onClick={() => setToolsOpen(true)}>
          <span>{selected.length} selecionado(s)</span>
          <strong>
            Ações <ChevronRight size={16} />
          </strong>
        </button>
      )}

      {toolsOpen && selected.length > 0 && (
        <VerseActions
          selected={selected}
          onClose={() => setToolsOpen(false)}
          showToast={showToast}
          openShare={() => {
            setToolsOpen(false);
            setShareOpen(true);
          }}
          openNote={() => {
            setToolsOpen(false);
            setNoteOpen(true);
          }}
          openPlayer={() => {
            setToolsOpen(false);
            onOpenPlayer();
          }}
        />
      )}

      {toolsOpen && selected.length === 0 && (
        <div className="verbo-sheet-backdrop" onMouseDown={() => setToolsOpen(false)}>
          <section
            className="verbo-sheet reader-settings"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <header>
              <strong>Aparência da leitura</strong>
              <button aria-label="Fechar" onClick={() => setToolsOpen(false)}>
                <X size={20} />
              </button>
            </header>
            <div className="reader-theme-options">
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                <Sun size={18} /> Claro
              </button>
              <button
                className={theme === "sepia" ? "active" : ""}
                onClick={() => setTheme("sepia")}
              >
                <BookOpen size={18} /> Sépia
              </button>
              <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>
                <Moon size={18} /> Escuro
              </button>
            </div>
            <div className="reader-size-control">
              <button
                aria-label="Diminuir fonte"
                onClick={() => setFontSize((value) => Math.max(17, value - 1))}
              >
                <Minus size={18} />
              </button>
              <span>Tamanho do texto · {fontSize}px</span>
              <button
                aria-label="Aumentar fonte"
                onClick={() => setFontSize((value) => Math.min(26, value + 1))}
              >
                <Plus size={18} />
              </button>
            </div>
            <label className="verbo-toggle-row">
              <span>
                <strong>Rolagem automática</strong>
                <small>Durante a leitura acompanhada</small>
              </span>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(event) => setAutoScroll(event.target.checked)}
              />
            </label>
            <button
              className="verbo-version-button"
              onClick={() => showToast("Versão alterada para NVT")}
            >
              <span>
                <strong>Versão bíblica</strong>
                <small>Nova Almeida Atualizada (NAA)</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </section>
        </div>
      )}

      {shareOpen && (
        <div className="verbo-modal-backdrop">
          <section className="verbo-share-modal">
            <button aria-label="Fechar" onClick={() => setShareOpen(false)}>
              <X />
            </button>
            <div className="verbo-share-card">
              <BookOpen size={24} />
              <blockquote>
                “Quem de vocês estiver sem pecado seja o primeiro a atirar uma pedra nela.”
              </blockquote>
              <strong>João 8:7</strong>
              <span>Nova Almeida Atualizada</span>
              <small>VaiDarNamoro · Verbo</small>
            </div>
            <p>O texto bíblico é preservado e não pode ser editado.</p>
            <button
              onClick={() => {
                setShareOpen(false);
                showToast("Cartão pronto para compartilhar");
              }}
            >
              <Share2 size={18} /> Compartilhar cartão
            </button>
          </section>
        </div>
      )}

      {noteOpen && (
        <div className="verbo-modal-backdrop">
          <section className="verbo-note-modal">
            <header>
              <strong>Nova nota privada</strong>
              <button aria-label="Fechar" onClick={() => setNoteOpen(false)}>
                <X />
              </button>
            </header>
            <span>João 8:{Math.min(...selected)} · vinculada automaticamente</span>
            <input aria-label="Título da nota" placeholder="Título da nota" />
            <textarea
              aria-label="Conteúdo da nota"
              placeholder="Escreva o que você quer guardar..."
            />
            <input aria-label="Tags da nota" placeholder="Tags: graça, estudo..." />
            <button
              onClick={() => {
                setNoteOpen(false);
                showToast("Nota privada salva");
              }}
            >
              Salvar nota
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

function TodayView({
  openReader,
  openPlayer,
  openPlan,
  openNote,
  state,
  showToast,
}: {
  openReader: () => void;
  openPlayer: () => void;
  openPlan: () => void;
  openNote: () => void;
  state: DemoState;
  showToast: (message: string) => void;
}) {
  if (state === "loading") {
    return (
      <div className="verbo-loading" aria-label="Carregando Verbo">
        <span />
        <span />
        <div>
          <i />
          <i />
        </div>
        <span />
      </div>
    );
  }

  return (
    <div className="verbo-today">
      {state === "offline" && (
        <div className="verbo-state-banner">
          <WifiOff size={17} />
          <span>Você está offline. Conteúdos salvos continuam disponíveis.</span>
        </div>
      )}
      <button className="verbo-continue-card" onClick={openReader}>
        <div>
          <span>CONTINUAR LEITURA</span>
          <h2>João 8</h2>
          <p>Graça, verdade e uma nova direção.</p>
          <strong>
            Continuar do versículo 7 <ChevronRight size={17} />
          </strong>
        </div>
        <div className="verbo-book-art">
          <BookOpen />
          <span>68%</span>
        </div>
      </button>

      <section className="verbo-daily">
        <div className="verbo-section-heading">
          <span>PALAVRA DO DIA</span>
          <button onClick={() => showToast("Salmos 28 favoritado")}>
            <Bookmark size={18} />
          </button>
        </div>
        <blockquote>
          “O Senhor é a minha força e o meu escudo; nele o meu coração confia.”
        </blockquote>
        <strong>Salmos 28:7 · NAA</strong>
        <button onClick={() => showToast("Salmos 28 aberto")}>Ler contexto</button>
      </section>

      {state !== "no-plan" && (
        <section className="verbo-plan-card" onClick={openPlan}>
          <div className="verbo-section-heading">
            <span>PLANO EM ANDAMENTO</span>
            <small>Dia 8 de 30</small>
          </div>
          <h2>Caminhando pelos Evangelhos</h2>
          <p>Hoje · João 8:1–20 · 7 minutos</p>
          <div>
            <span style={{ width: "27%" }} />
          </div>
          <button>
            Continuar plano <ChevronRight size={17} />
          </button>
        </section>
      )}

      <div className="verbo-two-up">
        <button className="verbo-audio-card" onClick={openPlayer}>
          <span>
            <Headphones size={20} />
          </span>
          <small>OUVIR NOVAMENTE</small>
          <strong>João 8</strong>
          <em>Áudio oficial · 08:42</em>
          <Play size={19} fill="currentColor" />
        </button>
        {state !== "no-notes" && (
          <button className="verbo-note-card" onClick={openNote}>
            <span>
              <FileText size={20} />
            </span>
            <small>NOTA RECENTE</small>
            <strong>Graça sem relativizar a verdade</strong>
            <em>João 8:7–11 · ontem</em>
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <section className="verbo-challenge-card">
        <div>
          <span>DESAFIO EDUCATIVO</span>
          <h2>Você reconhece a ordem dos Evangelhos?</h2>
          <p>Uma revisão curta, sem ranking e no seu ritmo.</p>
        </div>
        <button onClick={() => showToast("Desafio iniciado: Mateus, Marcos, Lucas e João")}>
          Começar
        </button>
      </section>

      <article className="verbo-editorial">
        <span>CONTEÚDO EDITORIAL APROVADO</span>
        <h2>Como ler uma passagem dentro do seu contexto?</h2>
        <p>Um guia breve para observar texto, gênero, contexto e interpretação.</p>
        <button onClick={() => showToast("Estudo editorial aberto")}>Ler estudo</button>
      </article>
    </div>
  );
}

function ExploreFaith({ showToast }: { showToast: (message: string) => void }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);
  const [mode, setMode] = useState<"Busca" | "Conversa">("Conversa");
  const examples = [
    "O que a Bíblia diz sobre ansiedade?",
    "Qual é o contexto de João 8:7?",
    "Como diferentes cristãos entendem o milênio?",
  ];

  return (
    <div className="verbo-explore">
      <div className="verbo-mode-switch">
        {(["Busca", "Conversa"] as const).map((item) => (
          <button
            key={item}
            className={mode === item ? "active" : ""}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <header>
        <span>
          <Sparkles size={20} />
        </span>
        <h2>{mode === "Conversa" ? "Explore com fundamento" : "Encontre na Bíblia"}</h2>
        <p>
          {mode === "Conversa"
            ? "Respostas organizadas para separar o texto bíblico do contexto e da interpretação."
            : "Pesquise palavras, temas, pessoas, lugares e referências."}
        </p>
      </header>
      <form
        className="verbo-question"
        onSubmit={(event) => {
          event.preventDefault();
          if (!question.trim()) return;
          setAsked(true);
        }}
      >
        <Search size={19} />
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            mode === "Conversa" ? "Faça uma pergunta sobre a Bíblia" : "Busque na Bíblia"
          }
        />
        <button aria-label="Enviar pergunta">
          <Send size={19} />
        </button>
      </form>
      {!asked ? (
        <div className="verbo-question-examples">
          <span>EXEMPLOS</span>
          {examples.map((example) => (
            <button key={example} onClick={() => setQuestion(example)}>
              {example}
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      ) : (
        <article className="verbo-grounded-answer">
          <header>
            <span className="verbo-assistant-mark">
              <BookOpen size={18} />
            </span>
            <div>
              <strong>Verbo</strong>
              <small>Resposta fundamentada</small>
            </div>
          </header>
          <section>
            <span>TEXTO BÍBLICO</span>
            <p>
              “Não fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidas diante de
              Deus as petições...”
            </p>
            <button onClick={() => showToast("Filipenses 4:6–7 aberto")}>
              Filipenses 4:6–7 · NAA
            </button>
          </section>
          <section>
            <span>CONTEXTO</span>
            <p>
              Paulo escreve a uma comunidade real, em meio a tensões, apontando oração, gratidão e
              vida comunitária como resposta prática à inquietação.
            </p>
          </section>
          <section>
            <span>INTERPRETAÇÃO</span>
            <p>
              O texto não trata a ansiedade como falta de fé nem promete ausência imediata de
              sofrimento. Ele convida a levar a preocupação a Deus e receber uma paz que guarda
              mente e coração.
            </p>
          </section>
          <div className="verbo-answer-note">
            <CircleAlert size={16} />
            Em temas com leituras distintas, o Verbo apresenta as interpretações de forma
            equilibrada e separadas do texto.
          </div>
          <div className="verbo-answer-actions">
            <button>
              <Bookmark size={17} /> Salvar
            </button>
            <button>
              <Plus size={17} /> Estudo
            </button>
            <button>
              <Share2 size={17} /> Compartilhar
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

function LibraryView({
  active,
  setActive,
  state,
  openPlan,
  openNote,
  showToast,
}: {
  active: LibraryTab;
  setActive: (value: LibraryTab) => void;
  state: DemoState;
  openPlan: () => void;
  openNote: () => void;
  showToast: (message: string) => void;
}) {
  const empty = active === "Notas" && state === "no-notes";

  return (
    <div className="verbo-library">
      <nav aria-label="Biblioteca do Verbo">
        {libraryTabs.map((item) => (
          <button
            key={item}
            className={active === item ? "active" : ""}
            onClick={() => setActive(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {empty ? (
        <div className="verbo-empty-state">
          <FileText size={28} />
          <h2>Suas notas começam aqui</h2>
          <p>Selecione um versículo durante a leitura para guardar uma reflexão privada.</p>
          <button onClick={openNote}>Criar primeira nota</button>
        </div>
      ) : active === "Notas" ? (
        <div className="verbo-library-list">
          <label>
            <Search size={18} />
            <input aria-label="Buscar nas suas notas" placeholder="Buscar nas suas notas" />
          </label>
          {[
            ["Graça sem relativizar a verdade", "João 8:7–11", "graça · estudo"],
            ["A paz que guarda", "Filipenses 4:6–7", "ansiedade · oração"],
            ["Força e confiança", "Salmos 28:7", "esperança"],
          ].map(([title, ref, tags]) => (
            <button key={title} onClick={openNote}>
              <span>
                <FileText size={19} />
              </span>
              <div>
                <strong>{title}</strong>
                <small>{ref}</small>
                <em>{tags}</em>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      ) : active === "Marcações" ? (
        <div className="verbo-highlights">
          <div className="verbo-highlight-filters">
            {["Promessas", "Sabedoria", "Oração", "Revisar"].map((item, index) => (
              <button key={item}>
                <i className={`mark-${index}`} />
                {item}
              </button>
            ))}
          </div>
          {[
            ["João", "8:7", "Quem de vocês estiver sem pecado..."],
            ["Salmos", "28:7", "O Senhor é a minha força e o meu escudo..."],
            ["Filipenses", "4:6", "Não fiquem preocupados com coisa alguma..."],
          ].map(([book, ref, text], index) => (
            <button key={`${book}${ref}`} className={`highlight-${index}`}>
              <span>
                {book} {ref}
              </span>
              <p>{text}</p>
              <small>
                Categoria: {index === 0 ? "Sabedoria" : index === 1 ? "Promessas" : "Oração"}
              </small>
            </button>
          ))}
        </div>
      ) : active === "Planos" ? (
        <div className="verbo-plans">
          {plans.map(([title, author, duration, progress]) => (
            <button key={title} onClick={openPlan}>
              <span className="plan-art">
                <BookOpen size={22} />
              </span>
              <div>
                <strong>{title}</strong>
                <small>
                  {author} · {duration}
                </small>
                <em>{progress}</em>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      ) : active === "Downloads" ? (
        <div className="verbo-downloads">
          <div className="storage-card">
            <div>
              <span>Armazenamento do Verbo</span>
              <strong>184 MB de 1 GB</strong>
            </div>
            <span>
              <i style={{ width: "18%" }} />
            </span>
            <small>Downloads desta demonstração não usam armazenamento real.</small>
          </div>
          {[
            ["João", "Livro · NAA · 38 MB", "Concluído"],
            ["Salmos para a esperança", "Plano · 12 MB", "64%"],
            ["Evangelhos", "Playlist · 86 MB", "Na fila"],
          ].map(([title, meta, progress]) => (
            <button key={title} onClick={() => showToast(`${title}: download simulado`)}>
              <Download size={20} />
              <span>
                <strong>{title}</strong>
                <small>{meta}</small>
              </span>
              <em>{progress}</em>
            </button>
          ))}
          <label className="verbo-toggle-row">
            <span>
              <strong>Baixar somente por Wi‑Fi</strong>
              <small>Evita uso de dados móveis</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      ) : active === "Histórico" ? (
        <div className="verbo-timeline">
          {[
            ["Hoje", "João 8", "Leitura · 9 min"],
            ["Ontem", "A paz que guarda", "Nota atualizada"],
            ["25 jul", "Salmos 23", "Áudio · 12 min"],
          ].map(([date, title, detail]) => (
            <button key={`${date}${title}`}>
              <Clock3 size={18} />
              <span>
                <small>{date}</small>
                <strong>{title}</strong>
                <em>{detail}</em>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="verbo-library-list">
          {[
            [
              active === "Favoritos" ? Bookmark : BookMarked,
              active === "Favoritos" ? "Salmos 28:7" : "Estudo sobre João 8",
              "Conteúdo privado",
            ],
            [
              BookOpen,
              active === "Estudos" ? "Graça e verdade" : "Evangelho de João",
              "Atualizado recentemente",
            ],
            [History, "Sua caminhada de leitura", "Progresso privado"],
          ].map(([Icon, title, detail]) => {
            const RowIcon = Icon as typeof Bookmark;
            return (
              <button key={String(title)}>
                <span>
                  <RowIcon size={19} />
                </span>
                <div>
                  <strong>{String(title)}</strong>
                  <small>{String(detail)}</small>
                </div>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlanDetail({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <div className="verbo-detail-overlay">
      <header>
        <button aria-label="Voltar" onClick={onClose}>
          <ArrowLeft />
        </button>
        <strong>Plano de leitura</strong>
        <button aria-label="Mais opções">
          <MoreHorizontal />
        </button>
      </header>
      <main>
        <div className="verbo-plan-cover">
          <BookOpen />
          <span>30 DIAS</span>
        </div>
        <span>PLANO EM ANDAMENTO</span>
        <h1>Caminhando pelos Evangelhos</h1>
        <p>
          Leia os quatro Evangelhos observando como cada autor apresenta a vida, o ensino, a morte e
          a ressurreição de Jesus.
        </p>
        <dl>
          <div>
            <dt>Autoria</dt>
            <dd>Equipe Verbo</dd>
          </div>
          <div>
            <dt>Progresso</dt>
            <dd>8 de 30 dias</dd>
          </div>
          <div>
            <dt>Privacidade</dt>
            <dd>Somente você</dd>
          </div>
        </dl>
        <div className="verbo-plan-progress">
          <span style={{ width: "27%" }} />
        </div>
        <section>
          <span>HOJE · DIA 8</span>
          <h2>Graça e verdade</h2>
          <p>João 8:1–20 · 7 minutos</p>
          <button
            onClick={() => {
              onClose();
              showToast("Dia 8 aberto no leitor");
            }}
          >
            Continuar leitura
          </button>
        </section>
        <button className="secondary" onClick={() => showToast("Plano pausado")}>
          Pausar plano
        </button>
      </main>
    </div>
  );
}

function VerboContent({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<VerboTab>("Hoje");
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("Notas");
  const [readerOpen, setReaderOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [demoState, setDemoState] = useState<DemoState>("normal");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = new URLSearchParams(window.location.search).get("verboState");
    if (
      state === "loading" ||
      state === "offline" ||
      state === "no-plan" ||
      state === "no-notes" ||
      state === "unavailable" ||
      state === "error"
    ) {
      const applyState = window.setTimeout(() => setDemoState(state), 0);
      return () => window.clearTimeout(applyState);
    }
  }, []);

  const openDownloads = () => {
    setLibraryTab("Downloads");
    setTab("Biblioteca");
    setDownloadsOpen(false);
  };

  if (demoState === "error") {
    return (
      <div className="verbo-experience">
        <div className="verbo-inline-error">
          <CircleAlert size={28} />
          <h2>Uma parte do Verbo não carregou</h2>
          <p>Seu estado foi preservado e o restante do aplicativo continua disponível.</p>
          <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
          <button className="secondary" onClick={onClose}>
            Voltar para Explorar
          </button>
        </div>
      </div>
    );
  }

  if (readerOpen) {
    return (
      <BibleReader
        onClose={() => setReaderOpen(false)}
        showToast={showToast}
        onOpenPlayer={() => {
          setPlayerOpen(true);
          setPlayerExpanded(true);
        }}
      />
    );
  }

  return (
    <div
      className="verbo-experience"
      data-action-context="verbo"
      data-action-title="Verbo"
      data-immersive-surface="verbo"
      data-state-preserved="true"
    >
      <header className="verbo-topbar">
        <button aria-label="Voltar para Explorar" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <h1>Verbo</h1>
        <div>
          <button
            aria-label="Buscar no Verbo"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("vdn-open-global-search", { detail: "Verbo" }))
            }
          >
            <Search size={20} />
          </button>
          <button
            aria-label="Criar no Verbo"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("vdn-open-create-center", { detail: "Verbo" }))
            }
          >
            <Plus size={20} />
          </button>
          <button aria-label="Último ponto" onClick={() => setReaderOpen(true)}>
            <History size={20} />
          </button>
          <button aria-label="Downloads" onClick={() => setDownloadsOpen(true)}>
            <Download size={20} />
          </button>
        </div>
      </header>
      <nav className="verbo-primary-tabs" aria-label="Áreas do Verbo">
        {(["Hoje", "Bíblia", "Explorar", "Biblioteca"] as VerboTab[]).map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <div className="verbo-layout">
        <main className="verbo-main">
          {tab === "Hoje" && (
            <TodayView
              openReader={() => setReaderOpen(true)}
              openPlayer={() => setPlayerOpen(true)}
              openPlan={() => setPlanOpen(true)}
              openNote={() => setNoteOpen(true)}
              state={demoState}
              showToast={showToast}
            />
          )}
          {tab === "Bíblia" && (
            <div className="verbo-bible-entry">
              <header>
                <span>LEITURA BÍBLICA</span>
                <h2>Escolha onde continuar</h2>
                <p>Seu ponto mais recente está salvo neste protótipo.</p>
              </header>
              <button className="verbo-last-reading" onClick={() => setReaderOpen(true)}>
                <span>
                  <BookOpen size={22} />
                </span>
                <div>
                  <small>ÚLTIMO PONTO</small>
                  <strong>João 8:7</strong>
                  <em>NAA · 68% do capítulo</em>
                </div>
                <ChevronRight />
              </button>
              {demoState === "unavailable" ? (
                <div className="verbo-unavailable">
                  <CircleAlert size={24} />
                  <strong>Capítulo indisponível</strong>
                  <span>Tente novamente quando estiver conectado.</span>
                </div>
              ) : (
                <div className="verbo-book-picker">
                  <label>
                    <Search size={18} />
                    <input
                      aria-label="Buscar livro, capítulo ou versículo"
                      placeholder="Livro, capítulo ou versículo"
                    />
                  </label>
                  <span>TESTAMENTOS</span>
                  <div>
                    <button className="active">Antigo Testamento</button>
                    <button>Novo Testamento</button>
                  </div>
                  <div className="verbo-book-list">
                    {["Gênesis", "Êxodo", "Salmos", "Provérbios", "Mateus", "João", "Romanos"].map(
                      (book) => (
                        <button key={book} onClick={() => setReaderOpen(true)}>
                          <strong>{book}</strong>
                          <span>
                            {book === "Salmos" ? "150" : book === "João" ? "21" : "40"} capítulos
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "Explorar" && <ExploreFaith showToast={showToast} />}
          {tab === "Biblioteca" && (
            <LibraryView
              active={libraryTab}
              setActive={setLibraryTab}
              state={demoState}
              openPlan={() => setPlanOpen(true)}
              openNote={() => setNoteOpen(true)}
              showToast={showToast}
            />
          )}
        </main>

        <aside className="verbo-context-panel">
          {tab === "Bíblia" ? (
            <>
              <span>ÍNDICE</span>
              <h2>João</h2>
              <p>O Verbo se fez carne e habitou entre nós.</p>
              <div className="verbo-chapter-grid">
                {Array.from({ length: 21 }, (_, index) => (
                  <button
                    key={index}
                    className={index === 7 ? "active" : ""}
                    onClick={() => setReaderOpen(true)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          ) : tab === "Biblioteca" ? (
            <>
              <span>SEU PROGRESSO</span>
              <h2>Uma caminhada privada</h2>
              <div className="verbo-private-stat">
                <BookOpen />
                <span>
                  <strong>12 capítulos</strong>
                  <small>lidos neste mês</small>
                </span>
              </div>
              <div className="verbo-private-stat">
                <Check />
                <span>
                  <strong>2 planos</strong>
                  <small>concluídos no seu ritmo</small>
                </span>
              </div>
              <p>Nenhum dado é usado para comparar sua vida espiritual com outras pessoas.</p>
            </>
          ) : (
            <>
              <span>PLANO ATUAL</span>
              <h2>Caminhando pelos Evangelhos</h2>
              <p>Dia 8 de 30 · João 8:1–20</p>
              <div className="verbo-context-progress">
                <span style={{ width: "27%" }} />
              </div>
              <button onClick={() => setPlanOpen(true)}>Continuar plano</button>
              <hr />
              <span>REFERÊNCIA RECENTE</span>
              <button className="verbo-reference-link" onClick={() => setReaderOpen(true)}>
                Salmos 28:7 <ChevronRight size={16} />
              </button>
            </>
          )}
        </aside>
      </div>

      {playerOpen && (
        <MiniPlayer
          expanded={playerExpanded}
          setExpanded={setPlayerExpanded}
          playing={playing}
          setPlaying={setPlaying}
          onClose={() => {
            setPlayerOpen(false);
            setPlayerExpanded(false);
          }}
        />
      )}

      {searchOpen && (
        <div className="verbo-sheet-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <section
            className="verbo-sheet verbo-search-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <header>
              <strong>Buscar no Verbo</strong>
              <button aria-label="Fechar busca no Verbo" onClick={() => setSearchOpen(false)}>
                <X />
              </button>
            </header>
            <label>
              <Search size={18} />
              <input
                autoFocus
                aria-label="Buscar no Verbo"
                placeholder="Passagem, tema, nota ou plano"
              />
            </label>
            <span>BUSCAS RECENTES</span>
            {["João 8:7", "ansiedade", "esperança", "Salmos"].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setSearchOpen(false);
                  showToast(`${item} aberto`);
                }}
              >
                <History size={17} />
                {item}
                <ChevronRight size={17} />
              </button>
            ))}
          </section>
        </div>
      )}

      {downloadsOpen && (
        <div className="verbo-sheet-backdrop" onMouseDown={() => setDownloadsOpen(false)}>
          <section
            className="verbo-sheet verbo-download-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <header>
              <strong>Downloads e offline</strong>
              <button onClick={() => setDownloadsOpen(false)}>
                <X />
              </button>
            </header>
            <p>
              Prepare capítulos, livros, planos, playlists e versões para consultar sem conexão.
            </p>
            <button onClick={openDownloads}>
              <Download size={19} /> Gerenciar downloads <ChevronRight size={17} />
            </button>
            <label className="verbo-toggle-row">
              <span>
                <strong>Somente por Wi‑Fi</strong>
                <small>Recomendado</small>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
          </section>
        </div>
      )}

      {planOpen && <PlanDetail onClose={() => setPlanOpen(false)} showToast={showToast} />}

      {noteOpen && (
        <div className="verbo-modal-backdrop">
          <section className="verbo-note-modal">
            <header>
              <strong>Nota privada</strong>
              <button onClick={() => setNoteOpen(false)}>
                <X />
              </button>
            </header>
            <span>João 8:7–11</span>
            <input defaultValue="Graça sem relativizar a verdade" />
            <textarea defaultValue="Jesus não ignora o pecado, mas também não reduz a pessoa ao seu pior momento. A graça conduz a uma nova direção." />
            <input defaultValue="graça, estudo" />
            <button
              onClick={() => {
                setNoteOpen(false);
                showToast("Nota atualizada");
              }}
            >
              Salvar alterações
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default function VerboExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  if (!props.visible) {
    return <div className="verbo-experience is-hidden" aria-hidden="true" />;
  }

  return (
    <VerboBoundary onClose={props.onClose}>
      <VerboContent onClose={props.onClose} showToast={props.showToast} />
    </VerboBoundary>
  );
}
