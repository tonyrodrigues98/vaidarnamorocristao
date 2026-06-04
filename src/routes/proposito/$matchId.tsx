import { RequireApproved } from "@/components/RequireApproved";
import { TimeCapsuleCard } from "@/components/commitment/TimeCapsuleCard";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { GiftMedia } from "@/components/gifts/GiftMedia";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { endCommitment, getCommitmentByMatch } from "@/lib/commitments";
import { friendlyError } from "@/lib/errors";
import { findRestrictedWord, useRestrictedWords } from "@/lib/profanity";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Gem,
  Gift,
  Heart,
  MessageCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type CoupleProfile = {
  id: string;
  full_name: string;
  photo_url: string | null;
  equipped_frame_id?: string | null;
  equipped_aura_id?: string | null;
};

type Msg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Achievement = {
  title: string;
  progress: number;
  unlocked: boolean;
};

export const Route = createFileRoute("/proposito/$matchId")({
  component: () => (
    <RequireApproved>
      <CouplePage />
    </RequireApproved>
  ),
});

function CouplePage() {
  const { matchId } = Route.useParams();
  const { user, loading, role } = useAuth();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [personA, setPersonA] = useState<CoupleProfile | null>(null);
  const [personB, setPersonB] = useState<CoupleProfile | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [matchCreatedAt, setMatchCreatedAt] = useState<string | null>(null);
  const [firstMessageAt, setFirstMessageAt] = useState<string | null>(null);
  const [firstGiftAt, setFirstGiftAt] = useState<string | null>(null);
  const [giftCount, setGiftCount] = useState(0);
  const [galleryGifts, setGalleryGifts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const restrictedWords = useRestrictedWords();

  useEffect(() => {
    if (!user) return;

    (async () => {
      const commitment = await getCommitmentByMatch(matchId);

      if (!commitment || commitment.status !== "active") {
        setAuthorized(false);
        return;
      }

      if (commitment.user_a !== user.id && commitment.user_b !== user.id) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      setAcceptedAt(commitment.accepted_at);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, equipped_frame_id, equipped_aura_id")
        .in("id", [commitment.user_a, commitment.user_b]);

      setPersonA(
        (profiles?.find((p) => p.id === commitment.user_a) ?? null) as CoupleProfile | null,
      );
      setPersonB(
        (profiles?.find((p) => p.id === commitment.user_b) ?? null) as CoupleProfile | null,
      );

      const { count } = await supabase
        .from("messages")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("match_id", matchId);

      setMessageCount(count ?? 0);

      const { data: matchData } = await supabase
        .from("matches")
        .select("created_at")
        .eq("id", matchId)
        .maybeSingle();
      setMatchCreatedAt(matchData?.created_at ?? null);

      const { data: firstMessage } = await supabase
        .from("messages")
        .select("created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      setFirstMessageAt(firstMessage?.created_at ?? null);

      const { data: gifts } = await supabase
        .from("gift_transactions")
        .select(
          `
            created_at,
            sender_id,
            receiver_id,
            gift:virtual_gifts(
              id,
              name,
              image_url,
              emoji,
              rarity
            )
          `,
        )
        .or(
          `
            and(sender_id.eq.${commitment.user_a},receiver_id.eq.${commitment.user_b}),
            and(sender_id.eq.${commitment.user_b},receiver_id.eq.${commitment.user_a})
          `,
        )
        .order("created_at", { ascending: true });

      const totalMessages = count ?? 0;
      const totalGifts = gifts?.length ?? 0;
      const currentDays = commitment.accepted_at
        ? Math.max(
            1,
            Math.floor((Date.now() - new Date(commitment.accepted_at).getTime()) / 86400000),
          )
        : 0;

      setGiftCount(totalGifts);
      setGalleryGifts((gifts ?? []).slice(0, 8));
      setFirstGiftAt(gifts?.[0]?.created_at ?? null);
      setAchievements([
        {
          title: "Primeira conversa",
          progress: totalMessages > 0 ? 100 : 0,
          unlocked: totalMessages > 0,
        },
        {
          title: "Primeiro presente",
          progress: totalGifts > 0 ? 100 : 0,
          unlocked: totalGifts > 0,
        },
        {
          title: "100 mensagens",
          progress: Math.min(100, (totalMessages / 100) * 100),
          unlocked: totalMessages >= 100,
        },
        {
          title: "500 mensagens",
          progress: Math.min(100, (totalMessages / 500) * 100),
          unlocked: totalMessages >= 500,
        },
        {
          title: "7 dias em Propósito",
          progress: Math.min(100, (currentDays / 7) * 100),
          unlocked: currentDays >= 7,
        },
        {
          title: "30 dias em Propósito",
          progress: Math.min(100, (currentDays / 30) * 100),
          unlocked: currentDays >= 30,
        },
        {
          title: "50 presentes",
          progress: Math.min(100, (totalGifts / 50) * 100),
          unlocked: totalGifts >= 50,
        },
      ]);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at");
      const typedMessages = (msgs ?? []) as Msg[];

      setMessages(typedMessages);

      const unread = typedMessages.filter(
        (message) => message.sender_id !== user.id && !message.read_at,
      );
      await Promise.all(
        unread.map((message) => supabase.rpc("mark_message_read", { _message_id: message.id })),
      );
    })();
  }, [matchId, user]);

  useEffect(() => {
    if (!user || authorized !== true) return;

    const channel = supabase
      .channel(`couple-chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const message = payload.new as Msg;

          setMessages((prev) =>
            prev.some((item) => item.id === message.id) ? prev : [...prev, message],
          );
          setMessageCount((prev) => prev + 1);

          if (message.sender_id !== user.id) {
            supabase.rpc("mark_message_read", { _message_id: message.id });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updated = payload.new as Msg;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === updated.id ? { ...message, ...updated } : message,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((message) => message.id !== removed.id));
          setMessageCount((prev) => Math.max(0, prev - 1));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized, matchId, user]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!loading && !user) {
    return <Navigate to="/auth/login" />;
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Página não disponível</h1>
          <p className="mt-3 text-muted-foreground">
            Este propósito não existe ou não pertence a você.
          </p>
          <Button asChild className="mt-6">
            <Link to="/conversas">Voltar</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-[420px] animate-pulse rounded-[2rem] border bg-muted/40" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-3xl border bg-muted/40" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const daysTogether = acceptedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(acceptedAt).getTime()) / 86400000))
    : 0;

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !input.trim()) return;

    const content = input.trim().slice(0, 2000);
    const hit = findRestrictedWord(content, restrictedWords);

    if (hit) {
      setWarning(hit);
      return;
    }

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });

    setSending(false);

    if (error) {
      toast.error(friendlyError(error));
      return;
    }

    setInput("");
  }

  async function handleEndCommitment() {
    if (!user || ending) return;
    setEnding(true);

    try {
      const commitment = await getCommitmentByMatch(matchId);

      if (!commitment || commitment.status !== "active") {
        throw new Error("Não foi possível encontrar o propósito ativo.");
      }

      await endCommitment(commitment.id);
    } catch (error) {
      toast.error(friendlyError(error));
      setEnding(false);
      return;
    }

    toast.success("Propósito encerrado. A área voltou ao estado normal.");
    setEndDialogOpen(false);
    window.location.assign("/pretendentes");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link
          to="/conversas"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <section className="relative overflow-hidden rounded-[2rem] border border-rose-200/50 bg-gradient-to-br from-rose-50 via-white to-emerald-50 p-6 shadow-soft dark:border-rose-900/40 dark:from-rose-950/20 dark:via-background dark:to-emerald-950/20 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(244,114,182,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_30%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <Gem className="h-3.5 w-3.5" />
                Propósito Firmado
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {personA?.full_name?.split(" ")[0] ?? "Casal"} e{" "}
                {personB?.full_name?.split(" ")[0] ?? "Propósito"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Um espaço reservado para acompanhar a caminhada, conversar com intenção e guardar os
                marcos desse compromisso.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <HeroPill
                  icon={<CalendarDays className="h-4 w-4" />}
                  label={`${daysTogether} dias em propósito`}
                />
                <HeroPill
                  icon={<MessageCircle className="h-4 w-4" />}
                  label={`${messageCount.toLocaleString("pt-BR")} mensagens`}
                />
                <HeroPill
                  icon={<Gift className="h-4 w-4" />}
                  label={`${giftCount.toLocaleString("pt-BR")} presentes`}
                />
              </div>

              {acceptedAt && (
                <p className="mt-5 text-sm text-muted-foreground">
                  Firmado em {new Date(acceptedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-background/45">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                <CoupleAvatar person={personA} />
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 shadow-md dark:border-rose-900/50 dark:bg-background">
                  <Heart className="h-7 w-7" fill="currentColor" />
                </div>
                <CoupleAvatar person={personB} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Heart className="h-6 w-6" />}
            value={daysTogether}
            label="Dias juntos"
            tone="rose"
          />
          <StatCard
            icon={<MessageCircle className="h-6 w-6" />}
            value={messageCount}
            label="Mensagens trocadas"
            tone="primary"
          />
          <StatCard
            icon={<Gift className="h-6 w-6" />}
            value={giftCount}
            label="Presentes trocados"
            tone="amber"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border bg-card/80 p-5 shadow-soft backdrop-blur sm:p-6">
            <SectionHeader
              icon={<Trophy className="h-5 w-5 text-amber-500" />}
              title="Conquistas do Casal"
            />
            <div className="mt-5 space-y-4">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.title} achievement={achievement} />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border bg-card/80 p-5 shadow-soft backdrop-blur sm:p-6">
            <SectionHeader
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              title="Linha do Tempo"
            />
            <div className="mt-5 space-y-5">
              {matchCreatedAt && (
                <TimelineItem
                  icon={<Heart className="h-5 w-5" />}
                  title="Match realizado"
                  date={new Date(matchCreatedAt).toLocaleDateString("pt-BR")}
                  tone="rose"
                />
              )}
              {firstMessageAt && (
                <TimelineItem
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Primeira conversa"
                  date={new Date(firstMessageAt).toLocaleDateString("pt-BR")}
                  tone="primary"
                />
              )}
              {firstGiftAt && (
                <TimelineItem
                  icon={<Gift className="h-5 w-5" />}
                  title="Primeiro presente enviado"
                  date={new Date(firstGiftAt).toLocaleDateString("pt-BR")}
                  tone="amber"
                />
              )}
              {acceptedAt && (
                <TimelineItem
                  icon={<Gem className="h-5 w-5" />}
                  title="Propósito Firmado"
                  date={new Date(acceptedAt).toLocaleDateString("pt-BR")}
                  tone="emerald"
                />
              )}
            </div>
          </div>
        </section>

        <div className="mt-6">
          <TimeCapsuleCard matchId={matchId} />
        </div>

        <section className="mt-6 rounded-[2rem] border bg-card/80 p-5 shadow-soft backdrop-blur sm:p-6">
          <SectionHeader
            icon={<Gift className="h-5 w-5 text-amber-500" />}
            title="Galeria do Relacionamento"
          />

          {galleryGifts.length > 0 ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {galleryGifts.map((item, index) => {
                  const gift = item.gift;

                  if (!gift) return null;

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border bg-background/70 p-4 text-center shadow-sm"
                    >
                      <GiftMedia
                        imageUrl={gift.image_url}
                        emoji={gift.emoji}
                        rarity={gift.rarity}
                        size="md"
                      />
                      <p className="mt-3 text-xs font-medium">{gift.name}</p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {giftCount} presentes trocados
              </p>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Nenhum presente foi trocado ainda.
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border bg-card/85 shadow-soft backdrop-blur">
          <div className="border-b p-5 sm:p-6">
            <SectionHeader
              icon={<MessageCircle className="h-5 w-5 text-primary" />}
              title="Conversa do Casal"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Esse chat fica aqui para manter a conversa ativa durante o Propósito Firmado.
            </p>
          </div>

          <div ref={chatRef} className="max-h-[520px] space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Comecem a conversa do casal com calma, respeito e intenção.
              </div>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        mine
                          ? "bg-gradient-love text-white"
                          : "border bg-background/80 text-foreground backdrop-blur"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <p
                        className={`mt-1 flex items-center gap-1 text-[10px] ${
                          mine ? "text-white/75" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {mine && message.read_at && (
                          <>
                            <Check className="h-3 w-3" />
                            Visto
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t bg-background/70 p-4 backdrop-blur sm:p-5"
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva uma mensagem para o casal..."
                maxLength={2000}
                className="rounded-2xl"
              />
              <Button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-2xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>

        {(role === "super_admin" ||
          (user && (user.id === personA?.id || user.id === personB?.id))) && (
          <section className="mt-6 rounded-[2rem] border border-border bg-card/85 p-5 shadow-soft backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Encerrar propósito</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use este controle quando o compromisso precisar voltar ao estado normal.
                </p>
              </div>
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={() => setEndDialogOpen(true)}
                disabled={ending}
              >
                {ending ? "Encerrando..." : "Encerrar propósito"}
              </Button>
            </div>
          </section>
        )}
      </main>

      <Dialog open={endDialogOpen} onOpenChange={(open) => !ending && setEndDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar propósito</DialogTitle>
            <DialogDescription>
              Encerrar este propósito vai liberar a área de pretendentes, matches e conversas
              novamente para os participantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEndDialogOpen(false)} disabled={ending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleEndCommitment()}
              disabled={ending}
            >
              {ending ? "Encerrando..." : "Encerrar propósito"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!warning} onOpenChange={(open) => !open && setWarning(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center">Mensagem bloqueada</DialogTitle>
            <DialogDescription className="text-center">
              A palavra <span className="font-semibold text-foreground">"{warning}"</span> fere as
              diretrizes da comunidade. Por favor, reescreva sua mensagem com respeito e cuidado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button onClick={() => setWarning(null)}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/50">
      {icon}
      {label}
    </span>
  );
}

function CoupleAvatar({ person }: { person: CoupleProfile | null }) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
        <DecoratedAvatar
          photoUrl={person?.photo_url}
          fallback={person?.full_name?.charAt(0) ?? "?"}
          size={112}
          frameId={person?.equipped_frame_id ?? null}
          auraId={person?.equipped_aura_id ?? null}
          isCommitted
        />
      </div>
      <p className="truncate text-sm font-semibold sm:text-base">{person?.full_name ?? "..."}</p>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "rose" | "primary" | "amber";
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-500 bg-rose-500/10"
      : tone === "amber"
        ? "text-amber-500 bg-amber-500/10"
        : "text-primary bg-primary/10";

  return (
    <div className="rounded-[2rem] border bg-card/80 p-6 shadow-soft backdrop-blur">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        {icon}
      </div>
      <div className="text-3xl font-bold tracking-tight">{value.toLocaleString("pt-BR")}</div>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-medium">{achievement.title}</span>
        {achievement.unlocked ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
            Concluído
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{Math.round(achievement.progress)}%</span>
        )}
      </div>
      <Progress value={achievement.progress} />
    </div>
  );
}

function TimelineItem({
  icon,
  title,
  date,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  date: string;
  tone: "rose" | "primary" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-500/10 text-rose-600"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : tone === "emerald"
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-primary/10 text-primary";

  return (
    <div className="flex gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}
