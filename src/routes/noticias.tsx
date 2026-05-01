import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Newspaper } from "lucide-react";

type Post = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id: string;
};

export const Route = createFileRoute("/noticias")({ component: Noticias });

function Noticias() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("daily_posts")
        .select("id, title, content, published_at, author_id")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) { toast.error(error.message); return; }
      setPosts((data ?? []) as Post[]);
    };
    load();
    const ch = supabase
      .channel("daily-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_posts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="animate-fade-up flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Notícias & Texto Diário</h1>
            <p className="text-sm text-muted-foreground">Reflexões, avisos e novidades da comunidade</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {posts.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground shadow-soft">
              Nenhuma publicação ainda.
            </div>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="glass animate-fade-up rounded-3xl p-6 shadow-soft sm:p-8">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {new Date(p.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <h2 className="mt-2 text-2xl font-semibold">{p.title}</h2>
                <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85">
                  {p.content}
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}