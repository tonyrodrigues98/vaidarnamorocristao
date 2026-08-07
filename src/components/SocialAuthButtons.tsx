import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

/**
 * Botão de login social com Google.
 * Após o redirect, o usuário volta autenticado. Em src/routes/__root.tsx
 * (ou no fluxo pós-login) verificamos se ele já tem perfil e enviamos
 * para /onboarding se não tiver.
 */
export function SocialAuthButtons({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/inicio",
      });
      if (result.error) {
        toast.error("Não foi possível entrar. Tente novamente.");
        setLoading(false);
        return;
      }
      // Se result.redirected: o navegador irá redirecionar; nada mais a fazer.
    } catch {
      toast.error("Erro inesperado no login social.");
      setLoading(false);
    }
  }

  const label = mode === "signup" ? "Continuar" : "Entrar";

  return (
    <div className="orha-social-auth">
      <div className="orha-social-auth__divider" aria-hidden="true">
        <span />
        <small>ou</small>
        <span />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="orha-social-auth__button"
        disabled={loading}
        onClick={handleGoogle}
      >
        <GoogleIcon />
        {loading ? "Conectando..." : `${label} com Google`}
      </Button>
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
