import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Gem } from "lucide-react";
import { getCommitmentByMatch } from "@/lib/commitments";

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

        <section className="mt-8 grid gap-4 md:grid-cols-2">

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

          </div>

        </section>

        <section className="mt-8">

          <div className="glass rounded-3xl p-6 shadow-soft">

            <div className="mb-4 flex items-center gap-2">

              <Gem className="h-5 w-5 text-emerald-600" />

              <h2 className="font-semibold">
                Próximas etapas
              </h2>

            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">

              <li>
                ✅ Página do casal criada
              </li>


            </ul>

          </div>

        </section>

      </main>
    </div>
  );
}
