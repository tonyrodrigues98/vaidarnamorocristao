"use client";

import {
  ArrowLeft,
  Award,
  Bird,
  Bomb,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Crown,
  Gamepad2,
  Gem,
  Medal,
  MoreHorizontal,
  Package,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/ArcadeExperience.css";

type ArcadeView = "hub" | "fly" | "quiz" | "mines";
type ArcadeTab = "Destaques" | "Jogos" | "Desafios" | "Rankings" | "Conquistas";
type FlyPhase = "entry" | "playing" | "paused" | "result";
type QuizPhase = "entry" | "setup" | "question" | "result";
type MinesPhase = "entry" | "playing" | "result";
type MinesResult = "retirada" | "bomba" | "interrompida" | "automática" | "cancelada";

const arcadeTabs: ArcadeTab[] = ["Destaques", "Jogos", "Desafios", "Rankings", "Conquistas"];

class GameBoundary extends Component<
  { children: React.ReactNode; name: string; onBack: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="arc41-local-state" role="alert">
        <CircleAlert size={34} />
        <h2>Não foi possível abrir esta experiência</h2>
        <p>{this.props.name} encontrou um erro local. O restante do Arcade continua disponível.</p>
        <button onClick={() => this.setState({ failed: false })}>
          <RefreshCw /> Tentar novamente
        </button>
        <button className="secondary" onClick={this.props.onBack}>
          <ArrowLeft /> Voltar ao Arcade
        </button>
      </div>
    );
  }
}

function GameHeader({
  title,
  meta,
  onBack,
  action,
}: {
  title: string;
  meta: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <header className="arc41-game-header">
      <button aria-label={`Sair de ${title}`} onClick={onBack}>
        <ArrowLeft />
      </button>
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      {action ?? (
        <span className="arc41-game-mark">
          <Gamepad2 />
        </span>
      )}
    </header>
  );
}

