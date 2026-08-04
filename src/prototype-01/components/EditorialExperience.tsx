"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  Globe2,
  Menu,
  MessageCircle,
  Moon,
  Newspaper,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import "../styles/EditorialExperience.css";

type EditorialPage =
  | "home"
  | "noticias"
  | "blog"
  | "devocionais"
  | "depoimentos"
  | "manual"
  | "sobre"
  | "termos"
  | "privacidade"
  | "regras"
  | "contato";

type Entry = {
  id: string;
  kind: "Notícia" | "Artigo" | "Devocional" | "Guia" | "História";
  category: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  reading: string;
  tone: string;
};

const entries: Entry[] = [
  {
    id: "comunidade-acolhe",
    kind: "Notícia",
    category: "Comunidade",
    title: "Uma comunidade que acolhe antes de pedir que você apareça",
    summary:
      "Como a nova entrada do VaiDarNamoro deixa amizade, pertencimento e experiências no centro.",
    date: "28 jul. 2026",
    author: "Equipe VaiDarNamoro",
    reading: "4 min",
    tone: "coral",
  },
  {
    id: "seguranca-contexto",
    kind: "Artigo",
    category: "Segurança",
    title: "Privacidade começa com contexto e escolhas compreensíveis",
    summary: "Um guia direto sobre descoberta, audiência, bloqueio, denúncia e revisão.",
    date: "26 jul. 2026",
    author: "Equipe de Confiança",
    reading: "7 min",
    tone: "ink",
  },
  {
    id: "joao-8",
    kind: "Devocional",
    category: "Fé",
    title: "Luz para caminhar sem fingir que já chegamos",
    summary: "Uma leitura de João 8:12 sobre direção, presença e passos possíveis.",
    date: "25 jul. 2026",
    author: "Equipe Verbo",
    reading: "5 min",
    tone: "violet",
  },
  {
    id: "primeiros-passos",
    kind: "Guia",
    category: "Produto",
    title: "Primeiros passos: encontre seu ritmo dentro da comunidade",
    summary: "Perfil, Espaços, Conversas e experiências sem a obrigação de usar tudo.",
    date: "23 jul. 2026",
    author: "Equipe VaiDarNamoro",
    reading: "6 min",
    tone: "sand",
  },
  {
    id: "cinema-juntos",
    kind: "Notícia",
    category: "Eventos",
    title: "Cinema em comunidade ganha sessões para assistir juntos",
    summary: "Salas sincronizadas, conversa em tempo real e controles claros para anfitriões.",
    date: "22 jul. 2026",
    author: "Equipe de Produto",
    reading: "3 min",
    tone: "night",
  },
  {
    id: "historia-simulada",
    kind: "História",
    category: "Comunidade",
    title: "Encontrar gente da própria região sem transformar isso em vitrine",
    summary: "Exemplo demonstrativo de como uma história autorizada seria apresentada.",
    date: "20 jul. 2026",
    author: "Conteúdo demonstrativo",
    reading: "4 min",
    tone: "coral",
  },
];

