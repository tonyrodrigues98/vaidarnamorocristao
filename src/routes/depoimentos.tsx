import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell } from "@/components/shells/PublicShell";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/depoimentos")({
  component: DepoimentosPage,
  head: () => ({
    meta: [
      { title: `Histórias da comunidade — ${brand.displayName}` },
      {
        name: "description",
        content:
          "Saiba como histórias verificadas da comunidade poderão ser compartilhadas com consentimento.",
      },
      { property: "og:title", content: `Histórias da comunidade — ${brand.displayName}` },
      {
        property: "og:description",
        content:
          "Histórias verificadas serão publicadas somente com autorização das pessoas envolvidas.",
      },
      { property: "og:url", content: `${brand.origin}/depoimentos` },
    ],
    links: [{ rel: "canonical", href: `${brand.origin}/depoimentos` }],
  }),
});

function DepoimentosPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--rose)]">
          Histórias da comunidade
        </p>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
          Relatos reais exigem verificação e consentimento
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Ainda não publicamos depoimentos pessoais nesta página. Quando uma história for
          verificada, ela só será exibida com autorização expressa das pessoas envolvidas.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--rose)] px-7 font-semibold text-white"
          >
            Participar da comunidade
          </Link>
          <Link
            to="/suporte"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-7 font-semibold"
          >
            Enviar sua história ao suporte
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}