function FlyBird({
  onBack,
  showToast,
  offline,
}: {
  onBack: () => void;
  showToast: (message: string) => void;
  offline: boolean;
}) {
  const [phase, setPhase] = useState<FlyPhase>("entry");
  const [character, setCharacter] = useState<"Nilo" | "Aurora" | "Peregrino">("Nilo");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(128);
  const [birdY, setBirdY] = useState(52);
  const [newRecord, setNewRecord] = useState(false);
  const velocity = useRef(0);

  const finish = useCallback(() => {
    setPhase("result");
    setBirdY(52);
    setNewRecord(score > best);
    setBest((current) => Math.max(current, score));
  }, [best, score]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      velocity.current += 0.72;
      setBirdY((current) => {
        const next = current + velocity.current;
        if (next > 84) {
          window.setTimeout(finish, 0);
          return 52;
        }
        return Math.max(7, next);
      });
      setScore((current) => current + 1);
    }, 120);
    return () => window.clearInterval(timer);
  }, [finish, phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (![" ", "ArrowUp"].includes(event.key) || phase === "entry" || phase === "result") return;
      event.preventDefault();
      if (phase === "paused") return;
      velocity.current = -3.7;
      setBirdY((current) => Math.max(6, current - 5));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  const start = () => {
    setScore(0);
    setBirdY(52);
    velocity.current = -3.7;
    setPhase("playing");
  };

  const flap = () => {
    if (phase !== "playing") return;
    velocity.current = -3.7;
    setBirdY((current) => Math.max(6, current - 5));
  };

  if (phase === "entry") {
    return (
      <div className="arc41-game arc41-fly-entry">
        <GameHeader
          title="Fly Bird"
          meta={offline ? "Treino offline" : "Arcade · modo infinito"}
          onBack={onBack}
        />
        <main>
          <section className="arc41-fly-character">
            <span className={`arc41-bird-portrait is-${character.toLowerCase()}`}>
              <Bird />
            </span>
            <small>PERSONAGEM SELECIONADO</small>
            <h1>{character}</h1>
            <p>Leve, colecionável e sem qualquer vantagem competitiva.</p>
            <button
              onClick={() =>
                setCharacter((current) =>
                  current === "Nilo" ? "Aurora" : current === "Aurora" ? "Peregrino" : "Nilo",
                )
              }
            >
              <RotateCcw /> Trocar personagem
            </button>
          </section>
          <section className="arc41-fly-stats">
            <article>
              <span>Recorde</span>
              <strong>{best}</strong>
              <small>pontos</small>
            </article>
            <article>
              <span>Melhor sequência</span>
              <strong>7</strong>
              <small>dias livres</small>
            </article>
          </section>
          <section className="arc41-mode-card">
            <div>
              <span>MODO INFINITO</span>
              <h2>Encontre seu ritmo</h2>
              <p>Toque para subir. Sem power-ups, anúncios ou pay-to-win.</p>
            </div>
            <Clock3 />
          </section>
          <section className="arc41-daily-card">
            <Target />
            <div>
              <small>DESAFIO DIÁRIO</small>
              <strong>Faça 60 pontos</strong>
              <span>Badge Asa Serena · sem punição</span>
            </div>
          </section>
        </main>
        <footer className="arc41-entry-actions">
          <button className="primary" onClick={start}>
            <Play /> Iniciar voo
          </button>
          <button onClick={() => showToast("Ranking semanal de Amigos aberto")}>
            <Trophy /> Ver ranking
          </button>
        </footer>
      </div>
    );
  }

  if (phase === "result") {
    const medal = score >= 100 ? "Ouro" : score >= 60 ? "Prata" : "Bronze";
    return (
      <div className="arc41-game arc41-result arc41-fly-result">
        <GameHeader title="Fly Bird" meta="Resultado da partida" onBack={() => setPhase("entry")} />
        <main>
          <span className="arc41-result-medal">
            <Medal />
          </span>
          <small>{newRecord ? "NOVO RECORDE" : `MEDALHA ${medal.toUpperCase()}`}</small>
          <h1>{score}</h1>
          <p>pontos nesta partida</p>
          <div className="arc41-result-grid">
            <article>
              <span>Recorde</span>
              <strong>{best}</strong>
            </article>
            <article>
              <span>Desafio</span>
              <strong>{score >= 60 ? "Concluído" : `${score}/60`}</strong>
            </article>
          </div>
          <section className="arc41-reward-card">
            <Package />
            <div>
              <small>RECOMPENSA SIMULADA</small>
              <strong>{score >= 60 ? "Badge Asa Serena" : "Progresso preservado"}</strong>
              <span>
                {offline
                  ? "Treino offline não altera recompensas."
                  : "Disponível no Inventário demonstrativo."}
              </span>
            </div>
          </section>
          <div className="arc41-pet-reaction">
            <img src="/pet-bento.png" alt="" />
            <span>
              <strong>Bento reagiu ao seu voo</strong>
              <small>
                {score >= 60 ? "Ele parece orgulhoso." : "Mais uma tentativa, no seu tempo."}
              </small>
            </span>
          </div>
        </main>
        <footer className="arc41-result-actions">
          <button className="primary" onClick={start}>
            <RefreshCw /> Jogar novamente
          </button>
          <button onClick={() => showToast("Placar pronto para compartilhar")}>
            <UsersRound /> Compartilhar
          </button>
          <button onClick={() => setPhase("entry")}>
            <ArrowLeft /> Voltar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="arc41-game arc41-fly-game">
      <GameHeader
        title="Fly Bird"
        meta={offline ? "Treino offline" : "Infinito · desafio ativo"}
        onBack={() => setPhase("entry")}
        action={
          <button
            aria-label={phase === "paused" ? "Continuar" : "Pausar"}
            onClick={() => setPhase((current) => (current === "paused" ? "playing" : "paused"))}
          >
            {phase === "paused" ? <Play /> : <Pause />}
          </button>
        }
      />
      <div className="arc41-fly-hud">
        <span>
          <small>PONTOS</small>
          <strong>{score}</strong>
        </span>
        <span>
          <small>RECORDE</small>
          <strong>{best}</strong>
        </span>
      </div>
      <button
        className="arc41-fly-stage"
        onPointerDown={flap}
        aria-label="Toque para o pássaro subir"
      >
        <span className="arc41-sun" />
        <span className="arc41-cloud cloud-a" />
        <span className="arc41-cloud cloud-b" />
        <span
          className={`arc41-playing-bird is-${character.toLowerCase()}`}
          style={{ top: `${birdY}%` }}
        >
          <Bird />
        </span>
        <span className="arc41-pipe pipe-a" />
        <span className="arc41-pipe pipe-b" />
        <span className="arc41-ground" />
        {phase === "paused" && (
          <span className="arc41-pause-card">
            <Pause />
            <strong>Voo pausado</strong>
            <small>Seu progresso está preservado.</small>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPhase("playing");
              }}
            >
              <Play /> Continuar
            </button>
          </span>
        )}
        {phase === "playing" && score < 6 && (
          <span className="arc41-touch-hint">Toque ou pressione espaço para subir</span>
        )}
      </button>
    </div>
  );
}

