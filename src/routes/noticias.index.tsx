import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markSeen } from "@/lib/lastSeen";
import { Header } from "@/components/layout/Header";
import { Newspaper, BookHeart, ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Post = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id: string;
  kind: "news" | "devotional";
};

export const Route = createFileRoute("/noticias/")({ component: Noticias });

function Noticias() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"news" | "devotional">("news");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("daily_posts")
        .select("id, title, content, published_at, author_id, kind")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) { toast.error(error.message); return; }
      setPosts((data ?? []) as Post[]);
    };
    load();
    markSeen(user.id, "news");
    const ch = supabase
      .channel("daily-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_posts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const filtered = posts.filter((p) => p.kind === tab);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="animate-fade-up flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            {tab === "news" ? <Newspaper className="h-5 w-5 text-white" /> : <BookHeart className="h-5 w-5 text-white" />}
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Publicações</h1>
            <p className="text-sm text-muted-foreground">Notícias da comunidade e devocionais diários</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "news" | "devotional")} className="mt-8">
          <TabsList>
            <TabsTrigger value="news"><Newspaper className="mr-1.5 h-4 w-4" /> Feed</TabsTrigger>
            <TabsTrigger value="devotional"><BookHeart className="mr-1.5 h-4 w-4" /> Devocional</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6 space-y-5">
            {filtered.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center text-muted-foreground shadow-soft">
                {tab === "news" ? "Nenhuma notícia publicada ainda." : "Nenhum devocional publicado ainda."}
              </div>
            ) : (
              filtered.map((p) => (
                <article
                  key={p.id}
                  className={`animate-fade-up block rounded-3xl p-6 shadow-soft transition-shadow hover:shadow-elegant sm:p-7 ${
                    p.kind === "devotional"
                      ? "border border-[var(--rose)]/20 bg-[var(--petal)]/40"
                      : "glass"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        p.kind === "devotional"
                          ? "bg-[var(--rose)] text-white"
                          : "bg-foreground/10 text-foreground/70"
                      }`}
                    >
                      {p.kind === "devotional" ? <BookHeart className="h-3 w-3" /> : <Newspaper className="h-3 w-3" />}
                      {p.kind === "devotional" ? "Devocional" : "Notícia"}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {new Date(p.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h2
                    className={`mt-3 line-clamp-2 font-semibold ${
                      p.kind === "devotional" ? "text-xl italic" : "text-xl"
                    }`}
                  >
                    {p.title}
                  </h2>
                  <p
                    className={`mt-2 line-clamp-3 leading-relaxed text-foreground/75 ${
                      p.kind === "devotional" ? "text-[14px] font-serif italic" : "text-[14px]"
                    }`}
                  >
                    {p.content}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--rose)]">
                    Ler artigo completo <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}