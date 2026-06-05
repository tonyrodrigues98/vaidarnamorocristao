import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markSeen } from "@/lib/lastSeen";
import { Header } from "@/components/layout/Header";
import { Newspaper } from "lucide-react";

type Post = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id: string;
};

export const Route = createFileRoute("/noticias/")({
  component: Noticias,
  head: () => ({
    meta: [
      { title: "Notícias — VaiDarNamoro" },
      {
        name: "description",
        content:
          "Notícias e atualizações da comunidade VaiDarNamoro: novidades, eventos e avisos importantes.",
      },
      { property: "og:title", content: "Notícias — VaiDarNamoro" },
      {
        property: "og:description",
        content: "Notícias e atualizações da comunidade VaiDarNamoro.",
      },
      { property: "og:url", content: "https://vaidarnamoro.com/noticias" },
    ],
  }),
});

function Noticias() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("daily_posts")
        .select("id, title, content, published_at, author_id")
        .eq("kind", "news")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) {
        toast.error(error.message);
        return;
      }
      setPosts((data ?? []) as Post[]);
    };
    load();
    markSeen(user.id, "news");
    const ch = supabase
      .channel("daily-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_posts" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
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
            <h1 className="text-3xl font-semibold">Notícias</h1>
            <p className="text-sm text-muted-foreground">Notícias e atualizações da comunidade</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {posts.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground shadow-soft">
              Nenhuma notícia publicada ainda.
            </div>
          ) : (
            posts.map((p) => (
              <article
                key={p.id}
                className="glass animate-fade-up block rounded-3xl p-6 shadow-soft transition-shadow hover:shadow-elegant sm:p-7"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    <Newspaper className="h-3 w-3" />
                    Notícia
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {new Date(p.published_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-xl font-semibold">{p.title}</h2>
                <p
                  className={`mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/75 ${expanded[p.id] ? "" : "line-clamp-3"}`}
                >
                  {p.content}
                </p>
                {p.content && p.content.length > 180 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => ({ ...s, [p.id]: !s[p.id] }))}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    {expanded[p.id] ? "Ler menos" : "Ler mais"}
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
