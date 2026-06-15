import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePetDayNight } from "@/lib/petDayNight";
import { cn } from "@/lib/utils";

type Confession = {
  id: string;
  text: string;
  category: string;
  effect_kind: string | null;
  effect_delta: number | null;
};

type DreamMatch = {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string;
  state: string;
  age: number;
};

type Active =
  | { kind: "text"; data: Confession }
  | { kind: "dream"; data: Confession; match: DreamMatch }
  | { kind: "loading" };

const AUTO_MIN_MS = 30 * 60_000; // 30 min
const AUTO_MAX_MS = 90 * 60_000; // 90 min
const VISIBLE_MS = 7000;
const DREAM_CHANCE_AT_NIGHT = 0.15;

/**
 * Balão de fala flutuante do pet.
 * - Auto-dispara a cada 30–90 min enquanto a tela do pet está visível.
 * - Botão manual via prop `onRequest` (controle externo).
 * - À noite, com chance baixa, troca por "sonho com pretendente".
 */
export function PetConfessionBubble({
  triggerKey,
}: {
  /** Incrementar este valor força exibir uma nova confissão (botão manual). */
  triggerKey?: number;
}) {
  const { phase } = usePetDayNight();
  const isNight = phase === "night";
  const [active, setActive] = useState<Active | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  async function fetchDreamMatch(): Promise<DreamMatch | null> {
    const { data } = await supabase.rpc("get_pet_dream_match" as never);
    const row = ((data as unknown) as DreamMatch[])?.[0];
    return row ?? null;
  }

  async function fetchConfession(): Promise<Confession | null> {
    const { data } = await supabase.rpc("get_next_pet_confession" as never);
    const row = ((data as unknown) as Confession[])?.[0];
    return row ?? null;
  }

  async function showNew(manual = false) {
    if (manual) {
      if (hideRef.current) clearTimeout(hideRef.current);
      setActive({ kind: "loading" });
    }
    let next: Active | null = null;
    if (isNight && Math.random() < DREAM_CHANCE_AT_NIGHT) {
      const match = await fetchDreamMatch();
      if (match) {
        next = {
          kind: "dream",
          match,
          data: {
            id: `dream-${match.id}`,
            text: `Sonhei com alguém especial… acho que era ${match.full_name.split(" ")[0]}.`,
            category: "sonho",
            effect_kind: null,
            effect_delta: 0,
          },
        };
      }
    }
    if (!next) {
      const c = await fetchConfession();
      if (c) next = { kind: "text", data: c };
    }
    if (!next) {
      if (manual) {
        setActive(null);
        toast.message("Seu pet está quietinho agora", {
          description: "Tente novamente em instantes.",
        });
      }
      return;
    }
    setActive(next);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(
      () => setActive(null),
      next.kind === "dream" ? VISIBLE_MS * 2 : VISIBLE_MS,
    );
  }

  function scheduleAuto() {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = AUTO_MIN_MS + Math.random() * (AUTO_MAX_MS - AUTO_MIN_MS);
    timerRef.current = setTimeout(async () => {
      if (document.visibilityState === "visible") await showNew();
      scheduleAuto();
    }, delay);
  }

  // Auto-trigger
  useEffect(() => {
    // Mostra uma logo ao montar (pequeno delay), depois alterna em 30–90 min
    const initial = setTimeout(() => {
      if (document.visibilityState === "visible") void showNew();
    }, 4_000);
    scheduleAuto();
    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger manual via botão externo
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void showNew(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  // Garante que o balão fique visível ao usuário (especialmente em mobile,
  // quando o botão "Pensamento" está abaixo do pet e o balão aparece acima).
  useEffect(() => {
    if (!active) return;
    bubbleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  if (!active) return null;

  const isDream = active.kind === "dream";
  const isLoading = active.kind === "loading";
  return (
    <div
      ref={bubbleRef}
      className="pointer-events-none absolute left-1/2 top-3 z-30 w-[min(92%,320px)] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-500"
    >
      <div
        className={cn(
          "pointer-events-auto relative rounded-2xl border bg-white px-3 py-2.5 shadow-lg",
          isDream ? "border-indigo-200" : "border-neutral-200",
        )}
      >
        <button
          type="button"
          onClick={() => setActive(null)}
          aria-label="Fechar"
          className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-neutral-300 hover:text-neutral-500"
        >
          <X className="size-3.5" />
        </button>
        <div className="flex items-start gap-2 pr-4">
          <div
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
              isDream ? "bg-indigo-100 text-indigo-600" : "bg-sky-100 text-sky-600",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : isDream ? (
              <Sparkles className="size-3.5" />
            ) : (
              <MessageCircle className="size-3.5" />
            )}
          </div>
          <p className="text-[13px] leading-snug text-neutral-700">
            {isLoading ? "Ouvindo seu pet…" : active.data.text}
          </p>
        </div>
        {!isLoading && isDream && (
          <Link
            to="/pretendentes/$id"
            params={{ id: active.match.id }}
            className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-50 px-2 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
          >
            {active.match.photo_url && (
              <img
                src={active.match.photo_url}
                alt=""
                className="size-6 rounded-full object-cover"
              />
            )}
            <span className="flex-1 truncate">
              Ver {active.match.full_name.split(" ")[0]} · {active.match.city}
            </span>
          </Link>
        )}
        {/* "rabinho" do balão apontando pro pet abaixo */}
        <span
          className={cn(
            "absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r bg-white",
            isDream ? "border-indigo-200" : "border-neutral-200",
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}