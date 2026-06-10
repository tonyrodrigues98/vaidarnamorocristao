import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { AccountDangerZone } from "@/components/AccountDangerZone";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — VaiDarNamoro" },
      { name: "description", content: "Gerencie sua conta: desativar ou excluir." },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <MobileAppHeader title="Conta" subtitle="Segurança e preferências" />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <Link
          to="/perfil"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar ao perfil
        </Link>
        <h1 className="text-3xl font-semibold">Minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie a desativação ou exclusão da sua conta.
        </p>
        <div className="mt-8">
          <AccountDangerZone />
        </div>
      </main>
    </div>
  );
}