const quizQuestions = [
  [
    "Quem construiu a arca?",
    ["Moisés", "Noé", "Abraão", "Josué"],
    1,
    "Gênesis 6:14",
    "Noé recebeu de Deus as instruções para construir a arca.",
  ],
  [
    "Qual evangelho começa com “No princípio era o Verbo”?",
    ["João", "Lucas", "Marcos", "Mateus"],
    0,
    "João 1:1",
    "João apresenta Jesus como o Verbo eterno.",
  ],
  [
    "Quem derrotou Golias?",
    ["Samuel", "Davi", "Saul", "Jônatas"],
    1,
    "1 Samuel 17",
    "Davi enfrentou Golias confiando no Senhor.",
  ],
  [
    "Quantos discípulos Jesus escolheu?",
    ["7", "10", "12", "14"],
    2,
    "Lucas 6:13",
    "Jesus escolheu doze e os chamou apóstolos.",
  ],
  [
    "Em qual cidade Jesus nasceu?",
    ["Belém", "Nazaré", "Jerusalém", "Cafarnaum"],
    0,
    "Mateus 2:1",
    "Jesus nasceu em Belém da Judeia.",
  ],
  [
    "Quem foi lançado na cova dos leões?",
    ["Daniel", "José", "Elias", "Eliseu"],
    0,
    "Daniel 6",
    "Daniel permaneceu fiel mesmo sob ameaça.",
  ],
  [
    "Qual é o último livro da Bíblia?",
    ["Judas", "Apocalipse", "Atos", "Romanos"],
    1,
    "Apocalipse 1:1",
    "Apocalipse encerra o cânon do Novo Testamento.",
  ],
  [
    "Quem recebeu os Dez Mandamentos?",
    ["Moisés", "Josué", "Arão", "Calebe"],
    0,
    "Êxodo 20",
    "Moisés recebeu a Lei no Sinai.",
  ],
  [
    "Quem negou Jesus três vezes?",
    ["Pedro", "Tomé", "João", "Tiago"],
    0,
    "Lucas 22:61",
    "Pedro se lembrou das palavras de Jesus.",
  ],
  [
    "Qual fruto do Espírito aparece em Gálatas 5?",
    ["Orgulho", "Paciência", "Riqueza", "Fama"],
    1,
    "Gálatas 5:22",
    "Paciência integra o fruto do Espírito.",
  ],
] as const;

