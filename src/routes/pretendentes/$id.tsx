import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Church, Heart } from "lucide-react";

type Full = {
  id: string; full_name: string; age: number; height_cm: number | null;
  city: string; state: string; church: string; bio: string | null;
  photo_url: string | null; marital: string; years_baptized: number; sex: string;
};

export const Route = createFileRoute("/pretendentes/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Full | null | undefined>(undefined);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", id).eq("status", "approved").maybeSingle()
      .then(({ data }) => setProfile(data as Full | null));
  }, [id]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (profile === undefined) return <div className="min-h-screen"><Header /></div>;
  if (!profile) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p>Perfil não encontrado.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/pretendentes">Voltar</Link></Button>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/pretendentes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[2fr_3fr]">
          <div className="animate-fade-up">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-elegant">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--gold-soft)] to-[var(--accent)]">
                  <span className="font-serif text-7xl text-white">{profile.full_name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="animate-fade-up space-y-6" style={{ animationDelay: "80ms" }}>
            <div>
              <h1 className="font-serif text-4xl font-semibold">{profile.full_name}, {profile.age}</h1>
              <p className="mt-1 text-muted-foreground">{profile.marital === "solteiro" ? "Solteiro(a)" : "Divorciado(a)"} {profile.height_cm ? `· ${profile.height_cm} cm` : ""}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--gold)]" /> {profile.city}, {profile.state}</div>
              <div className="flex items-center gap-2"><Church className="h-4 w-4 text-[var(--gold)]" /> {profile.church} · {profile.years_baptized} anos de batismo</div>
            </div>

            {profile.bio && (
              <div className="glass rounded-2xl p-5 shadow-soft">
                <h3 className="font-serif text-lg font-semibold">Sobre</h3>
                <p className="mt-2 leading-relaxed text-foreground/80">{profile.bio}</p>
              </div>
            )}

            <Button size="lg" className="w-full shadow-glow" disabled>
              <Heart className="mr-2 h-4 w-4" /> + Interesse (em breve)
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
