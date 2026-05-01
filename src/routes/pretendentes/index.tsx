import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";

type Profile = {
  id: string; full_name: string; age: number; city: string; state: string;
  church: string; bio: string | null; photo_url: string | null; sex: "masculino" | "feminino";
};

export const Route = createFileRoute("/pretendentes/")({ component: List });

function List() {
  const { user, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [mySex, setMySex] = useState<"masculino" | "feminino" | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: me } = await supabase.from("profiles").select("status, sex").eq("id", user.id).maybeSingle();
      setMyStatus(me?.status ?? null);
      setMySex(me?.sex ?? null);
      if (me?.status === "approved") {
        const targetSex = me.sex === "masculino" ? "feminino" : "masculino";
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, age, city, state, church, bio, photo_url, sex")
          .eq("status", "approved")
          .eq("sex", targetSex)
          .neq("id", user.id)
          .order("created_at", { ascending: false });
        setProfiles((data ?? []) as Profile[]);
      }
      setLoadingList(false);
    })();
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-semibold">Pretendentes</h1>
          <p className="mt-1 text-muted-foreground">
            {mySex === "masculino" ? "Mulheres" : mySex === "feminino" ? "Homens" : "Pessoas"} cristãs aprovados na plataforma.
          </p>
        </div>

        {myStatus !== "approved" ? (
          <div className="glass mt-8 rounded-2xl p-8 text-center shadow-soft">
            <p className="text-muted-foreground">Você precisa ter o perfil aprovado para ver os pretendentes.</p>
          </div>
        ) : loadingList ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="glass h-80 animate-pulse rounded-2xl" />)}
          </div>
        ) : profiles.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-12 text-center shadow-soft">
            <p className="text-xl">Ainda não há pretendentes para mostrar.</p>
            <p className="mt-2 text-sm text-muted-foreground">Volte em breve — nossa comunidade está crescendo.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p, i) => (
              <Link key={p.id} to="/pretendentes/$id" params={{ id: p.id }}
                className="glass group animate-fade-up overflow-hidden rounded-2xl shadow-soft transition hover:shadow-elegant"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-love">
                      <span className="text-5xl text-white">{p.full_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold">{p.full_name.split(" ")[0]}, {p.age}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.city} · {p.state}</p>
                  <p className="mt-1 text-xs text-[var(--rose)]">{p.church}</p>
                  {p.bio && <p className="mt-3 line-clamp-2 text-sm text-foreground/70">{p.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
