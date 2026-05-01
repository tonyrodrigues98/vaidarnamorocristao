import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Users, Heart, MessageCircle, Sparkles } from "lucide-react";

type Profile = { status: "pending" | "approved" | "rejected" | "banned"; full_name: string | null; rejection_reason: string | null };

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("status, full_name, rejection_reason").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (profile === undefined) return <div className="min-h-screen"><Header /></div>;

  // No profile yet → onboarding
  if (!profile) return <Navigate to="/onboarding/etapa-1" />;

  const statusInfo = {
    pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", title: "Perfil em análise", text: "Sua inscrição está sendo revisada por nossa equipe. Você será avisado(a) assim que for aprovada." },
    approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", title: "Perfil aprovado!", text: "Bem-vindo(a) à comunidade. Conheça os pretendentes." },
    rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", title: "Perfil rejeitado", text: profile.rejection_reason ?? "Entre em contato com a equipe." },
    banned: { icon: XCircle, color: "text-red-700", bg: "bg-red-50", title: "Conta suspensa", text: "Sua conta foi suspensa." },
  }[profile.status];

  const Icon = statusInfo.icon;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-fade-up">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-4xl font-semibold">{profile.full_name?.split(" ")[0] ?? "Bem-vindo(a)"}</h1>
        </div>

        <div className={`glass animate-fade-up mt-8 flex items-start gap-4 rounded-3xl p-6 shadow-soft`}>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusInfo.bg}`}>
            <Icon className={`h-6 w-6 ${statusInfo.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{statusInfo.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{statusInfo.text}</p>
            {profile.status === "approved" && (
              <Button asChild className="mt-4"><Link to="/pretendentes">Ver pretendentes</Link></Button>
            )}
            {profile.status === "rejected" && (
              <Button asChild variant="outline" className="mt-4"><Link to="/onboarding/etapa-1">Editar perfil</Link></Button>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashCard to="/pretendentes" Icon={Users} title="Pretendentes" desc="Conheça pessoas com a mesma fé" />
          <DashCard to="/interesses" Icon={Sparkles} title="Interesses" desc="Quem demonstrou interesse" />
          <DashCard to="/matches" Icon={Heart} title="Matches" desc="Conexões com reciprocidade" />
          <DashCard to="/conversas" Icon={MessageCircle} title="Conversas" desc="Suas mensagens privadas" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DashCard to="/perfil" Icon={Heart} title="Meu perfil" desc="Edite seus dados e preferências" />
        </div>
      </main>
    </div>
  );
}

function DashCard({
  to, Icon, title, desc,
}: { to: string; Icon: typeof Users; title: string; desc: string }) {
  return (
    <Link to={to} className="glass group animate-fade-up rounded-2xl p-6 shadow-soft transition hover:shadow-elegant">
      <Icon className="mb-3 h-6 w-6 text-[var(--rose)]" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
