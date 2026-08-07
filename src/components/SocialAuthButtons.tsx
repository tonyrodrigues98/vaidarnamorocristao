import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

/**
 * Botões de login social (Google e Apple).
 * Após o redirect, o usuário volta autenticado. Em src/routes/__root.tsx
 * (ou no fluxo pós-login) verificamos se ele já tem perfil e enviamos
 * para /onboarding se não tiver.
 */
export function SocialAuthButtons({
  mode = "login",
  providers = ["google", "apple"],
}: {
  mode?: "login" | "signup";
  providers?: Array<"google" | "apple">;
}) {
  const [loading, setLoading] = useState<null | "google" | "apple">(null);

  async function handle(provider: "google" | "apple") {
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/inicio",
      });
      if (result.error) {
        toast.error("Não foi possível entrar. Tente novamente.");
        setLoading(null);
        return;
      }
      // Se result.redirected: o navegador irá redirecionar; nada mais a fazer.
    } catch {
      toast.error("Erro inesperado no login social.");
      setLoading(null);
    }
  }

  const label = mode === "signup" ? "Continuar" : "Entrar";

  return (
    <div className="space-y-3">
      <div className="relative my-2 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-xs uppercase tracking-wide text-muted-foreground">ou</span>
        <div className="flex-1 border-t border-border" />
      </div>
      {providers.includes("google") ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center gap-2 bg-white text-gray-800 hover:bg-gray-50 border-gray-300"
          disabled={loading !== null}
          onClick={() => handle("google")}
        >
          <GoogleIcon />
          {loading === "google" ? "Conectando..." : `${label} com Google`}
        </Button>
      ) : null}
      {providers.includes("apple") ? (
        <Button
          type="button"
          size="lg"
          className="w-full justify-center gap-2 bg-black text-white hover:bg-black/90"
          disabled={loading !== null}
          onClick={() => handle("apple")}
        >
          <AppleIcon />
          {loading === "apple" ? "Conectando..." : `${label} com Apple`}
        </Button>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.92v2.32A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.92A9 9 0 0 0 0 9c0 1.45.35 2.83.92 4.04l3.05-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .92 4.96l3.05 2.32C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.43 2.13-1.18 2.93-.81.86-1.83 1.36-2.78 1.31-.13-1.07.39-2.16 1.13-2.97.81-.9 2.05-1.51 2.83-1.27zM20.5 17.05c-.36.83-.55 1.21-1.02 1.95-.66 1.04-1.6 2.34-2.76 2.35-1.03.01-1.3-.67-2.7-.66-1.4.01-1.7.67-2.73.66-1.16-.01-2.04-1.18-2.7-2.22-1.85-2.91-2.05-6.34-.91-8.16.81-1.29 2.09-2.05 3.29-2.05 1.22 0 1.99.67 3 .67 1 0 1.6-.67 3.02-.67 1.07 0 2.21.59 3.02 1.6-2.66 1.46-2.22 5.27.49 6.53z" />
    </svg>
  );
}
