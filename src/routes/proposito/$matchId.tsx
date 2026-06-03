import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Gem, Clock3, Gift, Trophy } from "lucide-react";
import { GiftMedia } from "@/components/gifts/GiftMedia";
import { getCommitmentByMatch } from "@/lib/commitments";
import { Progress } from "@/components/ui/progress";

type CoupleProfile = {
  id: string;
  full_name: string;
  photo_url: string | null;
  equipped_frame_id?: string | null;
  equipped_aura_id?: string | null;
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
  const { user, loading } = useAuth();

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const [personA, setPersonA] = useState<CoupleProfile | null>(null);
  const [personB, setPersonB] = useState<CoupleProfile | null>(null);

  const [acceptedAt, setAcceptedAt] =
    useState<string | null>(null);

  const [messageCount, setMessageCount] =
    useState(0);
const [matchCreatedAt, setMatchCreatedAt] =
  useState<string | null>(null);

const [firstMessageAt, setFirstMessageAt] =
  useState<string | null>(null);
const [firstGiftAt, setFirstGiftAt] =
  useState<string | null>(null);

const [giftCount, setGiftCount] =
  useState(0);
const [galleryGifts, setGalleryGifts] =
  useState<any[]>([]);
const [achievements, setAchievements] =
  useState<any[]>([]);
  
  
  useEffect(() => {
    if (!user) return;

    (async () => {

      const commitment =
        await getCommitmentByMatch(matchId);

      if (
        !commitment ||
        commitment.status !== "active"
      ) {
        setAuthorized(false);
        return;
      }

      if (
        commitment.user_a !== user.id &&
        commitment.user_b !== user.id
      ) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);

      setAcceptedAt(
        commitment.accepted_at
      );

      const { data: profiles } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            photo_url,
            equipped_frame_id,
            equipped_aura_id
          `)
          .in("id", [
            commitment.user_a,
            commitment.user_b,
          ]);

      const a =
        profiles?.find(
          p => p.id === commitment.user_a
        ) ?? null;

      const b =
        profiles?.find(
          p => p.id === commitment.user_b
        ) ?? null;

      setPersonA(a);
      setPersonB(b);

      const { count } =
        await supabase
          .from("messages")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("match_id", matchId);

      setMessageCount(count ?? 0);
      const { data: matchData } =
  await supabase
    .from("matches")
    .select("created_at")
    .eq("id", matchId)
    .maybeSingle();

setMatchCreatedAt(
  matchData?.created_at ?? null
);

const { data: firstMessage } =
  await supabase
    .from("messages")
    .select("created_at")
    .eq("match_id", matchId)
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

setFirstMessageAt(
  firstMessage?.created_at ?? null
);

const { data: gifts } =
  await supabase
    .from("gift_transactions")
    .select(`
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
    `)
    .or(
      `
      and(sender_id.eq.${commitment.user_a},receiver_id.eq.${commitment.user_b}),
      and(sender_id.eq.${commitment.user_b},receiver_id.eq.${commitment.user_a})
      `
    )
    .order("created_at", {
      ascending: true,
    });

setGiftCount(
  gifts?.length ?? 0
);
setGalleryGifts(
  (gifts ?? []).slice(0, 8)
);
setFirstGiftAt(
  gifts?.[0]?.created_at ?? null
);

const totalMessages =
  count ?? 0;

const totalGifts =
  gifts?.length ?? 0;

const currentDays =
  commitment.accepted_at
    ? Math.max(
        1,
        Math.floor(
          (
            Date.now() -
            new Date(
              commitment.accepted_at
            ).getTime()
          ) / 86400000
        )
      )
    : 0;

setAchievements([
  {
    title: "Primeira Conversa",
    progress:
      totalMessages > 0 ? 100 : 0,
    unlocked:
      totalMessages > 0,
  },

  {
    title: "Primeiro Presente",
    progress:
      totalGifts > 0 ? 100 : 0,
    unlocked:
      totalGifts > 0,
  },

  {
    title: "100 Mensagens",
    progress:
      Math.min(
        100,
        (totalMessages / 100) * 100
      ),
    unlocked:
      totalMessages >= 100,
  },

  {
    title: "500 Mensagens",
    progress:
      Math.min(
        100,
        (totalMessages / 500) * 100
      ),
    unlocked:
      totalMessages >= 500,
  },

  {
    title: "7 Dias em Propósito",
    progress:
      Math.min(
        100,
        (currentDays / 7) * 100
      ),
    unlocked:
      currentDays >= 7,
  },

  {
    title: "30 Dias em Propósito",
    progress:
      Math.min(
        100,
        (currentDays / 30) * 100
      ),
    unlocked:
      currentDays >= 30,
  },

  {
    title: "50 Presentes",
    progress:
      Math.min(
        100,
        (totalGifts / 50) * 100
      ),
    unlocked:
      totalGifts >= 50,
  },
]);
      
    })();

  }, [matchId, user]);

  if (!loading && !user) {
    return <Navigate to="/auth/login" />;
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen">
        <Header />

        <main className="mx-auto max-w-xl px-4 py-20 text-center">

          <h1 className="text-2xl font-semibold">
            Página não disponível
          </h1>

          <p className="mt-3 text-muted-foreground">
            Este propósito não existe ou não pertence a você.
          </p>

          <Button
            asChild
            className="mt-6"
          >
            <Link to="/conversas">
              Voltar
            </Link>
          </Button>

        </main>
      </div>
    );
  }

  const daysTogether =
    acceptedAt
      ? Math.max(
          1,
          Math.floor(
            (
              Date.now() -
              new Date(acceptedAt).getTime()
            ) /
              86400000
          )
        )
      : 0;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10">

        <Link
          to="/conversas/$matchId"
          params={{ matchId }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Chat
        </Link>

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-rose-200/50
            bg-gradient-to-br
            from-rose-50
            via-pink-50
            to-purple-50
            p-8
            shadow-soft
          "
        >

          <div className="text-center">

            <div className="mb-4 text-5xl">
              💍
            </div>

            <h1 className="text-3xl font-bold">
              Propósito Firmado
            </h1>

            <p className="mt-2 text-muted-foreground">
              Um compromisso público diante da comunidade.
            </p>

          </div>

          <div className="mt-10 flex items-center justify-center gap-6">

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center">
                <DecoratedAvatar
                  photoUrl={personA?.photo_url}
                  fallback={
                    personA?.full_name?.charAt(0) ??
                    "?"
                  }
                  size={96}
                  frameId={
                    personA?.equipped_frame_id ??
                    null
                  }
                  auraId={
                    personA?.equipped_aura_id ??
                    null
                  }
                />
              </div>

              <p className="font-semibold">
                {personA?.full_name ?? "—"}
              </p>
            </div>

            <Heart className="h-8 w-8 text-rose-500" />

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center">
                <DecoratedAvatar
                  photoUrl={personB?.photo_url}
                  fallback={
                    personB?.full_name?.charAt(0) ??
                    "?"
                  }
                  size={96}
                  frameId={
                    personB?.equipped_frame_id ??
                    null
                  }
                  auraId={
                    personB?.equipped_aura_id ??
                    null
                  }
                />
              </div>

              <p className="font-semibold">
                {personB?.full_name ?? "—"}
              </p>
            </div>

          </div>

          {acceptedAt && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Desde{" "}
              {new Date(
                acceptedAt
              ).toLocaleDateString("pt-BR")}
            </p>
          )}

        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">

          <div className="glass rounded-3xl p-6 text-center shadow-soft">

            <Heart className="mx-auto mb-3 h-7 w-7 text-rose-500" />

            <div className="text-3xl font-bold">
              {daysTogether}
            </div>

            <p className="text-sm text-muted-foreground">
              Dias juntos
            </p>

          </div>

          <div className="glass rounded-3xl p-6 text-center shadow-soft">

            <MessageCircle className="mx-auto mb-3 h-7 w-7 text-primary" />

            <div className="text-3xl font-bold">
              {messageCount}
            </div>

            <p className="text-sm text-muted-foreground">
              Mensagens trocadas
            </p>
<div className="glass rounded-3xl p-6 text-center shadow-soft">

  <Gift className="mx-auto mb-3 h-7 w-7 text-amber-500" />

  <div className="text-3xl font-bold">
    {giftCount}
  </div>

  <p className="text-sm text-muted-foreground">
    Presentes trocados
  </p>

</div>
          </div>

        </section>

<section className="mt-8">

  <div className="glass rounded-3xl p-6 shadow-soft">

    <div className="mb-6 flex items-center gap-2">

      <Trophy className="h-5 w-5 text-amber-500" />

      <h2 className="font-semibold">
        Conquistas do Casal
      </h2>

    </div>

    <div className="space-y-5">

      {achievements.map(
        (achievement) => (

          <div
            key={achievement.title}
            className="
              rounded-2xl
              border
              p-4
            "
          >

            <div className="mb-2 flex items-center justify-between">

              <span className="font-medium">
                {achievement.title}
              </span>

              {achievement.unlocked ? (

                <span
                  className="
                    rounded-full
                    bg-emerald-100
                    px-2
                    py-1
                    text-xs
                    font-medium
                    text-emerald-700
                  "
                >
                  Concluído
                </span>

              ) : (

                <span
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  {Math.round(
                    achievement.progress
                  )}%
                </span>

              )}

            </div>

            <Progress
              value={
                achievement.progress
              }
            />

          </div>

        )
      )}

    </div>

  </div>

</section>
        
        <section className="mt-8">

  <div className="glass rounded-3xl p-6 shadow-soft">

    <div className="mb-6 flex items-center gap-2">

      <Clock3 className="h-5 w-5 text-primary" />

      <h2 className="font-semibold">
        Linha do Tempo
      </h2>

    </div>

    <div className="space-y-6">

      {matchCreatedAt && (
        <div className="flex gap-4">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            <Heart className="h-5 w-5 text-rose-600" />
          </div>

          <div>
            <h3 className="font-medium">
              Match realizado
            </h3>

            <p className="text-sm text-muted-foreground">
              {new Date(
                matchCreatedAt
              ).toLocaleDateString("pt-BR")}
            </p>
          </div>

        </div>
      )}

      {firstMessageAt && (
        <div className="flex gap-4">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h3 className="font-medium">
              Primeira conversa
            </h3>
{firstGiftAt && (
  <div className="flex gap-4">

    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">

      <Gift className="h-5 w-5 text-amber-600" />

    </div>

    <div>

      <h3 className="font-medium">
        Primeiro presente enviado
      </h3>

      <p className="text-sm text-muted-foreground">
        {new Date(
          firstGiftAt
        ).toLocaleDateString("pt-BR")}
      </p>

    </div>

  </div>
)}
            <p className="text-sm text-muted-foreground">
              {new Date(
                firstMessageAt
              ).toLocaleDateString("pt-BR")}
            </p>
          </div>

        </div>
      )}

      {acceptedAt && (
        <div className="flex gap-4">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Gem className="h-5 w-5 text-emerald-600" />
          </div>

          <div>
            <h3 className="font-medium">
              Propósito Firmado
            </h3>

            <p className="text-sm text-muted-foreground">
              {new Date(
                acceptedAt
              ).toLocaleDateString("pt-BR")}
            </p>
          </div>

        </div>
      )}

    </div>

  </div>

</section>

            <ul className="space-y-2 text-sm text-muted-foreground">

              <li>
                ✅ Página do casal criada
              </li>


            </ul>

          </div>

        </section>
<section className="mt-8">

  <div className="glass rounded-3xl p-6 shadow-soft">

    <div className="mb-6 flex items-center gap-2">

      <Gift className="h-5 w-5 text-amber-500" />

      <h2 className="font-semibold">
        Galeria do Relacionamento
      </h2>

    </div>

    {galleryGifts.length > 0 ? (

      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

          {galleryGifts.map((item, index) => {

            const gift = item.gift;

            if (!gift) return null;

            return (

              <div
                key={index}
                className="
                  rounded-2xl
                  border
                  bg-card
                  p-4
                  text-center
                "
              >

                <GiftMedia
                  imageUrl={gift.image_url}
                  emoji={gift.emoji}
                  rarity={gift.rarity}
                  size="md"
                />

                <p className="mt-3 text-xs font-medium">
                  {gift.name}
                </p>

              </div>

            );

          })}

        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">

          {giftCount} presentes trocados

        </p>

      </>

    ) : (

      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">

        Nenhum presente foi trocado ainda.

      </div>

    )}

  </div>

</section>
      </main>
    </div>
  );
}
