import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Check, Loader2, Sparkles, X } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/quiz-biblico")({ component: QuizPage });

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  reference: string;
  difficulty: string;
  already_answered: boolean;
  was_correct: boolean | null;
  chosen_index: number | null;
  correct_index: number | null;
  explanation: string | null;
};

function QuizPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Question[] | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.rpc("get_today_quiz" as never);
    setItems(((data as unknown) as Question[]) ?? []);
  }

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  const answered = (items ?? []).filter((q) => q.already_answered);
  const correctCount = answered.filter((q) => q.was_correct).length;
  const remaining = 3 - answered.length;

  async function answer(q: Question, idx: number) {
    if (q.already_answered) return;
    setSubmitting(q.id);
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>)("answer_quiz", {
      _question_id: q.id,
      _chosen: idx,
    });
    setSubmitting(null);
    if (error) {
      const msg = (error as { message?: string })?.message ?? "Erro ao responder";
      toast.error(msg);
      await load();
      return;
    }
    const row = ((data as unknown) as Array<{
      correct: boolean;
      correct_index: number;
      reference: string;
      explanation: string;
    }>)?.[0];
    if (!row) {
      await load();
      return;
    }
    setItems((prev) =>
      (prev ?? []).map((p) =>
        p.id === q.id
          ? {
              ...p,
              already_answered: true,
              was_correct: row.correct,
              chosen_index: idx,
              correct_index: row.correct_index,
              explanation: row.explanation,
            }
          : p,
      ),
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
        <Link
          to="/meu-pet"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>

        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-neutral-900">
              <BookOpen className="size-5 text-sky-500" /> Quiz Bíblico
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              3 perguntas por dia. Cada acerto vale +10 XP. Terminar as 3 dá bônus em moedas.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-wide text-neutral-400">Hoje</div>
            <div className="text-sm font-semibold tabular-nums text-neutral-900">
              {correctCount}/{answered.length || 3}
            </div>
          </div>
        </header>

        {items === null ? (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            Sem perguntas disponíveis hoje. Volte amanhã.
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i + 1}
                submitting={submitting === q.id}
                onPick={(idx) => answer(q, idx)}
              />
            ))}
            {remaining > 0 && (
              <p className="pt-1 text-center text-xs text-neutral-400">
                Faltam {remaining} {remaining === 1 ? "pergunta" : "perguntas"} hoje
              </p>
            )}
            {remaining === 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center text-sm text-emerald-700">
                <Sparkles className="mx-auto mb-1 size-4" />
                Quiz do dia concluído — {correctCount}/3 acertos. Volte amanhã para novas
                perguntas.
              </div>
            )}
          </ul>
        )}
      </main>
    </>
  );
}

function QuestionCard({
  q,
  index,
  submitting,
  onPick,
}: {
  q: Question;
  index: number;
  submitting: boolean;
  onPick: (idx: number) => void;
}) {
  const opts = [q.option_a, q.option_b, q.option_c];
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-400">
        <span>Pergunta {index}</span>
        <span>{q.reference}</span>
      </div>
      <p className="mb-4 text-[15px] font-medium text-neutral-900">{q.question}</p>
      <div className="space-y-2">
        {opts.map((text, idx) => {
          const isCorrect = q.already_answered && q.correct_index === idx;
          const isChosen = q.already_answered && q.chosen_index === idx;
          const isWrongChosen = isChosen && !q.was_correct;
          return (
            <button
              key={idx}
              type="button"
              disabled={q.already_answered || submitting}
              onClick={() => onPick(idx)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                !q.already_answered &&
                  "border-neutral-200 bg-white hover:border-sky-300 hover:bg-sky-50/50",
                isCorrect && "border-emerald-300 bg-emerald-50 text-emerald-800",
                isWrongChosen && "border-rose-300 bg-rose-50 text-rose-800",
                q.already_answered && !isCorrect && !isWrongChosen && "opacity-60",
              )}
            >
              <span>{text}</span>
              {isCorrect && <Check className="size-4 text-emerald-600" />}
              {isWrongChosen && <X className="size-4 text-rose-600" />}
            </button>
          );
        })}
      </div>
      {q.already_answered && q.explanation && (
        <div
          className={cn(
            "mt-3 rounded-xl border p-3 text-xs",
            q.was_correct
              ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
              : "border-neutral-200 bg-neutral-50 text-neutral-600",
          )}
        >
          <div className="mb-0.5 font-semibold">
            {q.was_correct ? "Correto" : "Resposta correta"} · {q.reference}
          </div>
          {q.explanation}
        </div>
      )}
    </li>
  );
}