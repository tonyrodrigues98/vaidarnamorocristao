import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Heart, Shield, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Encontros de Fé — Onde a fé encontra o amor" },
      { name: "description", content: "A plataforma cristã de relacionamentos sérios. Conheça pretendentes que vivem e compartilham a sua fé." },
    ],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative mx-auto max-w-5xl px-4 pt-20 pb-24 text-center md:pt-32 md:pb-32">
          <div className="animate-fade-up">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--gold-soft)] bg-card/60 px-4 py-1.5 text-xs font-medium text-[var(--gold)] shadow-soft">
              <Sparkles className="h-3 w-3" /> Plataforma cristã de relacionamentos sérios
            </span>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Onde a fé <em className="text-gradient-gold not-italic">encontra</em> o amor.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Um espaço sereno e seguro para cristãos solteiros e divorciados que buscam um relacionamento com propósito eterno.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="shadow-glow">
                <Link to="/auth/signup">Começar minha jornada</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 md:grid-cols-3">
          {[
            { icon: Shield, title: "Aprovação manual", text: "Cada perfil é revisado individualmente por nossa equipe antes de aparecer publicamente." },
            { icon: Heart, title: "Conexões intencionais", text: "Demonstre interesse e converse apenas quando o sentimento for recíproco." },
            { icon: Users, title: "Comunidade na fé", text: "Pessoas comprometidas com Cristo, sua igreja e um relacionamento sério." },
          ].map((f, i) => (
            <div key={i} className="glass animate-fade-up rounded-2xl p-6 shadow-soft" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold)]">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 text-center">
          <p className="font-serif text-2xl italic leading-relaxed text-foreground/80 md:text-3xl">
            "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito."
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[var(--gold)]">Colossenses 3:14</p>
        </section>
      </main>
    </div>
  );
}