function QuizGame({
  onBack,
  showToast,
  offline,
}: {
  onBack: () => void;
  showToast: (message: string) => void;
  offline: boolean;
}) {
  const [phase, setPhase] = useState<QuizPhase>("entry");
  const [category, setCategory] = useState("Bíblia");
  const [opponent, setOpponent] = useState("Lucas Almeida");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const question = quizQuestions[index];

  const restart = () => {
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setAnswers([]);
    setPhase("question");
  };

  if (phase === "entry") {
    return (
      <div className="arc41-game arc41-quiz-entry">
        <GameHeader
          title="Quiz"
          meta={offline ? "Treino local" : "Confrontos assíncronos"}
          onBack={onBack}
        />
        <main>
          <section className="arc41-quiz-hero">
            <Target />
            <small>DESAFIO EM DESTAQUE</small>
            <h1>Conhecimento em boa companhia</h1>
            <p>Responda no seu tempo. Sem cronômetro agressivo e sem ranking espiritual.</p>
            <button onClick={() => setPhase("setup")}>
              <Play /> Criar partida
            </button>
          </section>
          <nav className="arc41-mini-tabs" aria-label="Áreas do Quiz">
            <button aria-pressed="true">Categorias</button>
            <button onClick={() => showToast("Desafios do Quiz abertos")}>Desafios</button>
            <button onClick={() => showToast("2 partidas aguardando")}>Partidas</button>
            <button onClick={() => showToast("Histórico do Quiz aberto")}>Histórico</button>
          </nav>
          <section className="arc41-category-grid">
            {["Bíblia", "Conhecimento geral", "Música", "Filmes", "Curiosidades", "Comunidade"].map(
              (item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => {
                    setCategory(item);
                    setPhase("setup");
                  }}
                >
                  <span>{item === "Bíblia" ? "REF" : "10"}</span>
                  <strong>{item}</strong>
                  <small>10 perguntas</small>
                </button>
              ),
            )}
          </section>
        </main>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="arc41-game arc41-quiz-setup">
        <GameHeader
          title="Nova partida"
          meta="Confronto assíncrono"
          onBack={() => setPhase("entry")}
        />
        <main>
          <span className="arc41-step-label">ETAPA 1 DE 2</span>
          <h1>Escolha o desafio</h1>
          <label>
            Categoria
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {[
                "Bíblia",
                "Conhecimento geral",
                "Música",
                "Filmes",
                "Curiosidades",
                "Comunidade",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Oponente ou grupo
            <select value={opponent} onChange={(event) => setOpponent(event.target.value)}>
              {offline ? (
                <option>Treino local</option>
              ) : (
                <>
                  <option>Lucas Almeida</option>
                  <option>Ana Clara</option>
                  <option>Grupo Jovens na Palavra</option>
                </>
              )}
            </select>
          </label>
          <section className="arc41-match-review">
            <span>
              <UserRound />
            </span>
            <div>
              <small>PARTIDA</small>
              <strong>Você × {offline ? "Treino local" : opponent}</strong>
              <p>10 perguntas · resultado quando todos concluírem</p>
            </div>
          </section>
        </main>
        <footer className="arc41-entry-actions">
          <button className="primary" onClick={restart}>
            <Check /> Confirmar e começar
          </button>
          <button onClick={() => setPhase("entry")}>Cancelar</button>
        </footer>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="arc41-game arc41-result arc41-quiz-result">
        <GameHeader title="Quiz" meta="Resultado da partida" onBack={() => setPhase("entry")} />
        <main>
          <span className="arc41-result-medal violet">
            <Trophy />
          </span>
          <small>PARTIDA CONCLUÍDA</small>
          <h1>
            {score} <i>×</i> 7
          </h1>
          <p>Você e {offline ? "o treino local" : opponent}</p>
          <div className="arc41-result-grid">
            <article>
              <span>Acertos</span>
              <strong>{score}/10</strong>
            </article>
            <article>
              <span>Precisão</span>
              <strong>{score * 10}%</strong>
            </article>
          </div>
          <details className="arc41-answer-review">
            <summary>Rever respostas e explicações</summary>
            {answers.map((value, answerIndex) => (
              <article key={answerIndex}>
                <span>{answerIndex + 1}</span>
                <div>
                  <strong>{quizQuestions[answerIndex][0]}</strong>
                  <small>
                    {value === quizQuestions[answerIndex][2] ? "Correta" : "Revisar"} ·{" "}
                    {quizQuestions[answerIndex][3]}
                  </small>
                </div>
              </article>
            ))}
          </details>
        </main>
        <footer className="arc41-result-actions">
          <button className="primary" onClick={restart}>
            <RefreshCw /> Jogar novamente
          </button>
          <button
            onClick={() => {
              setPhase("setup");
              showToast("Revanche preparada");
            }}
          >
            <UsersRound /> Revanche
          </button>
          <button onClick={() => showToast("Resultado pronto para compartilhar")}>
            <MoreHorizontal /> Compartilhar
          </button>
          <button onClick={() => setPhase("entry")}>
            <ArrowLeft /> Voltar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="arc41-game arc41-quiz-question">
      <GameHeader
        title="Quiz em dupla"
        meta={`${category} · você × ${offline ? "treino" : opponent.split(" ")[0]}`}
        onBack={() => setPhase("entry")}
        action={<span className="arc41-question-count">{index + 1}/10</span>}
      />
      <div className="arc41-quiz-progress" aria-label={`Pergunta ${index + 1} de 10`}>
        <i style={{ width: `${(index + 1) * 10}%` }} />
      </div>
      <main>
        <span className="arc41-step-label">{category.toUpperCase()} · SEM PRESSA</span>
        <h1>{question[0]}</h1>
        <div className="arc41-options">
          {question[1].map((option, optionIndex) => {
            const correct = answer !== null && optionIndex === question[2];
            const chosenWrong = answer === optionIndex && answer !== question[2];
            return (
              <button
                key={option}
                className={correct ? "correct" : chosenWrong ? "wrong" : ""}
                disabled={answer !== null}
                onClick={() => {
                  setAnswer(optionIndex);
                  setAnswers((current) => [...current, optionIndex]);
                  if (optionIndex === question[2]) setScore((value) => value + 1);
                }}
              >
                <span>
                  {correct ? (
                    <Check />
                  ) : chosenWrong ? (
                    <X />
                  ) : (
                    String.fromCharCode(65 + optionIndex)
                  )}
                </span>
                <strong>{option}</strong>
                {correct && <small>Correta</small>}
                {chosenWrong && <small>Revisar</small>}
              </button>
            );
          })}
        </div>
        {answer !== null && (
          <aside className="arc41-explanation">
            <ShieldCheck />
            <div>
              <strong>{answer === question[2] ? "Resposta correta" : "Boa tentativa"}</strong>
              <p>{question[4]}</p>
              <span>{question[3]}</span>
            </div>
          </aside>
        )}
      </main>
      <footer className="arc41-question-actions">
        <button
          disabled={answer === null}
          onClick={() => {
            if (index === 9) setPhase("result");
            else {
              setIndex((value) => value + 1);
              setAnswer(null);
            }
          }}
        >
          {index === 9 ? "Ver resultado" : "Próxima pergunta"}
          <ChevronRight />
        </button>
      </footer>
    </div>
  );
}

function MinesGame({
  onBack,
  showToast,
  offline,
}: {
  onBack: () => void;
  showToast: (message: string) => void;
  offline: boolean;
}) {
  const [phase, setPhase] = useState<MinesPhase>("entry");
  const [bombs, setBombs] = useState(5);
  const [stake, setStake] = useState(50);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [result, setResult] = useState<MinesResult>("cancelada");
  const [history, setHistory] = useState<string[]>(["1,42×", "Bomba", "2,16×"]);
  const bombCells = useMemo(
    () => Array.from({ length: bombs }, (_, index) => (index * 7 + 3) % 25),
    [bombs],
  );
  const multiplier = (1 + revealed.length * (bombs / 22)).toFixed(2);
  const nextMultiplier = (1 + (revealed.length + 1) * (bombs / 22)).toFixed(2);

  const finish = (state: MinesResult) => {
    setResult(state);
    setPhase("result");
    setHistory((current) =>
      [state === "bomba" ? "Bomba" : `${multiplier}×`, ...current].slice(0, 5),
    );
  };

  const reveal = (cell: number) => {
    if (phase !== "playing" || revealed.includes(cell)) return;
    if (bombCells.includes(cell)) {
      setRevealed((current) => [...current, cell]);
      finish("bomba");
      return;
    }
    setRevealed((current) => [...current, cell]);
  };

  const start = () => {
    setRevealed([]);
    setPhase("playing");
  };

  if (phase === "entry") {
    return (
      <div className="arc41-game arc41-mines-entry">
        <GameHeader
          title="Mines"
          meta={offline ? "Demonstração offline" : "Estratégia · simulação"}
          onBack={onBack}
        />
        <main>
          <section className="arc41-mines-hero">
            <span>
              <Bomb />
            </span>
            <small>RISCO CONTROLADO</small>
            <h1>Escolha quando parar</h1>
            <p>
              Moeda visual, sem dinheiro real, sem compra de saldo, sem autoplay ou recomendação
              agressiva.
            </p>
          </section>
          <div className="arc41-balance">
            <span>SALDO VISUAL SIMULADO</span>
            <strong>{offline ? "Treino" : "2.450 moedas"}</strong>
          </div>
          <label>
            Aposta predefinida
            <div className="arc41-stakes">
              {[25, 50, 100].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={stake === value ? "active" : ""}
                  onClick={() => setStake(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </label>
          <label>
            Quantidade de bombas <strong>{bombs}</strong>
            <input
              type="range"
              min="1"
              max="20"
              value={bombs}
              onChange={(event) => setBombs(Number(event.target.value))}
            />
            <span>Menos risco</span>
            <span>Mais risco</span>
          </label>
          <section className="arc41-risk-note">
            <ShieldCheck />
            <div>
              <strong>Risco claro antes de começar</strong>
              <p>{bombs} de 25 casas contêm bombas. Você pode retirar após qualquer casa segura.</p>
            </div>
          </section>
        </main>
        <footer className="arc41-entry-actions">
          <button className="primary mines" onClick={start}>
            <Play /> Iniciar simulação
          </button>
          <small>Sem contagem regressiva · sem dinheiro real</small>
        </footer>
      </div>
    );
  }

  if (phase === "result") {
    const labels: Record<MinesResult, [string, string]> = {
      retirada: ["Retirada concluída", `${multiplier}×`],
      bomba: ["Bomba encontrada", "Partida encerrada"],
      interrompida: ["Partida interrompida", "Progresso preservado"],
      automática: ["Retirada automática", `${multiplier}×`],
      cancelada: ["Sessão cancelada", "Sem alteração"],
    };
    return (
      <div className="arc41-game arc41-result arc41-mines-result">
        <GameHeader title="Mines" meta="Resultado demonstrativo" onBack={() => setPhase("entry")} />
        <main>
          <span className={`arc41-result-medal ${result === "bomba" ? "danger" : "mines"}`}>
            {result === "bomba" ? <Bomb /> : <Gem />}
          </span>
          <small>SIMULAÇÃO ENCERRADA</small>
          <h1>{labels[result][0]}</h1>
          <p>{labels[result][1]}</p>
          <div className="arc41-result-grid">
            <article>
              <span>Multiplicador</span>
              <strong>{result === "bomba" ? "0,00×" : `${multiplier}×`}</strong>
            </article>
            <article>
              <span>Valor visual</span>
              <strong>{result === "bomba" ? "0" : Math.round(stake * Number(multiplier))}</strong>
            </article>
          </div>
          <section className="arc41-mines-history">
            <span>HISTÓRICO LOCAL</span>
            <div>
              {history.map((item, index) => (
                <i key={`${item}-${index}`}>{item}</i>
              ))}
            </div>
          </section>
          {offline && (
            <div className="arc41-offline-note">
              <WifiOff /> Treino offline não usa saldo nem ranking.
            </div>
          )}
        </main>
        <footer className="arc41-result-actions">
          <button className="primary mines" onClick={start}>
            <RefreshCw /> Jogar novamente
          </button>
          <button onClick={() => setPhase("entry")}>
            <ArrowLeft /> Voltar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="arc41-game arc41-mines-game">
      <GameHeader
        title="Mines"
        meta={offline ? "Demonstração offline" : `Aposta visual · ${stake}`}
        onBack={() => finish("cancelada")}
        action={<Bomb />}
      />
      <main>
        <section className="arc41-mines-hud">
          <article>
            <span>ATUAL</span>
            <strong>{multiplier}×</strong>
          </article>
          <article>
            <span>PRÓXIMA</span>
            <strong>{nextMultiplier}×</strong>
          </article>
          <article>
            <span>RISCO</span>
            <strong>{bombs}/25</strong>
          </article>
        </section>
        <div className="arc41-mines-grid" aria-label="Grade Mines 5 por 5">
          {Array.from({ length: 25 }, (_, cell) => {
            const open = revealed.includes(cell);
            const bomb = open && bombCells.includes(cell);
            return (
              <button
                key={cell}
                className={open ? (bomb ? "bomb" : "safe") : ""}
                aria-label={`Casa ${cell + 1}${open ? (bomb ? ", bomba" : ", segura") : ", fechada"}`}
                onClick={() => reveal(cell)}
              >
                {open ? bomb ? <Bomb /> : <Sparkles /> : <span />}
              </button>
            );
          })}
        </div>
        <div className="arc41-auto-note">
          <Clock3 />
          <span>
            <strong>Retirada automática visual em 30s</strong>
            <small>Sem urgência artificial; apenas um estado demonstrativo.</small>
          </span>
          <button onClick={() => finish("automática")}>Simular</button>
        </div>
      </main>
      <footer className="arc41-mines-actions">
        <button disabled={!revealed.length} onClick={() => finish("retirada")}>
          <Gem /> Retirar · {multiplier}×
        </button>
        <button
          onClick={() => {
            finish("interrompida");
            showToast("Partida interrompida com segurança");
          }}
        >
          <Pause /> Interromper
        </button>
      </footer>
    </div>
  );
}

function Highlights({
  openGame,
  showToast,
  offline,
}: {
  openGame: (view: ArcadeView) => void;
  showToast: (message: string) => void;
  offline: boolean;
}) {
  return (
    <div className="arc41-content arc41-highlights">
      <button className="arc41-feature" onClick={() => openGame("fly")}>
        <span className="arc41-feature-copy">
          <small>JOGO DO DIA · 1–3 MIN</small>
          <h2>Fly Bird</h2>
          <p>Voe leve, supere seu recorde e leve Bento junto nessa partida.</p>
          <strong>
            <Play /> Jogar agora
          </strong>
        </span>
        <span className="arc41-feature-art">
          <i />
          <Bird />
        </span>
      </button>
      <section className="arc41-continue">
        <header>
          <div>
            <span>CONTINUE JOGANDO</span>
            <h2>Do ponto em que parou</h2>
          </div>
          <small>{offline ? "Treino offline" : "Estado preservado"}</small>
        </header>
        <div>
          <button onClick={() => openGame("quiz")}>
            <Target />
            <span>
              <strong>Desafio Bíblico</strong>
              <small>Pergunta 4 de 10 · Lucas</small>
              <i>
                <b style={{ width: "40%" }} />
              </i>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => openGame("fly")}>
            <Bird />
            <span>
              <strong>Fly Bird</strong>
              <small>Recorde 128 · infinito</small>
            </span>
            <ChevronRight />
          </button>
        </div>
      </section>
      <section className="arc41-home-split">
        <button className="arc41-challenge-card" onClick={() => openGame("fly")}>
          <span>
            <Target />
          </span>
          <small>DESAFIO ATIVO</small>
          <strong>Voo da manhã</strong>
          <p>60 pontos · sem punição</p>
          <em>Badge Asa Serena</em>
        </button>
        <button
          className="arc41-pet-card"
          onClick={() => showToast("Cosméticos de Bento no Inventário")}
        >
          <img src="/pet-bento.png" alt="" />
          <span>
            <small>PET EM DESTAQUE</small>
            <strong>Bento acompanha partidas</strong>
            <p>Reações visuais, sem vantagem.</p>
          </span>
        </button>
      </section>
      <section className="arc41-progress-card">
        <div>
          <small>PROGRESSO PESSOAL</small>
          <strong>Nível 12 · Explorador</strong>
          <span>3 de 5 atividades desta coleção</span>
        </div>
        <i>
          <b style={{ width: "60%" }} />
        </i>
        <button onClick={() => showToast("Conquistas abertas")}>
          Ver progresso <ChevronRight />
        </button>
      </section>
    </div>
  );
}

function GamesCatalog({
  openGame,
  offline,
}: {
  openGame: (view: ArcadeView) => void;
  offline: boolean;
}) {
  return (
    <div className="arc41-content arc41-games">
      <header className="arc41-section-intro">
        <span>TRÊS RITMOS, TRÊS IDENTIDADES</span>
        <h2>Escolha como quer jogar</h2>
        <p>
          {offline
            ? "Treinos locais disponíveis sem ranking ou recompensa real."
            : "Partidas rápidas e progresso saudável, sem pressão."}
        </p>
      </header>
      <div className="arc41-catalog">
        <button className="arc41-game-card fly" onClick={() => openGame("fly")}>
          <span className="art">
            <i />
            <Bird />
          </span>
          <span className="copy">
            <small>INFINITO · 1–3 MIN</small>
            <strong>Fly Bird</strong>
            <p>Céu estilizado, pássaros colecionáveis e desafio diário.</p>
            <em>Recorde 128</em>
          </span>
          <ChevronRight />
        </button>
        <button className="arc41-game-card quiz" onClick={() => openGame("quiz")}>
          <span className="art">
            <Target />
          </span>
          <span className="copy">
            <small>ASSÍNCRONO · 8 MIN</small>
            <strong>Quiz</strong>
            <p>Seis categorias e confrontos no seu tempo.</p>
            <em>2 partidas abertas</em>
          </span>
          <ChevronRight />
        </button>
        <button className="arc41-game-card mines" onClick={() => openGame("mines")}>
          <span className="art">
            <Bomb />
          </span>
          <span className="copy">
            <small>ESTRATÉGIA · 2–5 MIN</small>
            <strong>Mines</strong>
            <p>Risco claro e moeda somente visual.</p>
            <em>Treino consciente</em>
          </span>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

function Challenges({ openGame }: { openGame: (view: ArcadeView) => void }) {
  const challenges = [
    ["Diário", "Voo da manhã", "Faça 60 pontos no Fly Bird", "34/60", "Badge Asa Serena", "fly"],
    ["Semanal", "Mente curiosa", "Conclua dois quizzes", "1/2", "Moldura Curiosidade", "quiz"],
    [
      "Amigos",
      "Treino em companhia",
      "Participe de uma partida assíncrona",
      "0/1",
      "100 moedas simuladas",
      "quiz",
    ],
    [
      "Evento",
      "Semana da comunidade",
      "Experimente dois jogos diferentes",
      "1/2",
      "Cenário Horizonte",
      "mines",
    ],
  ] as const;
  return (
    <div className="arc41-content arc41-challenges">
      <header className="arc41-section-intro">
        <span>SEM PRESSÃO DIÁRIA</span>
        <h2>Desafios no seu ritmo</h2>
        <p>Nenhuma missão pune ausência ou quebra uma sequência.</p>
      </header>
      {challenges.map(([type, title, copy, progress, reward, game]) => (
        <article key={title}>
          <span className="icon">
            <Target />
          </span>
          <div>
            <small>{type.toUpperCase()}</small>
            <strong>{title}</strong>
            <p>{copy}</p>
            <i>
              <b
                style={{
                  width: `${(Number(progress.split("/")[0]) / Number(progress.split("/")[1])) * 100}%`,
                }}
              />
            </i>
            <em>
              {progress} · {reward}
            </em>
          </div>
          <button onClick={() => openGame(game)}>
            Jogar <ChevronRight />
          </button>
        </article>
      ))}
    </div>
  );
}

function Rankings({ showToast }: { showToast: (message: string) => void }) {
  const [rankingTab, setRankingTab] = useState("Amigos");
  return (
    <div className="arc41-content arc41-rankings">
      <header className="arc41-section-intro">
        <span>PRIVACIDADE EM PRIMEIRO LUGAR</span>
        <h2>Ranking próximo, não dominante</h2>
      </header>
      <nav className="arc41-mini-tabs">
        {["Pessoal", "Amigos", "Semanal", "Evento"].map((item) => (
          <button
            key={item}
            className={rankingTab === item ? "active" : ""}
            onClick={() => setRankingTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <section className="arc41-ranking-hero">
        <Trophy />
        <span>
          <small>{rankingTab.toUpperCase()} · ESTA SEMANA</small>
          <strong>Você está em 3º</strong>
          <p>2.180 pontos · encerra domingo</p>
        </span>
      </section>
      {[
        ["1", "Ana Clara", "2.840"],
        ["2", "Lucas Almeida", "2.410"],
        ["3", "Antonio", "2.180"],
        ["4", "Marina Souza", "1.920"],
      ].map(([place, name, points]) => (
        <button
          className={`arc41-rank-row ${name === "Antonio" ? "me" : ""}`}
          key={name}
          onClick={() =>
            showToast(name === "Antonio" ? "Seu perfil no ranking" : `Perfil de ${name} aberto`)
          }
        >
          <span>{place}</span>
          <i>{name.slice(0, 2).toUpperCase()}</i>
          <strong>{name}</strong>
          <em>{points} pts</em>
        </button>
      ))}
      <p className="arc41-privacy-note">
        <ShieldCheck /> Você controla a visibilidade do seu placar nas configurações.
      </p>
    </div>
  );
}

function Achievements({ showToast }: { showToast: (message: string) => void }) {
  const [filter, setFilter] = useState("Todas");
  const achievements = [
    ["Primeiro voo", "Desbloqueada", "Personagem"],
    ["Mente curiosa", "7/10", "Badge"],
    ["Companheiro", "Desbloqueada", "Efeito"],
    ["Semana consistente", "3/5", "Cenário"],
    ["Explorador", "2/3", "Skin"],
    ["Risco consciente", "1/4", "Badge"],
  ];
  return (
    <div className="arc41-content arc41-achievements">
      <header className="arc41-section-intro">
        <span>COLEÇÕES E COSMÉTICOS</span>
        <h2>Conquistas que contam sua história</h2>
        <p>Integradas ao Inventário, sem criar uma segunda Loja.</p>
      </header>
      <nav className="arc41-mini-tabs">
        {["Todas", "Desbloqueadas", "Em progresso", "Coleções"].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <div>
        {achievements
          .filter((item) =>
            filter === "Todas" || filter === "Desbloqueadas"
              ? filter === "Todas" || item[1] === "Desbloqueada"
              : filter === "Em progresso"
                ? item[1] !== "Desbloqueada"
                : true,
          )
          .map(([title, progress, kind], index) => (
            <button key={title} onClick={() => showToast(`${title} aberto no Inventário`)}>
              <span>{index % 3 === 0 ? <Award /> : index % 3 === 1 ? <Medal /> : <Crown />}</span>
              <strong>{title}</strong>
              <small>{kind}</small>
              <em>{progress}</em>
            </button>
          ))}
      </div>
    </div>
  );
}

function ArcadeHub({
  activeTab,
  setActiveTab,
  openGame,
  showToast,
  offline,
  setOffline,
}: {
  activeTab: ArcadeTab;
  setActiveTab: (tab: ArcadeTab) => void;
  openGame: (view: ArcadeView) => void;
  showToast: (message: string) => void;
  offline: boolean;
  setOffline: (offline: boolean) => void;
}) {
  return (
    <>
      <header className="arc41-topbar">
        <button
          aria-label="Voltar para a origem"
          onClick={() => window.dispatchEvent(new CustomEvent("vdn-close-arcade"))}
        >
          <ArrowLeft />
        </button>
        <div>
          <Gamepad2 />
          <span>
            <h1>Arcade</h1>
            <small>Jogue no seu ritmo</small>
          </span>
        </div>
        <button
          className={offline ? "offline active" : "offline"}
          aria-label={offline ? "Desativar modo offline" : "Simular modo offline"}
          onClick={() => setOffline(!offline)}
        >
          {offline ? <WifiOff /> : <img src="/pet-bento.png" alt="" />}
        </button>
      </header>
      {offline && (
        <div className="arc41-offline-banner">
          <WifiOff />
          <span>
            <strong>Modo treino offline</strong>
            <small>Sem ranking ou recompensas reais.</small>
          </span>
          <button onClick={() => setOffline(false)}>Voltar online</button>
        </div>
      )}
      <nav className="arc41-tabs" aria-label="Áreas do Arcade">
        {arcadeTabs.map((tab) => (
          <button
            key={tab}
            aria-current={activeTab === tab ? "page" : undefined}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      {activeTab === "Destaques" && (
        <Highlights openGame={openGame} showToast={showToast} offline={offline} />
      )}
      {activeTab === "Jogos" && <GamesCatalog openGame={openGame} offline={offline} />}
      {activeTab === "Desafios" && <Challenges openGame={openGame} />}
      {activeTab === "Rankings" && <Rankings showToast={showToast} />}
      {activeTab === "Conquistas" && <Achievements showToast={showToast} />}
    </>
  );
}

export default function ArcadeExperience({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [view, setView] = useState<ArcadeView>("hub");
  const [activeTab, setActiveTab] = useState<ArcadeTab>("Destaques");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("vdn-close-arcade", close);
    return () => window.removeEventListener("vdn-close-arcade", close);
  }, [onClose]);

  if (!visible) return <div className="arc41-experience is-hidden" aria-hidden="true" />;

  if (view !== "hub") {
    const back = () => setView("hub");
    const game =
      view === "fly" ? (
        <FlyBird onBack={back} showToast={showToast} offline={offline} />
      ) : view === "quiz" ? (
        <QuizGame onBack={back} showToast={showToast} offline={offline} />
      ) : (
        <MinesGame onBack={back} showToast={showToast} offline={offline} />
      );
    return (
      <div
        className="arc41-experience immersive"
        data-immersive-surface="arcade"
        data-state-preserved="true"
      >
        <GameBoundary
          name={view === "fly" ? "Fly Bird" : view === "quiz" ? "Quiz" : "Mines"}
          onBack={back}
        >
          {game}
        </GameBoundary>
      </div>
    );
  }

  return (
    <div className="arc41-experience" data-immersive-surface="arcade" data-state-preserved="true">
      <ArcadeHub
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openGame={setView}
        showToast={showToast}
        offline={offline}
        setOffline={setOffline}
      />
    </div>
  );
}