const legalSections = {
  termos: [
    [
      "1. Sobre este documento",
      "Este protótipo demonstra a estrutura de leitura dos Termos. O texto jurídico definitivo ainda precisa de revisão e aprovação profissional.",
    ],
    [
      "2. Elegibilidade e conta",
      "Placeholder claro: descrever idade mínima, responsabilidade pelas credenciais e informações necessárias para manter a conta.",
    ],
    [
      "3. Uso da comunidade",
      "Placeholder claro: relacionar uso permitido, limites, regras incorporadas e medidas possíveis.",
    ],
    [
      "4. Conteúdo e propriedade",
      "Placeholder claro: explicar licenças, autoria, remoção e direitos aplicáveis sem ampliar práticas ainda não confirmadas.",
    ],
    [
      "5. Encerramento e recursos",
      "Placeholder claro: explicar suspensão, encerramento, contestação e canais de recurso.",
    ],
  ],
  privacidade: [
    [
      "1. Dados",
      "Conteúdo sujeito a validação: mapear apenas dados que o produto realmente coleta antes da publicação final.",
    ],
    [
      "2. Uso",
      "Conteúdo sujeito a validação: explicar finalidades reais, bases aplicáveis e limites.",
    ],
    [
      "3. Seus controles",
      "Estrutura visual para descoberta, audiência, visibilidade, bloqueios, download e exclusão.",
    ],
    [
      "4. Segurança e retenção",
      "Conteúdo sujeito a validação técnica e jurídica; nenhuma prática foi inventada neste protótipo.",
    ],
    [
      "5. Direitos e contato",
      "Placeholder para direitos aplicáveis, prazos, identidade do controlador e canal confirmado.",
    ],
  ],
  regras: [
    [
      "1. Respeito",
      "Discorde sem atacar. Não use fé, aparência, origem ou vulnerabilidade para constranger alguém.",
    ],
    [
      "2. Segurança e autenticidade",
      "Não se passe por outra pessoa, não tente obter acesso indevido e não compartilhe informações privadas.",
    ],
    [
      "3. Conteúdo",
      "Evite conteúdo sexual, violento, enganoso, fraudulento ou que coloque outras pessoas em risco.",
    ],
    [
      "4. Assédio e fraude",
      "Insistência após limite claro, chantagem, perseguição, fraude e manipulação não são aceitas.",
    ],
    [
      "5. Modo Namoro e eventos",
      "Respeite consentimento, contexto, regras do organizador e os limites de cada pessoa.",
    ],
    [
      "6. Denúncias, medidas e recursos",
      "Denúncias são revisadas. Medidas podem variar e decisões elegíveis oferecem um caminho de recurso.",
    ],
  ],
};

const manualChapters = [
  "Primeiros passos",
  "Perfil",
  "Comunidade",
  "Espaços",
  "Conversas",
  "Eventos",
  "Cinema",
  "Verbo",
  "Pets",
  "Arcade",
  "Loja",
  "Modo Namoro",
  "Segurança",
  "Configurações",
];

class EditorialBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Editorial experience failed locally", error, info);
  }
  render() {
    if (this.state.failed) {
      return (
        <section className="editorial-local-error" role="alert">
          <Newspaper />
          <h1>Este conteúdo não carregou.</h1>
          <p>A comunidade e as outras áreas continuam disponíveis.</p>
          <button onClick={() => this.setState({ failed: false })}>Tentar de novo</button>
          <button className="ghost" onClick={this.props.onClose}>
            Voltar
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

function EditorialHeader({
  isPublic,
  onClose,
  onNavigate,
  onLogin,
}: {
  isPublic: boolean;
  onClose: () => void;
  onNavigate: (page: EditorialPage) => void;
  onLogin: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <header className={`editorial-header ${isPublic ? "is-public" : "is-authenticated"}`}>
      <button className="editorial-back" aria-label="Voltar" onClick={onClose}>
        <ArrowLeft />
      </button>
      <button className="editorial-brand" onClick={() => onNavigate("home")}>
        <img src="/logo-oficial-transparente.png" alt="" />
        <span>VaiDarNamoro</span>
        <small>Editorial</small>
      </button>
      <nav aria-label="Conteúdo editorial">
        <button onClick={() => onNavigate("noticias")}>Notícias</button>
        <button onClick={() => onNavigate("blog")}>Blog</button>
        <button onClick={() => onNavigate("devocionais")}>Devocionais</button>
        <button onClick={() => onNavigate("manual")}>Manual</button>
      </nav>
      <div className="editorial-header-actions">
        {isPublic ? (
          <>
            <button className="editorial-login" onClick={onLogin}>
              Entrar
            </button>
            <button className="editorial-create" onClick={onLogin}>
              Criar conta
            </button>
          </>
        ) : (
          <span className="editorial-avatar">AR</span>
        )}
        <button
          className="editorial-menu-trigger"
          aria-label="Abrir menu editorial"
          aria-expanded={menu}
          onClick={() => setMenu((value) => !value)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>
      {menu && (
        <div className="editorial-mobile-menu">
          {(
            [
              "noticias",
              "blog",
              "devocionais",
              "depoimentos",
              "manual",
              "sobre",
              "termos",
              "privacidade",
              "regras",
            ] as EditorialPage[]
          ).map((item) => (
            <button
              key={item}
              onClick={() => {
                setMenu(false);
                onNavigate(item);
              }}
            >
              {item[0].toUpperCase() + item.slice(1)}
              <ChevronRight />
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function EntryCard({
  entry,
  onOpen,
  size = "",
}: {
  entry: Entry;
  onOpen: () => void;
  size?: string;
}) {
  return (
    <button className={`editorial-card ${entry.tone} ${size}`} onClick={onOpen}>
      <span className="editorial-card-cover">
        {entry.kind === "Devocional" ? (
          <BookOpen />
        ) : entry.kind === "Notícia" ? (
          <Newspaper />
        ) : entry.kind === "História" ? (
          <UsersRound />
        ) : (
          <FileText />
        )}
        <small>{entry.category}</small>
      </span>
      <span className="editorial-card-copy">
        <small>
          {entry.kind} · {entry.reading}
        </small>
        <strong>{entry.title}</strong>
        <p>{entry.summary}</p>
        <em>{entry.date}</em>
      </span>
    </button>
  );
}

function EditorialHome({
  onOpen,
  onNavigate,
}: {
  onOpen: (entry: Entry) => void;
  onNavigate: (page: EditorialPage) => void;
}) {
  return (
    <div className="editorial-home">
      <section className="editorial-home-hero">
        <span className="editorial-kicker">VAIDARNAMORO EDITORIAL</span>
        <h1>Ideias, histórias e guias para viver a comunidade com mais contexto.</h1>
        <p>
          Notícias do produto, desenvolvimento pessoal, fé, segurança e experiências da comunidade
          em uma linguagem clara.
        </p>
      </section>
      <section className="editorial-feature">
        <EntryCard entry={entries[0]} size="featured" onOpen={() => onOpen(entries[0])} />
        <div className="editorial-feature-side">
          <span>MAIS RECENTES</span>
          {entries.slice(1, 4).map((entry) => (
            <EntryCard key={entry.id} entry={entry} onOpen={() => onOpen(entry)} />
          ))}
          <button onClick={() => onNavigate("noticias")}>
            Ver todas as notícias
            <ChevronRight />
          </button>
        </div>
      </section>
      <section className="editorial-devotional-band">
        <div>
          <span className="editorial-kicker">DEVOCIONAL</span>
          <h2>Luz para caminhar sem fingir que já chegamos.</h2>
          <p>João 8:12 · Nova Almeida Atualizada</p>
          <button onClick={() => onOpen(entries[2])}>
            Ler reflexão
            <ChevronRight />
          </button>
        </div>
        <BookOpen />
      </section>
      <section className="editorial-stories">
        <header>
          <div>
            <span className="editorial-kicker">HISTÓRIAS DA COMUNIDADE</span>
            <h2>Experiências que respeitam contexto e autorização.</h2>
          </div>
          <button onClick={() => onNavigate("depoimentos")}>Como publicamos histórias</button>
        </header>
        <EntryCard entry={entries[5]} onOpen={() => onOpen(entries[5])} />
        <article>
          <span>DEMONSTRAÇÃO</span>
          <blockquote>
            “Participei primeiro de um Espaço, depois de uma sessão de Cinema. A conversa veio sem
            precisar forçar presença.”
          </blockquote>
          <strong>Marina · contexto simulado</strong>
        </article>
      </section>
      <section className="editorial-guides">
        <header>
          <span className="editorial-kicker">GUIAS</span>
          <h2>Entenda o produto sem transformar Ajuda e Manual na mesma coisa.</h2>
        </header>
        <div>
          <button onClick={() => onNavigate("manual")}>
            <FileText />
            <strong>Manual do produto</strong>
            <span>Como cada área funciona</span>
            <ChevronRight />
          </button>
          <button onClick={() => onOpen(entries[1])}>
            <ShieldCheck />
            <strong>Controles de segurança</strong>
            <span>Privacidade, denúncia e recurso</span>
            <ChevronRight />
          </button>
          <button onClick={() => onOpen(entries[3])}>
            <Sparkles />
            <strong>Primeiros passos</strong>
            <span>Encontre seu ritmo</span>
            <ChevronRight />
          </button>
        </div>
      </section>
    </div>
  );
}

function Listing({ page, onOpen }: { page: EditorialPage; onOpen: (entry: Entry) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tudo");
  const [loading, setLoading] = useState(false);
  const source =
    page === "noticias"
      ? entries.filter((entry) => entry.kind === "Notícia")
      : page === "devocionais"
        ? entries.filter((entry) => entry.kind === "Devocional")
        : entries.filter((entry) => ["Artigo", "Guia", "História"].includes(entry.kind));
  const categories = ["Tudo", ...new Set(source.map((entry) => entry.category))];
  const filtered = source.filter(
    (entry) =>
      (category === "Tudo" || entry.category === category) &&
      `${entry.title} ${entry.summary} ${entry.author} ${entry.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const title = page === "noticias" ? "Notícias" : page === "devocionais" ? "Devocionais" : "Blog";
  const description =
    page === "noticias"
      ? "Produto, comunidade, eventos, segurança, novidades e manutenção."
      : page === "devocionais"
        ? "Texto bíblico identificado, reflexão separada e aplicação possível."
        : "Guias, histórias, fé, relacionamentos, segurança e desenvolvimento pessoal.";
  return (
    <section className="editorial-listing">
      <header>
        <span className="editorial-kicker">{title.toUpperCase()}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="editorial-search">
        <Search />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título, termo, categoria, autor ou referência"
        />
        <button
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 450);
          }}
        >
          Buscar
        </button>
      </div>
      <div className="editorial-filters">
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
      {loading ? (
        <div className="editorial-loading">
          <i />
          <i />
          <i />
        </div>
      ) : filtered.length ? (
        <div className="editorial-grid">
          {filtered.map((entry, index) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              size={index === 0 ? "wide" : ""}
              onOpen={() => onOpen(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="editorial-empty">
          <Search />
          <h2>Nenhum resultado</h2>
          <p>Tente outro termo ou retire o filtro atual.</p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("Tudo");
            }}
          >
            Limpar busca
          </button>
        </div>
      )}
    </section>
  );
}

function Reader({
  entry,
  isPublic,
  onBack,
  onOpen,
  onOpenVerbo,
  showToast,
}: {
  entry: Entry;
  isPublic: boolean;
  onBack: () => void;
  onOpen: (entry: Entry) => void;
  onOpenVerbo: () => void;
  showToast: (message: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [textSize, setTextSize] = useState(1);
  const [dark, setDark] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const sections =
    entry.kind === "Devocional"
      ? ["Texto bíblico", "Reflexão", "Aplicação", "Oração"]
      : ["Contexto", "O que muda", "Como participar", "Próximos passos"];
  return (
    <article
      className={`editorial-reader ${dark ? "dark" : ""}`}
      style={{ "--reader-scale": textSize } as React.CSSProperties}
    >
      <div className="reader-progress" aria-label="Progresso de leitura demonstrativo">
        <span />
      </div>
      <header className="reader-toolbar">
        <button aria-label="Voltar" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <button onClick={() => setIndexOpen(true)}>
            <Menu />
            Índice
          </button>
          <button
            aria-label="Alterar tamanho do texto"
            onClick={() => setTextSize((value) => (value >= 1.2 ? 0.92 : value + 0.14))}
          >
            <Type />
          </button>
          <button
            aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <Sun /> : <Moon />}
          </button>
          <button
            aria-label={saved ? "Remover dos salvos" : "Salvar"}
            className={saved ? "active" : ""}
            onClick={() => {
              setSaved((value) => !value);
              showToast(saved ? "Removido dos salvos" : "Conteúdo salvo");
            }}
          >
            <Bookmark fill={saved ? "currentColor" : "none"} />
          </button>
          <button aria-label="Compartilhar" onClick={() => setShareOpen(true)}>
            <Send />
          </button>
        </div>
      </header>
      <div className="reader-layout">
        <aside className="reader-index">
          <span>NESTA LEITURA</span>
          {sections.map((section, index) => (
            <a key={section} href={`#reader-${index}`}>
              {section}
            </a>
          ))}
        </aside>
        <main className="reader-content">
          <span className="editorial-kicker">
            {entry.kind.toUpperCase()} · {entry.category.toUpperCase()}
          </span>
          <h1>{entry.title}</h1>
          <p className="reader-summary">{entry.summary}</p>
          <div className="reader-meta">
            <span>{entry.author}</span>
            <span>{entry.date}</span>
            <span>
              <Clock3 />
              {entry.reading}
            </span>
          </div>
          <div className={`reader-cover ${entry.tone}`}>
            {entry.kind === "Devocional" ? <BookOpen /> : <Newspaper />}
            <span>{entry.category}</span>
          </div>
          {entry.kind === "Devocional" ? (
            <>
              <section id="reader-0" className="scripture-block">
                <span>TEXTO BÍBLICO · NAA</span>
                <blockquote>
                  “De novo, lhes falava Jesus, dizendo: Eu sou a luz do mundo. Quem me segue não
                  andará nas trevas; pelo contrário, terá a luz da vida.”
                </blockquote>
                <strong>João 8:12</strong>
              </section>
              <section id="reader-1">
                <h2>Reflexão</h2>
                <p>
                  Jesus apresenta a si mesmo como luz e direção. O texto bíblico termina acima;
                  daqui em diante está a reflexão editorial da equipe, não uma continuação da
                  Escritura nem uma revelação pessoal.
                </p>
                <p>
                  Seguir a luz não significa fingir que todas as dúvidas desapareceram. Significa
                  escolher o próximo passo possível com verdade, acompanhado pela presença de Cristo
                  e pela comunidade.
                </p>
              </section>
              <section id="reader-2">
                <h2>Aplicação</h2>
                <p>
                  Nomeie uma área em que você precisa de direção. Em vez de resolver tudo hoje,
                  escolha uma conversa honesta, uma leitura ou uma decisão pequena que aproxime você
                  da verdade.
                </p>
                <button className="open-verbo" onClick={onOpenVerbo}>
                  <BookOpen />
                  Abrir João 8 no Verbo
                  <ChevronRight />
                </button>
              </section>
              <section id="reader-3">
                <h2>Oração opcional</h2>
                <p>
                  Senhor Jesus, ilumina meus próximos passos e ajuda-me a caminhar com verdade,
                  coragem e humildade. Amém.
                </p>
              </section>
            </>
          ) : (
            <>
              <section id="reader-0">
                <h2>Contexto</h2>
                <p>
                  O VaiDarNamoro está evoluindo de uma experiência centrada apenas em relacionamento
                  para uma comunidade cristã completa. Isso muda a porta de entrada: amizade,
                  pertencimento, conversa e experiências passam a explicar o produto primeiro.
                </p>
                <p>
                  O Modo Namoro continua importante, mas separado e opcional. Ninguém precisa
                  declarar disponibilidade romântica para pertencer.
                </p>
              </section>
              <section id="reader-1">
                <h2>O que muda</h2>
                <p>
                  A Home organiza o que importa para cada pessoa. Comunidade reúne Momentos,
                  publicações, Espaços e eventos. Explorar apresenta experiências sem transformar
                  tudo em um feed infinito.
                </p>
              </section>
              <section id="reader-2">
                <h2>Como participar</h2>
                <p>
                  Você pode começar lendo, entrando em um Espaço ou assistindo a uma sessão.
                  Publicar muito não é requisito; ações de baixa pressão continuam sendo
                  participação real.
                </p>
              </section>
              <section id="reader-3">
                <h2>Próximos passos</h2>
                <p>
                  Conheça as regras, ajuste a privacidade e escolha uma experiência que faça sentido
                  agora. O produto deve guardar seu contexto para você continuar depois.
                </p>
              </section>
            </>
          )}
          <footer className="reader-comments">
            <MessageCircle />
            <div>
              <strong>Comentários {entry.kind === "Notícia" ? "habilitados" : "moderados"}</strong>
              <span>Usam o mesmo sistema da Comunidade; nenhum módulo paralelo foi criado.</span>
            </div>
            <button onClick={() => showToast("Comentários abertos no sistema universal")}>
              Ver comentários
            </button>
          </footer>
        </main>
        <aside className="reader-related">
          <span>RELACIONADOS</span>
          {entries
            .filter((item) => item.id !== entry.id)
            .slice(0, 3)
            .map((item) => (
              <button key={item.id} onClick={() => onOpen(item)}>
                <small>{item.kind}</small>
                <strong>{item.title}</strong>
                <ChevronRight />
              </button>
            ))}
        </aside>
      </div>
      {indexOpen && (
        <div className="reader-sheet" role="dialog" aria-modal="true">
          <button
            className="reader-sheet-backdrop"
            aria-label="Fechar índice"
            onClick={() => setIndexOpen(false)}
          />
          <section>
            <header>
              <strong>Índice</strong>
              <button onClick={() => setIndexOpen(false)}>
                <X />
              </button>
            </header>
            {sections.map((section, index) => (
              <a key={section} href={`#reader-${index}`} onClick={() => setIndexOpen(false)}>
                <span>0{index + 1}</span>
                {section}
                <ChevronRight />
              </a>
            ))}
          </section>
        </div>
      )}
      {shareOpen && (
        <div className="reader-sheet" role="dialog" aria-modal="true">
          <button
            className="reader-sheet-backdrop"
            aria-label="Fechar compartilhamento"
            onClick={() => setShareOpen(false)}
          />
          <section>
            <header>
              <strong>Compartilhar</strong>
              <button onClick={() => setShareOpen(false)}>
                <X />
              </button>
            </header>
            {[
              ["Compartilhar internamente", Send],
              ["Copiar link", Copy],
              ["Compartilhar fora do app", Globe2],
              ["Salvar", Bookmark],
            ].map(([label, Icon]) => {
              const ShareIcon = Icon as typeof Send;
              return (
                <button
                  className="share-row"
                  key={String(label)}
                  onClick={() => {
                    setShareOpen(false);
                    if (label === "Salvar") setSaved(true);
                    showToast(`${String(label)} concluído`);
                  }}
                >
                  <ShareIcon />
                  {String(label)}
                  <ChevronRight />
                </button>
              );
            })}
            {isPublic && (
              <button
                className="reader-login-action"
                onClick={() => showToast("Entre para compartilhar dentro da comunidade")}
              >
                Entrar para compartilhar com amigos
              </button>
            )}
          </section>
        </div>
      )}
    </article>
  );
}

function Manual({ showToast }: { showToast: (message: string) => void }) {
  const [chapter, setChapter] = useState("Primeiros passos");
  const [query, setQuery] = useState("");
  const filtered = manualChapters.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="manual-page">
      <header>
        <span className="editorial-kicker">MANUAL DO PRODUTO</span>
        <h1>Entenda cada área sem precisar descobrir tudo sozinho.</h1>
        <p>
          O Manual explica o produto. A Central de Ajuda continua responsável por resolver
          problemas.
        </p>
      </header>
      <div className="manual-search">
        <Search />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar no Manual"
        />
      </div>
      <div className="manual-layout">
        <nav aria-label="Capítulos do Manual">
          {filtered.map((item) => (
            <button
              key={item}
              className={chapter === item ? "active" : ""}
              onClick={() => setChapter(item)}
            >
              {item}
              <ChevronRight />
            </button>
          ))}
        </nav>
        <article>
          <span>CAPÍTULO</span>
          <h2>{chapter}</h2>
          <p>
            {chapter === "Primeiros passos"
              ? "Comece pela Home, escolha um Espaço ou uma experiência e ajuste sua privacidade. Você não precisa completar tudo no primeiro dia."
              : `Conheça os principais controles de ${chapter}, quando usar essa área e como retornar ao contexto anterior sem perder seu progresso.`}
          </p>
          <h3>O essencial</h3>
          <ul>
            <li>
              <Check />A entrada principal fica no App Shell existente.
            </li>
            <li>
              <Check />
              Seu estado local e origem são preservados.
            </li>
            <li>
              <Check />
              Falhas desta área não derrubam o restante do aplicativo.
            </li>
          </ul>
          <h3>Quando precisar de ajuda</h3>
          <p>
            Abra a Central de Ajuda para falhas, acesso, pagamentos, denúncias ou suporte
            individual.
          </p>
          <button onClick={() => showToast("Central de Ajuda aberta, sem duplicar o Manual")}>
            Abrir Central de Ajuda
            <ChevronRight />
          </button>
        </article>
      </div>
    </section>
  );
}

function Institutional({
  page,
  onNavigate,
}: {
  page: EditorialPage;
  onNavigate: (page: EditorialPage) => void;
}) {
  if (page === "sobre")
    return (
      <section className="institutional-page about-page">
        <header>
          <span className="editorial-kicker">SOBRE</span>
          <h1>Uma comunidade cristã que deixa relacionamento ser opção, não requisito.</h1>
        </header>
        <div className="about-grid">
          <article>
            <strong>Propósito</strong>
            <p>Criar contexto para amizade, fé, conversa, experiências e conexões com propósito.</p>
          </article>
          <article>
            <strong>Visão</strong>
            <p>
              Uma comunidade em que participar não depende de popularidade, exposição constante ou
              disponibilidade romântica.
            </p>
          </article>
          <article>
            <strong>Valores</strong>
            <p>
              Verdade, respeito, pertencimento, responsabilidade, segurança e liberdade de ritmo.
            </p>
          </article>
        </div>
        <section>
          <h2>Como a comunidade funciona</h2>
          <p>
            Perfis expressam identidade; Comunidade reúne publicações e Momentos; Espaços organizam
            grupos; experiências como Verbo, Cinema, Pets e Arcade criam pontos naturais de
            encontro.
          </p>
          <h2>Fé e responsabilidade</h2>
          <p>
            A identidade cristã orienta propósito e convivência sem transformar opinião editorial em
            Escritura. Segurança combina ferramentas, moderação e escolhas do usuário sem prometer
            risco zero.
          </p>
          <h2>Um produto em evolução</h2>
          <p>
            O VaiDarNamoro nasceu com foco em relacionamento e amadurece como comunidade completa,
            preservando o Modo Namoro em uma área opcional e separada.
          </p>
        </section>
      </section>
    );
  if (page === "depoimentos")
    return (
      <section className="institutional-page testimonial-page">
        <header>
          <span className="editorial-kicker">DEPOIMENTOS E HISTÓRIAS</span>
          <h1>Histórias precisam de contexto, autorização e honestidade.</h1>
          <p>
            Nesta demonstração, todo exemplo simulado está marcado. Conteúdo real só deve ser
            publicado com autorização adequada.
          </p>
        </header>
        <div>
          {[
            "Participar sem precisar postar o tempo todo",
            "Encontrar um Espaço da própria região",
            "Usar o Modo Namoro somente quando fizer sentido",
          ].map((title, index) => (
            <article key={title}>
              <span>CONTEÚDO SIMULADO</span>
              <h2>{title}</h2>
              <p>
                Exemplo editorial de como uma experiência curta, contextualizada e autorizada seria
                apresentada sem inventar números ou resultados.
              </p>
              <strong>{["Ana Clara", "Lucas Almeida", "Marina S."][index]}</strong>
              <small>Contexto demonstrativo · autorização visual não aplicável</small>
            </article>
          ))}
        </div>
      </section>
    );
  if (["termos", "privacidade", "regras"].includes(page)) {
    const current = page as keyof typeof legalSections;
    const title =
      page === "termos"
        ? "Termos de Uso"
        : page === "privacidade"
          ? "Política de Privacidade"
          : "Regras da Comunidade";
    return (
      <section className="legal-page">
        <header>
          <span className="editorial-kicker">{title.toUpperCase()}</span>
          <h1>{title}</h1>
          <div>
            <span>Versão demonstrativa 0.1</span>
            <span>28 jul. 2026</span>
            <button onClick={() => window.print()}>
              <Printer />
              Imprimir
            </button>
            <button>
              <Copy />
              Copiar link
            </button>
          </div>
          <p className="legal-warning">
            {page === "regras"
              ? "Linguagem demonstrativa para revisão interna."
              : "Placeholder estrutural. Este conteúdo não foi validado juridicamente e não deve ser publicado como documento final."}
          </p>
        </header>
        <div className="legal-layout">
          <nav>
            {legalSections[current].map(([heading], index) => (
              <a key={heading} href={`#legal-${index}`}>
                {heading}
              </a>
            ))}
            <button onClick={() => onNavigate("contato")}>
              Contato
              <ChevronRight />
            </button>
          </nav>
          <article>
            {legalSections[current].map(([heading, copy], index) => (
              <section key={heading} id={`legal-${index}`}>
                <h2>{heading}</h2>
                <p>{copy}</p>
              </section>
            ))}
            <footer>
              <strong>Histórico de versões</strong>
              <span>0.1 · Estrutura visual para revisão · 28 jul. 2026</span>
            </footer>
          </article>
        </div>
      </section>
    );
  }
  return (
    <section className="institutional-page contact-page">
      <header>
        <span className="editorial-kicker">CONTATO</span>
        <h1>Encontre o canal certo para cada assunto.</h1>
      </header>
      <div>
        <button>
          Ajuda com minha conta
          <ChevronRight />
        </button>
        <button>
          Segurança e denúncia
          <ChevronRight />
        </button>
        <button>
          Privacidade e dados
          <ChevronRight />
        </button>
        <button>
          Imprensa e conteúdo
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

export default function EditorialExperience({
  visible,
  isPublic,
  initialPage = "home",
  onClose,
  onOpenLogin,
  onOpenVerbo,
  showToast,
}: {
  visible: boolean;
  isPublic: boolean;
  initialPage?: string;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenVerbo: () => void;
  showToast: (message: string) => void;
}) {
  const allowed: EditorialPage[] = [
    "home",
    "noticias",
    "blog",
    "devocionais",
    "depoimentos",
    "manual",
    "sobre",
    "termos",
    "privacidade",
    "regras",
    "contato",
  ];
  const normalized = allowed.includes(initialPage as EditorialPage)
    ? (initialPage as EditorialPage)
    : "home";
  const [page, setPage] = useState<EditorialPage>(normalized);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [demoState, setDemoState] = useState<"normal" | "offline" | "unavailable">("normal");
  const scrollRef = useRef<HTMLElement | null>(null);
  const restorationRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!visible) return;
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: restorationRef.current[normalized] ?? 0 });
    });
  }, [normalized, visible]);

  if (!visible) return null;

  const navigate = (next: EditorialPage) => {
    restorationRef.current[page] = scrollRef.current?.scrollTop ?? 0;
    window.sessionStorage.setItem(
      `vdn-editorial-scroll-${page}`,
      String(restorationRef.current[page]),
    );
    setEntry(null);
    setPage(next);
    window.requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({
        top:
          restorationRef.current[next] ??
          Number(window.sessionStorage.getItem(`vdn-editorial-scroll-${next}`) ?? "0"),
      }),
    );
  };
  const openEntry = (next: Entry) => {
    restorationRef.current[page] = scrollRef.current?.scrollTop ?? 0;
    setEntry(next);
    window.requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  };
  const closeReader = () => {
    setEntry(null);
    window.requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: restorationRef.current[page] ?? 0 }),
    );
  };

  return (
    <EditorialBoundary onClose={onClose}>
      <section className="editorial-experience" aria-label="Conteúdo editorial e institucional">
        {!entry && (
          <EditorialHeader
            isPublic={isPublic}
            onClose={onClose}
            onNavigate={navigate}
            onLogin={onOpenLogin}
          />
        )}
        <main ref={scrollRef} className={`editorial-scroll ${entry ? "reader-open" : ""}`}>
          {demoState === "offline" && (
            <div className="editorial-state-banner" role="status">
              <WifiOff />
              <span>Você está offline. Mostrando conteúdo já carregado.</span>
              <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
            </div>
          )}
          {demoState === "unavailable" ? (
            <section className="editorial-unavailable" role="alert">
              <FileText />
              <h1>Conteúdo indisponível</h1>
              <p>
                Esta leitura pode ter sido removida, arquivada ou estar temporariamente inacessível.
              </p>
              <button onClick={() => setDemoState("normal")}>
                <RefreshCw />
                Voltar ao editorial
              </button>
            </section>
          ) : entry ? (
            <Reader
              entry={entry}
              isPublic={isPublic}
              onBack={closeReader}
              onOpen={openEntry}
              onOpenVerbo={onOpenVerbo}
              showToast={showToast}
            />
          ) : page === "home" ? (
            <EditorialHome onOpen={openEntry} onNavigate={navigate} />
          ) : ["noticias", "blog", "devocionais"].includes(page) ? (
            <Listing page={page} onOpen={openEntry} />
          ) : page === "manual" ? (
            <Manual showToast={showToast} />
          ) : (
            <Institutional page={page} onNavigate={navigate} />
          )}
        </main>
        <button
          className="editorial-state-demo"
          aria-label="Alternar estados editoriais de demonstração"
          onClick={() =>
            setDemoState((current) =>
              current === "normal" ? "offline" : current === "offline" ? "unavailable" : "normal",
            )
          }
        >
          {demoState === "offline" ? <FileText /> : <WifiOff />}
        </button>
      </section>
    </EditorialBoundary>
  );
}
