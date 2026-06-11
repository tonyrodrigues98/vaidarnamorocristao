import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markSeen } from "@/lib/lastSeen";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { ArrowRight, Newspaper, Calendar } from "lucide-react";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { OfflineState } from "@/components/ui/OfflineState";

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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { isOnline } = useNetworkStatus();
  const qc = useQueryClient();

  const queryKey = ["news-posts", user?.id] as const;
  const postsQuery = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnReconnect: true,
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("daily_posts")
        .select("id, title, content, published_at, author_id")
        .eq("kind", "news")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) {
        toast.error(error.message);
        throw error;
      }
      return (data ?? []) as Post[];
    },
  });

  const posts = postsQuery.data ?? [];
  const fetching = postsQuery.isLoading;
  const latestPost = posts[0] ?? null;
  const olderPosts = useMemo(() => posts.slice(1), [posts]);

  useEffect(() => {
    if (!user) return;
    markSeen(user.id, "news");
    const ch = supabase
      .channel("daily-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_posts" }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, qc]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
      <Header />
      <MobileAppHeader title="Notícias" subtitle="Novidades da comunidade" />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:py-10">
        {/* Desktop-only intro; mobile uses MobileAppHeader */}
        <div className="hidden sm:flex animate-fade-up items-center gap-3 rounded-3xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Notícias</h1>
            <p className="text-sm text-muted-foreground">Novidades da comunidade</p>
          </div>
        </div>

        <div className="space-y-5 sm:mt-6">
          {!isOnline && posts.length > 0 ? <StaleDataNotice /> : null}
          {fetching && posts.length === 0 ? (
            <NoticiasSkeleton />
          ) : !isOnline && posts.length === 0 ? (
            <OfflineState
              title="Notícias indisponíveis offline"
              description="Conecte-se para ver as últimas novidades da comunidade."
              actionLabel="Tentar novamente"
              onAction={() => postsQuery.refetch()}
              compact
            />
          ) : posts.length === 0 ? (
            <AppEmptyState
              icon={<Newspaper className="h-6 w-6" />}
              title="Nenhuma notícia por enquanto"
              description="As novidades da comunidade aparecerão aqui quando forem publicadas."
            />
          ) : (
            <>
              {latestPost && (
                <article className="app-card-interactive animate-fade-up overflow-hidden rounded-[2rem] border border-[var(--rose)]/25 shadow-soft">
                  {/* Editorial cover (no fake image — typographic gradient) */}
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[var(--rose)] via-[#f48ea0] to-amber-300 sm:h-44">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.45),transparent_55%)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/15 to-transparent" />
                    <Newspaper
                      aria-hidden
                      className="absolute right-4 top-4 h-7 w-7 text-white/75"
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--rose)] shadow-sm">
                      Em destaque
                    </span>
                  </div>
                  <div className="bg-card p-5 sm:p-7">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(latestPost.published_at)}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                      {latestPost.title}
                    </h2>
                    <p
                      className={`mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/75 ${
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
                        className="app-pressable mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                      >
                        {expanded[latestPost.id] ? "Ler menos" : "Ler agora"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </article>
              )}

              {olderPosts.length > 0 && (
                <section>
                  <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mais recentes
                  </h2>
                  <div className="space-y-2">
                    {olderPosts.map((post) => {
                      const isOpen = !!expanded[post.id];
                      return (
                        <article
                          key={post.id}
                          className="app-card-interactive rounded-2xl border border-border/70 bg-card/85 p-3.5 transition hover:border-[var(--rose)]/30"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--petal)]/60 text-[var(--rose)]">
                              <Newspaper className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.published_at)}
                              </div>
                              <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug">
                                {post.title}
                              </h3>
                              <p
                                className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/70 ${
                                  isOpen ? "" : "line-clamp-2"
                                }`}
                              >
                                {post.content}
                              </p>
                              {post.content && post.content.length > 140 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpanded((s) => ({ ...s, [post.id]: !s[post.id] }))
                                  }
                                  className="app-pressable mt-2 text-xs font-semibold text-[var(--rose)] hover:underline"
                                >
                                  {isOpen ? "Ler menos" : "Ler mais"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function NoticiasSkeleton() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
        <div className="h-36 animate-pulse bg-muted sm:h-44" />
        <div className="space-y-3 p-5 sm:p-7">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5"
          >
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
