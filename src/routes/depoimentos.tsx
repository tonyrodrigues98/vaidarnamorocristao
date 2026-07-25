import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { Quote } from "lucide-react";

const DEPOIMENTOS = [
  {
    casal: "Pedro & Mariana",
    cidade: "Belo Horizonte, MG",
    texto:
      "Nos conhecemos pelo VaiDarNamoro em 2025. O processo de aprovação nos deu confiança desde o primeiro dia. Hoje estamos noivos e planejando o casamento para o próximo ano.",
    rating: 5,
  },
  {
    casal: "Lucas & Beatriz",
    cidade: "Curitiba, PR",
    texto:
      "Eu já tinha desistido dos apps tradicionais. Aqui foi diferente — pessoas reais, com fé real. A Bia me chamou pra conversar sobre o devocional e nunca mais paramos de conversar.",
    rating: 5,
  },
  {
    casal: "Rafael & Juliana",
    cidade: "São Paulo, SP",
    texto:
      "Sou divorciado e tinha receio de me cadastrar. A equipe acolheu minha história e o ambiente foi muito respeitoso. Encontrei a Ju — também recomeçando — e descobrimos que Deus restaura.",
    rating: 5,
  },
  {
    casal: "Tiago & Camila",
    cidade: "Recife, PE",
    texto:
      "O que mais me marcou foi a seriedade. Cada conversa com propósito. A Cami foi a primeira pessoa com quem conversei aqui — e a única que precisou. 8 meses depois, casamos.",
    rating: 5,
  },
];

export const Route = createFileRoute("/depoimentos")({
  component: DepoimentosPage,
  head: () => ({
    meta: [
      { title: "Depoimentos — Casais que se conheceram no VaiDarNamoro" },
      {
        name: "description",
        content:
          "Histórias reais de casais cristãos que se conheceram no VaiDarNamoro. Inspire-se com testemunhos de namoro, noivado e casamento com propósito.",
      },
      { property: "og:title", content: "Casais que se conheceram no VaiDarNamoro" },
      {
        property: "og:description",
        content: "Histórias reais de relacionamentos cristãos sérios construídos na plataforma.",
      },
      { property: "og:url", content: "https://vaidarnamoro.com/depoimentos" },
    ],
    links: [{ rel: "canonical", href: "https://vaidarnamoro.com/depoimentos" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: DEPOIMENTOS.map((d, i) => ({
            "@type": "Review",
            position: i + 1,
            author: { "@type": "Person", name: d.casal },
            reviewBody: d.texto,
            reviewRating: { "@type": "Rating", ratingValue: d.rating, bestRating: 5 },
            itemReviewed: { "@type": "Organization", name: "VaiDarNamoro" },
          })),
        }),
      },
    ],
  }),
});

function DepoimentosPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Histórias que <span className="text-gradient">Deus escreveu</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Casais reais que se conheceram aqui e nos permitiram contar suas histórias.
          </p>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {DEPOIMENTOS.map((d, i) => (
            <article key={i} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <Quote className="h-8 w-8 text-[var(--rose)]/60" />
              <p className="mt-4 text-base leading-relaxed text-foreground/85">"{d.texto}"</p>
              <footer className="mt-6 border-t border-border pt-4">
                <p className="font-bold tracking-tight">{d.casal}</p>
                <p className="text-sm text-muted-foreground">{d.cidade}</p>
              </footer>
            </article>
          ))}
        </section>

        <section className="mt-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Sua história pode ser a próxima
          </h2>
          <Link
            to="/auth/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--rose)] px-8 font-semibold text-white shadow-glow hover:opacity-90"
          >
            Criar conta gratuita
          </Link>
        </section>
      </main>
    </div>
  );
}
