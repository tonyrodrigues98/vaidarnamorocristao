import { CheckCircle2, Download, Share, Smartphone, SquarePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { cn } from "@/lib/utils";

type InstallAppButtonProps = {
  className?: string;
  compact?: boolean;
};

const iosSteps = [
  {
    title: "Abra no Safari",
    description: "Use o Safari para instalar o VaiDarNamoro no iPhone.",
    icon: Smartphone,
  },
  {
    title: "Toque em Compartilhar",
    description: "No rodape do Safari, toque no botao de compartilhamento.",
    icon: Share,
  },
  {
    title: "Adicionar a Tela de Inicio",
    description: "Procure a opcao na lista de acoes e toque nela.",
    icon: SquarePlus,
  },
  {
    title: "Confirme em Adicionar",
    description: "Depois, abra o app pelo icone criado na tela inicial.",
    icon: CheckCircle2,
  },
];

export function InstallAppButton({ className, compact = false }: InstallAppButtonProps) {
  const { canPromptInstall, install, isInstallAvailable, isIos, isStandalone } = usePwaInstall();
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  if (isStandalone || !isInstallAvailable) {
    return null;
  }

  const handleClick = async () => {
    if (isIos) {
      setIosGuideOpen(true);
      return;
    }

    if (!canPromptInstall) {
      return;
    }

    try {
      const result = await install();

      if (result?.outcome === "accepted") {
        toast.success("Instalacao iniciada");
      }
    } catch {
      toast.error("Nao foi possivel abrir a instalacao agora");
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        className={cn(
          "h-11 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black text-white shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur transition hover:bg-white/16 focus-visible:ring-white/40 sm:px-5 sm:text-sm",
          className,
        )}
      >
        <Download className="mr-2 h-4 w-4" />
        {compact ? (
          <>
            <span className="sm:hidden">Instalar</span>
            <span className="hidden sm:inline">
              {isIos ? "Instalar no iPhone" : "Instalar VaiDarNamoro"}
            </span>
          </>
        ) : (
          <span>{isIos ? "Instalar no iPhone" : "Instalar VaiDarNamoro"}</span>
        )}
      </Button>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent className="max-w-md overflow-hidden rounded-3xl border-white/10 bg-[#111113] p-0 text-white shadow-2xl">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,79,104,0.24),transparent_18rem)]" />
          <div className="p-6 sm:p-7">
            <DialogHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff4f68] text-white shadow-[0_16px_40px_rgba(255,79,104,0.3)]">
                <Smartphone className="h-6 w-6" />
              </div>
              <DialogTitle className="text-left text-2xl font-black text-white">
                Instalar no iPhone
              </DialogTitle>
              <DialogDescription className="text-left text-sm leading-6 text-white/68">
                O iOS nao permite abrir esse menu automaticamente. Siga os passos abaixo no Safari.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-3">
              {iosSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/62">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
