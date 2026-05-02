import { createFileRoute, Link, Navigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookHeart, Newspaper } from "lucide-react";

type Post = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id: string;
  kind: "news" | "devotional";
};

export const Route = createFileRoute("/noticias/")({ component: NoticiaDetail });

function NoticiaDetail() {
  const { id } = useParams({ from: "/noticias/$id" });
  const { user, loading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("daily_posts")
        .select("id, title, content, published_at, author_id, kind")
        .eq("id", id)
        .eq("published", true)
        .maybeSingle();
      if (error) { toast.error(error.message); return; }
      if (!data) { setNotFound(true); return; }
      setPost(data as Post);
    })();
  }, [id, user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/noticias"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>

        {notFound ? (
          <div className="glass rounded-3xl p-10 text-center text-muted-foreground shadow-soft">
            Publicação não encontrada.
          </div>
        ) : !post ? (
          <div className="glass h-64 animate-pulse rounded-3xl" />
        ) : (
          <article
            className={`animate-fade-up rounded-3xl p-6 shadow-soft sm:p-8 ${
              post.kind === "devotional"
                ? "border border-[var(--rose)]/20 bg-[var(--petal)]/40"
                : "glass"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  post.kind === "devotional"
                    ? "bg-[var(--rose)] text-white"
                    : "bg-foreground/10 text-foreground/70"
                }`}
              >
                {post.kind === "devotional" ? <BookHeart className="h-3 w-3" /> : <Newspaper className="h-3 w-3" />}
                {post.kind === "devotional" ? "Devocional" : "Notícia"}
              </span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
            <h1 className={`mt-3 font-semibold ${post.kind === "devotional" ? "text-3xl italic" : "text-3xl"}`}>
              {post.title}
            </h1>
            <div
              className={`mt-4 whitespace-pre-wrap leading-relaxed text-foreground/85 ${
                post.kind === "devotional" ? "text-[16px] font-serif italic" : "text-[16px]"
              }`}
            >
              {post.content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
