import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { BLOG_POSTS, getPostBySlug } from "@/data/blog-posts";
import { Clock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Artigo não encontrado" }] };
    const { post } = loaderData;
    const url = `https://vaidarnamoro.com/blog/${post.slug}`;
    return {
      meta: [
        { title: `${post.title} | Blog VaiDarNamoro` },
        { name: "description", content: post.description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: post.publishedAt },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt ?? post.publishedAt,
            author: { "@type": "Organization", name: "VaiDarNamoro" },
            publisher: {
              "@type": "Organization",
              name: "VaiDarNamoro",
              logo: { "@type": "ImageObject", url: "https://vaidarnamoro.com/og-image.jpg" },
            },
            mainEntityOfPage: url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Artigo não encontrado</h1>
        <Link to="/blog" className="mt-6 inline-block text-[var(--rose)] underline">Voltar ao blog</Link>
      </div>
    </div>
  ),
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[var(--rose)]">
          <ArrowLeft className="h-4 w-4" /> Voltar ao blog
        </Link>

        <header className="mt-8">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </time>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingMinutes} min de leitura</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
        </header>

        <article
          className="prose prose-lg mt-12 max-w-none [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-foreground/85 [&_em]:text-[var(--rose)]"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <section className="mt-16 rounded-3xl bg-gradient-warm p-8 text-center md:p-12">
          <h2 className="text-2xl font-extrabold tracking-tight">Pronto para viver o que você leu?</h2>
          <p className="mt-3 text-muted-foreground">Crie seu perfil e conheça cristãos sérios em busca do mesmo.</p>
          <Link
            to="/auth/signup"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--rose)] px-7 font-semibold text-white shadow-glow hover:opacity-90"
          >
            Criar conta gratuita
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight">Continue lendo</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elegant"
                >
                  <h3 className="font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
