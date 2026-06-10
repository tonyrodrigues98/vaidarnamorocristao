import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markSeen } from "@/lib/lastSeen";
import { Header } from "@/components/layout/Header";
import { ArrowRight, Newspaper } from "lucide-react";
import { AppEmptyState } from "@/components/ui/AppEmptyState";

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
  const latestPost = posts[0] ?? null;
  const olderPosts = posts.slice(1);

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
    <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:py-10">
        <div className="animate-fade-up flex items-center gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur sm:rounded-3xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Notícias</h1>
            <p className="text-sm text-muted-foreground">Notícias e atualizações da comunidade</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {posts.length === 0 ? (
            <AppEmptyState
              icon={<Newspaper className="h-6 w-6" />}
              title="Nenhuma notícia por enquanto"
              description="As novidades da comunidade aparecerão aqui quando forem publicadas."
            />
          ) : (
            <>
              {latestPost && (
                <article className="glass animate-fade-up overflow-hidden rounded-[2rem] border border-[var(--rose)]/20 shadow-soft">
                  <div className="bg-gradient-to-br from-[var(--rose)]/16 via-card to-card p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        <Newspaper className="h-3 w-3" />
                        Última notícia
                      </span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {new Date(latestPost.published_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
                      {latestPost.title}
                    </h2>
                    <p
                      className={`mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/75 ${
                        expanded[latestPost.id] ? "" : "line-clamp-5"
                      }`}
                    >
                      {latestPost.content}
                    </p>
                    {latestPost.content && latestPost.content.length > 260 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((state) => ({
                            ...state,
                            [latestPost.id]: !state[latestPost.id],
                          }))
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                      >
                        {expanded[latestPost.id] ? "Ler menos" : "Ler notícia"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </article>
              )}

              <section className="rounded-[1.75rem] border border-border/70 bg-card/75 p-4 shadow-soft backdrop-blur sm:rounded-3xl sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Arquivo
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Notícias anteriores
                  </h2>
                </div>
                <div className="mt-5 space-y-3">
                  {olderPosts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Ainda não há notícias anteriores.
                    </div>
                  ) : (
                    olderPosts.map((post) => (
                      <article
                        key={post.id}
                        className="rounded-2xl border border-border/70 bg-background/85 p-4 transition hover:border-[var(--rose)]/30 hover:shadow-soft"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                            <Newspaper className="h-3 w-3" />
                            Notícia
                          </span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {new Date(post.published_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-lg font-semibold">{post.title}</h3>
                        <p
                          className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/70 ${
                            expanded[post.id] ? "" : "line-clamp-3"
                          }`}
                        >
                          {post.content}
                        </p>
                        {post.content && post.content.length > 180 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((state) => ({ ...state, [post.id]: !state[post.id] }))
                            }
                            className="mt-3 text-sm font-semibold text-primary hover:underline"
                          >
                            {expanded[post.id] ? "Ler menos" : "Ler mais"}
                          </button>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
