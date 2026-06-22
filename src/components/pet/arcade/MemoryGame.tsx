import { useEffect, useState } from "react";
import { Brain, PawPrint, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { PetImg } from "@/components/pet/PetImg";
import {
  getArcadeErrorMessage,
  revealMemoryCard,
  resumeArcadeGame,
  startMemory,
  type ArcadeGameResult,
} from "@/lib/petArcade";
import {
  ArcadePanel,
  DifficultyButtons,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";

type MemoryCardData = { id?: string; name?: string; image_url?: string };

export function MemoryGame({
  config,
  balance,
  activeRound,
  onBalanceChange,
  onFinished,
}: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [difficulty, setDifficulty] = useState("leve");
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<ArcadeGameResult | null>(null);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [cards, setCards] = useState<Record<number, MemoryCardData>>({});
  const [matched, setMatched] = useState<number[]>([]);
  const [pending, setPending] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!activeRound || round || result) return;
    void resumeArcadeGame(activeRound.round_id)
      .then((next) => {
        setRound(next);
        setMatched(Array.isArray(next.matched) ? (next.matched as number[]) : []);
        setAttempts(Number(next.attempts ?? 0));
        const visible = Array.isArray(next.visible_cards)
          ? (next.visible_cards as { position: number; card: MemoryCardData }[])
          : [];
        setCards(Object.fromEntries(visible.map((item) => [item.position, item.card])));
      })
      .catch(() => undefined);
  }, [activeRound, result, round]);

  async function start() {
    if (!validateEntry(entry, config, balance) && entry !== 0)
      return toast.error("Revise a quantidade de moedas.");
    setBusy(true);
    setResult(null);
    setCards({});
    setMatched([]);
    setPending(null);
    setAttempts(0);
    try {
      const next = await startMemory(entry, difficulty, createArcadeClientSeed());
      setRound(next);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function reveal(position: number) {
    if (!round || busy || cards[position] || matched.includes(position)) return;
    setBusy(true);
    try {
      const next = await revealMemoryCard(round.game_id, position);
      const card = (next.card ?? {}) as MemoryCardData;
      const firstPosition = typeof next.first_position === "number" ? next.first_position : null;
      const firstCard = (next.first_card ?? {}) as MemoryCardData;
      setCards((current) => ({
        ...current,
        ...(firstPosition !== null ? { [firstPosition]: firstCard } : {}),
        [position]: card,
      }));
      setAttempts(Number(next.attempts ?? attempts));
      if (next.status !== "active") {
        setMatched(Array.from({ length: Number(round.card_count ?? 0) }, (_, index) => index));
        window.setTimeout(() => {
          setResult(next);
          setRound(null);
          if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
          onFinished();
        }, 650);
      } else if (firstPosition === null) {
        setPending(position);
      } else if (next.is_match) {
        setMatched((current) => [...new Set([...current, firstPosition, position])]);
        setPending(null);
      } else {
        setPending(null);
        window.setTimeout(() => {
          setCards((current) => {
            const copy = { ...current };
            delete copy[firstPosition];
            delete copy[position];
            return copy;
          });
        }, 800);
      }
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const cardCount = Number(round?.card_count ?? 0);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Brain className="size-5" />}
    >
      <div className="space-y-4">
        {round ? (
          <>
            <div className="flex items-center justify-between rounded-2xl bg-teal-50 px-4 py-3 text-xs font-bold text-teal-800">
              <span>Tentativas: {attempts}</span>
              <span>
                Pares: {matched.length / 2}/{Number(round.pairs ?? cardCount / 2)}
              </span>
            </div>
            <div className={`grid gap-2 ${cardCount > 12 ? "grid-cols-4" : "grid-cols-4"}`}>
              {Array.from({ length: cardCount }, (_, position) => {
                const card = cards[position];
                const open = Boolean(card) || matched.includes(position);
                return (
                  <motion.button
                    key={position}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    disabled={busy || open}
                    onClick={() => void reveal(position)}
                    className="relative aspect-[0.78] overflow-hidden rounded-2xl [perspective:600px]"
                  >
                    <motion.div
                      animate={{ rotateY: open ? 180 : 0 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 [transform-style:preserve-3d]"
                    >
                      <div className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-500 to-cyan-600 text-white [backface-visibility:hidden]">
                        <PawPrint className="size-6" />
                      </div>
                      <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-white bg-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        {card?.image_url ? (
                          <PetImg
                            src={card.image_url}
                            alt={card.name ?? "Pet"}
                            className="size-full object-contain p-1"
                          />
                        ) : (
                          <PawPrint className="m-auto mt-5 size-6 text-teal-500" />
                        )}
                      </div>
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-center text-xs text-neutral-500">
              {pending !== null ? "Agora escolha a segunda carta." : "Encontre duas cartas iguais."}
            </p>
          </>
        ) : result ? (
          <ResultCard
            result={result}
            title={`Memória concluída em ${Number(result.result?.attempts ?? attempts)} tentativas`}
            onAgain={() => setResult(null)}
          />
        ) : (
          <>
            <div className="grid min-h-44 place-items-center rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-700">
              <Brain className="size-20 opacity-70" />
            </div>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => setEntry(0)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-teal-800"
            >
              <RotateCcw className="size-4" /> Usar rodada gratuita disponível
            </button>
            <DifficultyButtons value={difficulty} onChange={setDifficulty} disabled={busy} />
            <StartButton busy={busy} onClick={() => void start()}>
              Começar memória
            </StartButton>
          </>
        )}
      </div>
    </ArcadePanel>
  );
}
