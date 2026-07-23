import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { BLOG_POSTS } from "@/data/blog-posts";
import { Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "Blog Vai Dar Namoro — Fé, comunidade e relacionamentos" },
      {
        name: "description",
        content:
          "Artigos sobre fé, comunidade, convivência, namoro cristão, casamento e propósito.",
      },
      { property: "og:title", content: "Blog VaiDarNamoro" },
      {
        property: "og:description",
        content: "Artigos sobre fé, comunidade, convivência e relacionamentos com propósito.",
      },
      { property: "og:url", content: "https://vaidarnamoro.com/blog" },
    ],
    links: [{ rel: "canonical", href: "https://vaidarnamoro.com/blog" }],
  }),
});

function BlogIndex() {
  const sorted = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Blog <span className="text-gradient">VaiDarNamoro</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Conteúdo sobre fé, comunidade, convivência, namoro e propósito para diferentes momentos
            da caminhada.
          </p>
        </header>

        <section className="mt-16 space-y-6">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="block rounded-3xl border border-border bg-card p-7 shadow-soft transition hover:shadow-elegant"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {post.readingMinutes} min
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{post.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {post.description}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--rose)]">
                Ler artigo <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
