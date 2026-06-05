import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My App — Início" },
      { name: "description", content: "Base inicial do projeto, pronta para evoluir." },
      { property: "og:title", content: "My App — Início" },
      { property: "og:description", content: "Base inicial do projeto, pronta para evoluir." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Bem-vindo ao My App
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        Esta é a base inicial do seu projeto. Comece editando as páginas em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/routes</code>.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/about"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Saiba mais
        </Link>
      </div>
    </section>
  );
}
