import { PhotoImg } from "@/components/PhotoImg";
import { friendlyError } from "@/lib/errors";
import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { recomputeMyBadges } from "@/lib/recomputeBadges";
import { markHomeChecklistStep } from "@/lib/homeChecklist";
import {
  BookHeart,
  BookOpen,
  Heart,
  Sparkles,
  Hand,
  Share2,
  MessageCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Reply,
  Pin,
  PinOff,
  Flag,
  Flame,
  Trophy,
  Loader2,
  HandHeart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/devocional")({ component: Devocional });

type Post = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id: string;
  bible_reference: string | null;
  bible_text: string | null;
};
type ProfileLite = {
  id: string;
  full_name: string;
  photo_url: string | null;
  verified: boolean | null;
};
type Reaction = "heart" | "prayed" | "edify";
type ReactionRow = { post_id: string; user_id: string; reaction: Reaction };
type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  pinned_at: string | null;
};
type SortKey = "recent" | "commented" | "reactions";

const PAGE_SIZE = 8;

const REACTIONS: { key: Reaction; Icon: typeof Heart; label: string; activeClass: string }[] = [
  {
    key: "heart",
    Icon: Heart,
    label: "Tocou meu coração",
    activeClass: "text-rose-500 fill-rose-500",
  },
  {
    key: "prayed",
    Icon: Hand,
    label: "Orei hoje",
    activeClass: "text-amber-500 fill-amber-500/30",
  },
  {
    key: "edify",
    Icon: Sparkles,
    label: "Edificante",
    activeClass: "text-sky-500 fill-sky-500/30",
  },
];

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Devocional() {
  const { user, isAdmin, role, loading } = useAuth();
  const canModerate = isAdmin || role === "moderador";
  const [sort, setSort] = useState<SortKey>("recent");
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [prayedToday, setPrayedToday] = useState(false);
  const [streak, setStreak] = useState<{ current: number; best: number }>({ current: 0, best: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [commentCount, setCommentCount] = useState<Record<string, number>>({});
  const [reactionTotals, setReactionTotals] = useState<Record<string, number>>({});

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Record<string, Comment | null>>({});
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [reportFor, setReportFor] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadProfiles = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => id && !profiles[id]);
      if (!missing.length) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, verified")
        .in("id", missing);
      const map: Record<string, ProfileLite> = {};
      (data ?? []).forEach((p) => {
        map[p.id] = p as ProfileLite;
      });
      setProfiles((prev) => ({ ...prev, ...map }));
    },
    [profiles],
  );

  const loadPostsPage = useCallback(
    async (reset: boolean, sortKey: SortKey) => {
      if (loadingPosts) return;
      setLoadingPosts(true);
      const nextPage = reset ? 0 : page;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from("daily_posts")
        .select("id, title, content, published_at, author_id, bible_reference, bible_text")
        .eq("kind", "devotional")
        .eq("published", true)
        .range(from, to);

      if (sortKey === "recent") q = q.order("published_at", { ascending: false });
      else q = q.order("published_at", { ascending: false }); // server-side fallback; resort client-side

      const { data, error } = await q;
      if (error) {
        toast.error(friendlyError(error));
        setLoadingPosts(false);
        return;
      }
      const list = (data ?? []) as Post[];
      setPosts((prev) => (reset ? list : [...prev, ...list]));
      setHasMore(list.length === PAGE_SIZE);
      setPage(nextPage + 1);
      void loadProfiles(list.map((p) => p.author_id));
      setLoadingPosts(false);
    },
    [loadingPosts, page, loadProfiles],
  );

  const loadReactions = useCallback(async () => {
    const { data } = await supabase
      .from("devotional_reactions")
      .select("post_id, user_id, reaction");
    const list = (data ?? []) as ReactionRow[];
    setReactions(list);
    const totals: Record<string, number> = {};
    list.forEach((r) => {
      totals[r.post_id] = (totals[r.post_id] ?? 0) + 1;
    });
    setReactionTotals(totals);
  }, []);

  const loadPrayed = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("devotional_prayed")
      .select("id")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();
    setPrayedToday(!!data);
  }, [user]);

  const loadStreak = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_prayer_streak", { _user_id: user.id });
    const row = (data?.[0] ?? null) as { current_streak: number; best_streak: number } | null;
    setStreak({ current: row?.current_streak ?? 0, best: row?.best_streak ?? 0 });
  }, [user]);

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from("devotional_comments")
      .select("*")
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Comment[];
    setComments(list);
    const counts: Record<string, number> = {};
    list.forEach((c) => {
      if (!c.deleted_at) counts[c.post_id] = (counts[c.post_id] ?? 0) + 1;
    });
    setCommentCount(counts);
    void loadProfiles(list.map((c) => c.user_id));
  }, [loadProfiles]);

  const loadLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("devotional_comment_likes").select("comment_id, user_id");
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    (data ?? []).forEach((r: any) => {
      counts[r.comment_id] = (counts[r.comment_id] ?? 0) + 1;
      if (r.user_id === user.id) mine.add(r.comment_id);
    });
    setLikes(counts);
    setMyLikes(mine);
  }, [user]);

  // Initial load + realtime
  useEffect(() => {
    if (!user) return;
    markHomeChecklistStep(user.id, "devotional");
    void loadPostsPage(true, sort);
    void loadReactions();
    void loadPrayed();
    void loadStreak();
    void loadComments();
    void loadLikes();

    const ch = supabase
      .channel("devocional-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "devotional_reactions" }, () =>
        loadReactions(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "devotional_comments" }, () =>
        loadComments(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "devotional_comment_likes" },
        () => loadLikes(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "daily_posts" },
        (payload: any) => {
          const updated = payload.new as Post & { kind?: string; published?: boolean };
          if (updated.kind && updated.kind !== "devotional") return;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? {
                    ...p,
                    title: updated.title,
                    content: updated.content,
                    bible_reference: updated.bible_reference ?? null,
                    bible_text: updated.bible_text ?? null,
                  }
                : p,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reload posts on sort change
  useEffect(() => {
    if (!user) return;
    void loadPostsPage(true, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingPosts && hasMore) {
          void loadPostsPage(false, sort);
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingPosts, sort, loadPostsPage]);

  // Client-side sort
  const sortedPosts = useMemo(() => {
    if (sort === "recent") return posts;
    const arr = [...posts];
    if (sort === "commented") {
      arr.sort((a, b) => (commentCount[b.id] ?? 0) - (commentCount[a.id] ?? 0));
    } else if (sort === "reactions") {
      arr.sort((a, b) => (reactionTotals[b.id] ?? 0) - (reactionTotals[a.id] ?? 0));
    }
    return arr;
  }, [posts, sort, commentCount, reactionTotals]);

  const featuredPost = posts[0] ?? null;
  const archivePosts = featuredPost
    ? sortedPosts.filter((post) => post.id !== featuredPost.id)
    : sortedPosts;

  async function toggleReaction(postId: string, reaction: Reaction) {
    if (!user) return;
    const mine = reactions.find(
      (r) => r.post_id === postId && r.user_id === user.id && r.reaction === reaction,
    );
    // optimistic
    if (mine) {
      setReactions((prev) =>
        prev.filter(
          (r) => !(r.post_id === postId && r.user_id === user.id && r.reaction === reaction),
        ),
      );
      setReactionTotals((t) => ({ ...t, [postId]: Math.max(0, (t[postId] ?? 1) - 1) }));
      const { error } = await supabase
        .from("devotional_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("reaction", reaction);
      if (error) {
        toast.error(friendlyError(error));
        void loadReactions();
      }
    } else {
      setReactions((prev) => [...prev, { post_id: postId, user_id: user.id, reaction }]);
      setReactionTotals((t) => ({ ...t, [postId]: (t[postId] ?? 0) + 1 }));
      const { error } = await supabase
        .from("devotional_reactions")
        .insert({ post_id: postId, user_id: user.id, reaction });
      if (error) {
        toast.error(friendlyError(error));
        void loadReactions();
      }
      void recomputeMyBadges(user.id);
    }
  }

  async function prayToday(postId: string) {
    if (!user) return;
    if (prayedToday) {
      toast.info("Você já marcou que orou hoje");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("devotional_prayed")
      .insert({ user_id: user.id, post_id: postId, day: today });
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    setPrayedToday(true);
    toast.success("Marcado! Que Deus abençoe sua oração.");
    void loadStreak();
    void toggleReaction(postId, "prayed").catch(() => {});
    void recomputeMyBadges(user.id);
  }

  async function sharePost(p: Post) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/devocional#${p.id}` : "";
    const shareData = { title: p.title, text: p.content.slice(0, 140), url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(`${p.title}\n\n${p.content}\n\n${url}`);
      toast.success("Devocional copiado!");
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      toast.error("Não foi possível compartilhar");
    }
  }

  async function submitComment(e: FormEvent, postId: string) {
    e.preventDefault();
    if (!user) return;
    const text = (draft[postId] ?? "").trim();
    if (!text) return;
    const parent = replyTo[postId];
    const { data, error } = await supabase
      .from("devotional_comments")
      .insert({ post_id: postId, user_id: user.id, content: text, parent_id: parent?.id ?? null })
      .select("*")
      .single();
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    // optimistic append (also realtime will reconcile)
    if (data) {
      const c = data as Comment;
      setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      setCommentCount((cc) => ({ ...cc, [postId]: (cc[postId] ?? 0) + 1 }));
    }
    setDraft((d) => ({ ...d, [postId]: "" }));
    void recomputeMyBadges(user.id);
    setReplyTo((r) => ({ ...r, [postId]: null }));
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase
      .from("devotional_comments")
      .update({ content: editing.text })
      .eq("id", editing.id);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    setComments((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? { ...c, content: editing.text, edited_at: new Date().toISOString() }
          : c,
      ),
    );
    setEditing(null);
  }

  async function deleteComment(c: Comment) {
    if (!user) return;
    if (c.user_id === user.id) {
      const { error } = await supabase
        .from("devotional_comments")
        .update({ deleted_at: new Date().toISOString(), content: "[removido]" })
        .eq("id", c.id);
      if (!error)
        setComments((prev) =>
          prev.map((x) =>
            x.id === c.id
              ? { ...x, deleted_at: new Date().toISOString(), content: "[removido]" }
              : x,
          ),
        );
    } else if (canModerate || isAdmin) {
      const { error } = await supabase.from("devotional_comments").delete().eq("id", c.id);
      if (!error) setComments((prev) => prev.filter((x) => x.id !== c.id));
    }
  }

  async function togglePin(c: Comment) {
    const newPin = c.pinned_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from("devotional_comments")
      .update({ pinned_at: newPin })
      .eq("id", c.id);
    if (!error)
      setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, pinned_at: newPin } : x)));
  }

  async function toggleLike(c: Comment) {
    if (!user) return;
    const has = myLikes.has(c.id);
    // optimistic
    setMyLikes((prev) => {
      const n = new Set(prev);
      if (has) n.delete(c.id);
      else n.add(c.id);
      return n;
    });
    setLikes((prev) => ({ ...prev, [c.id]: Math.max(0, (prev[c.id] ?? 0) + (has ? -1 : 1)) }));
    if (has) {
      const { error } = await supabase
        .from("devotional_comment_likes")
        .delete()
        .eq("comment_id", c.id)
        .eq("user_id", user.id);
      if (error) {
        toast.error(friendlyError(error));
        void loadLikes();
      }
    } else {
      const { error } = await supabase
        .from("devotional_comment_likes")
        .insert({ comment_id: c.id, user_id: user.id });
      if (error) {
        toast.error(friendlyError(error));
        void loadLikes();
      }
    }
  }

  async function submitReport() {
    if (!user || !reportFor || !reportReason.trim()) return;
    const { error } = await supabase.from("devotional_comment_reports").insert({
      comment_id: reportFor.id,
      reporter_id: user.id,
      reason: reportReason.trim(),
    });
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Denúncia enviada. Obrigado!");
    setReportFor(null);
    setReportReason("");
  }

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const renderPostCard = (post: Post, featured = false) => (
    <PostCard
      key={post.id}
      post={post}
      author={profiles[post.author_id]}
      reactions={reactions.filter((reaction) => reaction.post_id === post.id)}
      myUserId={user!.id}
      prayedToday={prayedToday}
      commentsCount={commentCount[post.id] ?? 0}
      onReact={(reaction) => toggleReaction(post.id, reaction)}
      onPray={() => prayToday(post.id)}
      onShare={() => sharePost(post)}
      comments={comments.filter((comment) => comment.post_id === post.id)}
      profiles={profiles}
      likes={likes}
      myLikes={myLikes}
      onSubmitComment={(event) => submitComment(event, post.id)}
      draft={draft[post.id] ?? ""}
      onDraftChange={(value) => setDraft((current) => ({ ...current, [post.id]: value }))}
      replyTo={replyTo[post.id] ?? null}
      onSetReply={(comment) => setReplyTo((current) => ({ ...current, [post.id]: comment }))}
      editing={editing}
      onStartEdit={(comment) => setEditing({ id: comment.id, text: comment.content })}
      onCancelEdit={() => setEditing(null)}
      onSaveEdit={saveEdit}
      onChangeEdit={(value) =>
        setEditing((current) => (current ? { ...current, text: value } : current))
      }
      onDelete={deleteComment}
      onTogglePin={togglePin}
      onToggleLike={toggleLike}
      onReport={(comment) => setReportFor(comment)}
      canModerate={canModerate || isAdmin}
      featured={featured}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/25 via-background to-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:py-10">
        <header className="animate-fade-up rounded-[1.75rem] border border-[var(--rose)]/15 bg-card/85 p-5 shadow-soft backdrop-blur sm:flex sm:items-center sm:gap-4 sm:rounded-3xl sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <BookHeart className="h-5 w-5 text-white" />
          </div>
          <div className="mt-4 flex-1 sm:mt-0">
            <h1 className="text-3xl font-semibold tracking-tight">Devocional</h1>
            <p className="text-sm text-muted-foreground">
              Um momento diário para ler, orar e refletir com calma.
            </p>
          </div>
          <Link
            to="/oracoes"
            className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium transition hover:bg-accent sm:mt-0"
          >
            <HandHeart className="h-4 w-4" />
            <span className="hidden sm:inline">Pedidos de oração</span>
            <span className="sm:hidden">Orações</span>
          </Link>
        </header>

        <div className="animate-fade-up mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="Sequência"
            value={`${streak.current} ${streak.current === 1 ? "dia" : "dias"}`}
          />
          <StatCard
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            label="Recorde"
            value={`${streak.best}`}
          />
          <StatCard
            icon={<Hand className="h-4 w-4 text-[var(--rose)]" />}
            label="Hoje"
            value={prayedToday ? "Orei" : "Pendente"}
          />
        </div>

        <section className="mt-6 space-y-6">
          {sortedPosts.length === 0 && !loadingPosts ? (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground shadow-soft">
              Nenhum devocional publicado ainda.
            </div>
          ) : (
            <>
              {featuredPost && (
                <div>
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">
                      Devocional do dia
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">Leia com calma</h2>
                  </div>
                  {renderPostCard(featuredPost, true)}
                </div>
              )}

              <div className="rounded-[1.75rem] border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur sm:rounded-3xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Arquivo
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                      Devocionais antigos
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Releia mensagens anteriores sem transformar a página em feed.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip active={sort === "recent"} onClick={() => setSort("recent")}>
                      Recentes
                    </FilterChip>
                    <FilterChip active={sort === "commented"} onClick={() => setSort("commented")}>
                      Comentados
                    </FilterChip>
                    <FilterChip active={sort === "reactions"} onClick={() => setSort("reactions")}>
                      Reações
                    </FilterChip>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {archivePosts.length === 0 && !loadingPosts ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Ainda não há devocionais antigos.
                    </div>
                  ) : (
                    archivePosts.map((post) => renderPostCard(post))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Sentinel & loader */}
          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-6 text-sm text-muted-foreground"
          >
            {loadingPosts ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : !hasMore && sortedPosts.length > 0 ? (
              "Você chegou ao fim"
            ) : null}
          </div>
        </section>
      </main>

      <Dialog open={!!reportFor} onOpenChange={(o) => !o && setReportFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar comentário</DialogTitle>
            <DialogDescription>
              Conte-nos por que este comentário viola as diretrizes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Descreva o motivo..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportFor(null)}>
              Cancelar
            </Button>
            <Button onClick={submitReport} disabled={!reportReason.trim()}>
              Enviar denúncia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? "border-[var(--rose)] bg-[var(--rose)] text-white shadow-glow"
          : "border-border bg-card/60 text-foreground/70 hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3 shadow-soft">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

type PostCardProps = {
  post: Post;
  author?: ProfileLite;
  reactions: ReactionRow[];
  myUserId: string;
  prayedToday: boolean;
  commentsCount: number;
  onReact: (r: Reaction) => void;
  onPray: () => void;
  onShare: () => void;
  comments: Comment[];
  profiles: Record<string, ProfileLite>;
  likes: Record<string, number>;
  myLikes: Set<string>;
  onSubmitComment: (e: FormEvent) => void;
  draft: string;
  onDraftChange: (v: string) => void;
  replyTo: Comment | null;
  onSetReply: (c: Comment | null) => void;
  editing: { id: string; text: string } | null;
  onStartEdit: (c: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onChangeEdit: (v: string) => void;
  onDelete: (c: Comment) => void;
  onTogglePin: (c: Comment) => void;
  onToggleLike: (c: Comment) => void;
  onReport: (c: Comment) => void;
  canModerate: boolean;
  featured?: boolean;
};

function PostCard(props: PostCardProps) {
  const { post, author, reactions, myUserId, prayedToday, commentsCount, comments, featured } =
    props;
  const [open, setOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Reaction, number> = { heart: 0, prayed: 0, edify: 0 };
    reactions.forEach((r) => {
      c[r.reaction] = (c[r.reaction] ?? 0) + 1;
    });
    return c;
  }, [reactions]);
  const myReactions = useMemo(
    () => new Set(reactions.filter((r) => r.user_id === myUserId).map((r) => r.reaction)),
    [reactions, myUserId],
  );

  const topLevel = comments
    .filter((c) => !c.parent_id)
    .sort((a, b) => {
      if (!!b.pinned_at !== !!a.pinned_at) return b.pinned_at ? 1 : -1;
      return a.created_at.localeCompare(b.created_at);
    });
  const replies = (id: string) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <article
      id={post.id}
      className={`animate-fade-up rounded-3xl border border-[var(--rose)]/15 shadow-soft ${
        featured ? "bg-[var(--petal)]/40 p-5 sm:p-8" : "bg-background/85 p-4 sm:p-6"
      }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2.5 py-0.5 font-semibold uppercase tracking-wide text-white">
          <BookHeart className="h-3 w-3" /> Devocional
        </span>
        <span className="uppercase tracking-wide text-muted-foreground">
          {new Date(post.published_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <h2
        className={`mt-3 font-serif italic leading-tight ${
          featured ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"
        }`}
      >
        {post.title}
      </h2>
      {post.bible_reference && (
        <div className="mt-3 rounded-xl border-l-4 border-[var(--rose)] bg-[var(--petal)]/40 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
            <BookOpen className="h-3.5 w-3.5" /> {post.bible_reference}
          </div>
          {post.bible_text && (
            <p className="mt-1 font-serif text-sm italic leading-relaxed text-foreground/85">
              "{post.bible_text}"
            </p>
          )}
        </div>
      )}
      <p className="mt-3 whitespace-pre-wrap font-serif text-[15px] italic leading-relaxed text-foreground/85 sm:text-base">
        {post.content}
      </p>

      {author && (
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar profile={author} size={6} />
          <span className="flex items-center gap-1">
            {author.full_name}
            {author.verified && <VerifiedBadge size="sm" />}
          </span>
        </div>
      )}

      {/* Reactions */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {REACTIONS.map((r) => {
          const active = myReactions.has(r.key);
          const Icon = r.Icon;
          return (
            <button
              key={r.key}
              onClick={() => props.onReact(r.key)}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all hover-scale ${
                active
                  ? "border-[var(--rose)] bg-[var(--rose)]/10 text-foreground"
                  : "border-border bg-card/50 hover:bg-muted"
              }`}
              title={r.label}
              aria-label={r.label}
            >
              <Icon className={`h-4 w-4 ${active ? r.activeClass : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold tabular-nums">{counts[r.key]}</span>
            </button>
          );
        })}

        <Button
          size="sm"
          onClick={props.onPray}
          disabled={prayedToday}
          className={`ml-auto rounded-full ${prayedToday ? "bg-muted text-muted-foreground" : "bg-gradient-love text-white shadow-glow"}`}
        >
          <Hand className="mr-1.5 h-4 w-4" />
          {prayedToday ? "Orei hoje" : "Orei hoje"}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" /> {commentsCount}{" "}
          {commentsCount === 1 ? "comentário" : "comentários"}
        </button>
        <span aria-hidden className="opacity-40">
          •
        </span>
        <button
          onClick={props.onShare}
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      </div>

      {open && (
        <div className="mt-5 border-t border-border/50 pt-5 animate-fade-in">
          <CommentComposer
            value={props.draft}
            onChange={props.onDraftChange}
            onSubmit={props.onSubmitComment}
            replyTo={props.replyTo}
            onCancelReply={() => props.onSetReply(null)}
            replyAuthor={props.replyTo ? props.profiles[props.replyTo.user_id] : undefined}
          />

          <div className="mt-5 space-y-4">
            {topLevel.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Seja o primeiro a comentar
              </p>
            )}
            {topLevel.map((c) => (
              <CommentNode key={c.id} c={c} replies={replies(c.id)} {...props} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function Avatar({ profile, size = 8 }: { profile?: ProfileLite; size?: number }) {
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-love text-[10px] font-bold text-white"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {profile?.photo_url ? (
        <PhotoImg src={profile.photo_url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  replyTo,
  onCancelReply,
  replyAuthor,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  replyTo: Comment | null;
  onCancelReply: () => void;
  replyAuthor?: ProfileLite;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {replyTo && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <span>
            Respondendo a{" "}
            <strong className="text-foreground">{replyAuthor?.full_name ?? "usuário"}</strong>
          </span>
          <button type="button" onClick={onCancelReply} className="hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escreva um comentário edificante..."
        rows={2}
        maxLength={1000}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{value.length}/1000</span>
        <Button type="submit" size="sm" disabled={!value.trim()} className="rounded-full">
          Comentar
        </Button>
      </div>
    </form>
  );
}

function CommentNode({
  c,
  replies,
  profiles,
  myUserId,
  myLikes,
  likes,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeEdit,
  onDelete,
  onTogglePin,
  onToggleLike,
  onReport,
  onSetReply,
  canModerate,
}: PostCardProps & { c: Comment; replies: Comment[] }) {
  const author = profiles[c.user_id];
  const isMine = c.user_id === myUserId;
  const isEditing = editing?.id === c.id;

  return (
    <div className="animate-fade-in">
      <div className="flex gap-3">
        <Avatar profile={author} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-card/80 px-3 py-2 shadow-soft">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold">{author?.full_name ?? "Usuário"}</span>
              {author?.verified && <VerifiedBadge size="sm" />}
              {c.pinned_at && (
                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-[var(--rose)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--rose)]">
                  <Pin className="h-2.5 w-2.5" /> fixado
                </span>
              )}
              <span className="ml-auto text-muted-foreground">
                {relTime(c.created_at)}
                {c.edited_at && " · editado"}
              </span>
            </div>
            {isEditing ? (
              <div className="mt-1.5 space-y-1.5">
                <Textarea
                  value={editing!.text}
                  onChange={(e) => onChangeEdit(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" onClick={onSaveEdit}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={`mt-1 whitespace-pre-wrap break-words text-sm ${c.deleted_at ? "italic text-muted-foreground" : ""}`}
              >
                {c.content}
              </p>
            )}
          </div>

          {!c.deleted_at && !isEditing && (
            <div className="mt-1 flex items-center gap-3 px-2 text-xs text-muted-foreground">
              <button
                onClick={() => onToggleLike(c)}
                className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${myLikes.has(c.id) ? "text-rose-500" : ""}`}
              >
                <Heart className={`h-3.5 w-3.5 ${myLikes.has(c.id) ? "fill-rose-500" : ""}`} />
                {likes[c.id] ?? 0}
              </button>
              <button
                onClick={() => onSetReply(c)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Reply className="h-3.5 w-3.5" /> Responder
              </button>
              {isMine && (
                <>
                  <button
                    onClick={() => onStartEdit(c)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </>
              )}
              {!isMine && (
                <button
                  onClick={() => onReport(c)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Flag className="h-3.5 w-3.5" /> Denunciar
                </button>
              )}
              {canModerate && (
                <>
                  <button
                    onClick={() => onTogglePin(c)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {c.pinned_at ? (
                      <PinOff className="h-3.5 w-3.5" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                    {c.pinned_at ? "Desafixar" : "Fixar"}
                  </button>
                  {!isMine && (
                    <button
                      onClick={() => onDelete(c)}
                      className="inline-flex items-center gap-1 text-destructive hover:opacity-80"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-border/60 pl-3 sm:pl-4">
              {replies.map((r) => (
                <ReplyNode
                  key={r.id}
                  c={r}
                  profiles={profiles}
                  myUserId={myUserId}
                  myLikes={myLikes}
                  likes={likes}
                  editing={editing}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  onChangeEdit={onChangeEdit}
                  onDelete={onDelete}
                  onToggleLike={onToggleLike}
                  onReport={onReport}
                  canModerate={canModerate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyNode({
  c,
  profiles,
  myUserId,
  myLikes,
  likes,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeEdit,
  onDelete,
  onToggleLike,
  onReport,
  canModerate,
}: {
  c: Comment;
  profiles: Record<string, ProfileLite>;
  myUserId: string;
  myLikes: Set<string>;
  likes: Record<string, number>;
  editing: { id: string; text: string } | null;
  onStartEdit: (c: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onChangeEdit: (v: string) => void;
  onDelete: (c: Comment) => void;
  onToggleLike: (c: Comment) => void;
  onReport: (c: Comment) => void;
  canModerate: boolean;
}) {
  const author = profiles[c.user_id];
  const isMine = c.user_id === myUserId;
  const isEditing = editing?.id === c.id;
  return (
    <div className="flex gap-2">
      <Avatar profile={author} size={6} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-card/60 px-3 py-1.5 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold">{author?.full_name ?? "Usuário"}</span>
            {author?.verified && <VerifiedBadge size="sm" />}
            <span className="ml-auto text-muted-foreground">
              {relTime(c.created_at)}
              {c.edited_at && " · editado"}
            </span>
          </div>
          {isEditing ? (
            <div className="mt-1.5 space-y-1.5">
              <Textarea
                value={editing!.text}
                onChange={(e) => onChangeEdit(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={onSaveEdit}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={`mt-0.5 whitespace-pre-wrap break-words text-sm ${c.deleted_at ? "italic text-muted-foreground" : ""}`}
            >
              {c.content}
            </p>
          )}
        </div>
        {!c.deleted_at && !isEditing && (
          <div className="mt-1 flex items-center gap-3 px-2 text-xs text-muted-foreground">
            <button
              onClick={() => onToggleLike(c)}
              className={`inline-flex items-center gap-1 hover:text-foreground ${myLikes.has(c.id) ? "text-rose-500" : ""}`}
            >
              <Heart className={`h-3.5 w-3.5 ${myLikes.has(c.id) ? "fill-rose-500" : ""}`} />{" "}
              {likes[c.id] ?? 0}
            </button>
            {isMine && (
              <>
                <button
                  onClick={() => onStartEdit(c)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </>
            )}
            {!isMine && (
              <button
                onClick={() => onReport(c)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Flag className="h-3.5 w-3.5" /> Denunciar
              </button>
            )}
            {canModerate && !isMine && (
              <button
                onClick={() => onDelete(c)}
                className="inline-flex items-center gap-1 text-destructive hover:opacity-80"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
