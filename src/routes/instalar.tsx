import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Apple, CheckCircle2, Download, Share, Smartphone, SquarePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { instalarMetadata } from "@/config/route-metadata";
import { PublicShell } from "@/components/shells/PublicShell";

export const Route = createFileRoute("/instalar")({
  component: InstallPage,
  head: () => instalarMetadata,
});

const iosSteps = [
  {
    title: "Abra esta página no Safari",
    description: "O Chrome e outros navegadores no iPhone não permitem instalar. Use o Safari.",
    icon: Smartphone,
  },
  {
    title: "Toque no botão Compartilhar",
    description: "Fica na barra inferior do Safari — é o quadradinho com seta pra cima.",
    icon: Share,
  },
  {
    title: "Escolha “Adicionar à Tela de Início”",
    description: "Role a lista de ações até encontrar a opção e toque nela.",
    icon: SquarePlus,
  },
  {
    title: "Confirme em “Adicionar”",
    description: "Pronto! Abra o app pelo ícone novo na tela inicial do iPhone.",
    icon: CheckCircle2,
  },
];

const androidSteps = [
  {
    title: "Toque em “Instalar app”",
    description:
      "Use o botão abaixo. Se não aparecer, abra o menu (⋮) do Chrome e escolha “Instalar app” ou “Adicionar à tela inicial”.",
    icon: Download,
  },
  {
    title: "Confirme a instalação",
    description: "O Chrome vai pedir confirmação. Toque em “Instalar”.",
    icon: CheckCircle2,
  },
  {
    title: "Abra pelo ícone novo",
    description: "Ele aparece na sua tela inicial e no menu de apps.",
    icon: Smartphone,
  },
];

function InstallPage() {
  const { canPromptInstall, install, isIos, isStandalone } = usePwaInstall();
  const [tab, setTab] = useState<string>(isIos ? "ios" : "android");

  const handleAndroidInstall = async () => {
    if (!canPromptInstall) {
      toast.info("Abra o menu do Chrome (⋮) e toque em “Instalar app”.");
      return;
    }
    try {
      const r = await install();
      if (r?.outcome === "accepted") toast.success("App instalando…");
    } catch {
      toast.error("Não foi possível abrir a instalação agora.");
    }
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rose,#ff4f68)] text-white shadow-lg">
            <Download className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            Tenha o VaiDarNamoro como app
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Ícone na tela inicial, abre em tela cheia sem barra do navegador, notificações em tempo
            real. Sem App Store, sem download de loja.
          </p>
        </header>

        {isStandalone ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
            <p className="font-bold">Você já está usando o app instalado.</p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/inicio">Ir para o início</Link>
            </Button>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="ios" className="rounded-full">
                <Apple className="mr-2 h-4 w-4" /> iPhone
              </TabsTrigger>
              <TabsTrigger value="android" className="rounded-full">
                <Smartphone className="mr-2 h-4 w-4" /> Android
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="mt-6 space-y-3">
              {iosSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--rose,#ff4f68)]/10 text-[var(--rose,#ff4f68)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {i + 1}. {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="android" className="mt-6 space-y-3">
              <Button
                size="lg"
                onClick={handleAndroidInstall}
                className="h-12 w-full rounded-full bg-[var(--rose,#ff4f68)] text-base font-bold text-white hover:bg-[var(--rose,#ff4f68)]/90"
              >
                <Download className="mr-2 h-5 w-5" />
                Instalar app agora
              </Button>
              {androidSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--rose,#ff4f68)]/10 text-[var(--rose,#ff4f68)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {i + 1}. {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Já instalou?{" "}
          <Link to="/inicio" className="font-semibold text-[var(--rose,#ff4f68)] hover:underline">
            Abra o app
          </Link>
          .
        </p>
      </div>
    </PublicShell>
  );
}
