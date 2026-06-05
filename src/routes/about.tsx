import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Sobre — My App" },
      { name: "description", content: "Sobre o projeto e seus objetivos." },
      { property: "og:title", content: "Sobre — My App" },
      { property: "og:description", content: "Sobre o projeto e seus objetivos." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Sobre
      </h1>
      <p className="mt-4 text-base text-muted-foreground">
        Este é um esqueleto limpo construído com React, TypeScript, Vite, Tailwind
        e TanStack Router. Adicione novas páginas em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/routes</code>{" "}
        e componentes reutilizáveis em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/components</code>.
      </p>
    </section>
  );
}
