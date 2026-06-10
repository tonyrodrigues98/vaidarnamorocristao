import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "install-banner-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function isDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number.parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Banner discreto que sugere instalar o PWA. Some quando o app já está
 * em modo standalone, quando o usuário fecha (lembrado por 7 dias) ou em
 * rotas sensíveis (auth, onboarding, instalar). Em Android dispara o
 * `beforeinstallprompt` direto; em iOS abre a página /instalar.
 */
export function InstallPromptBanner() {
  const { canPromptInstall, install, isInstallAvailable, isIos, isStandalone } = usePwaInstall();
  const [hidden, setHidden] = useState(true);
  const pathname = useLocation({ select: (s) => s.pathname });

  useEffect(() => {
    setHidden(isDismissed());
  }, []);

  if (isStandalone || !isInstallAvailable || hidden) return null;

  // Rotas onde o banner atrapalha.
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/instalar") ||
    pathname.startsWith("/conversas/")
  ) {
    return null;
  }

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setHidden(true);
  };

  const handleInstall = async () => {
    if (isIos || !canPromptInstall) return; // Link cuida do iOS
    try {
      const result = await install();
      if (result?.outcome === "accepted") {
        toast.success("App instalando…");
        setHidden(true);
      }
    } catch {
      toast.error("Não foi possível abrir a instalação agora.");
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 px-3 md:hidden",
        "bottom-[calc(var(--mobile-bottom-nav-height,88px)+env(safe-area-inset-bottom,0px)+8px)]",
      )}
      role="region"
      aria-label="Instalar app"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--rose,#ff4f68)]/10 text-[var(--rose,#ff4f68)]">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-foreground">
            Instale o VaiDarNamoro
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Abre como app, sem barra do navegador.
          </p>
        </div>
        {isIos ? (
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full bg-[var(--rose,#ff4f68)] px-3 text-xs font-bold text-white hover:bg-[var(--rose,#ff4f68)]/90"
          >
            <Link to="/instalar">Instalar</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleInstall}
            disabled={!canPromptInstall}
            className="h-8 rounded-full bg-[var(--rose,#ff4f68)] px-3 text-xs font-bold text-white hover:bg-[var(--rose,#ff4f68)]/90"
          >
            Instalar
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}