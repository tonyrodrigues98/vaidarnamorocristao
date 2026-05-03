import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import { toast } from "sonner";

/**
 * Shows a blocking modal for authenticated users who have not accepted
 * the current Terms version. Pressing "Aceito" records the acceptance.
 */
export function TermsGate() {
  const { user, loading } = useAuth();
  const [needsAccept, setNeedsAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) { setNeedsAccept(false); return; }
    let ignore = false;
    (async () => {
      const { data } = await supabase
        .from("terms_acceptances")
        .select("id")
        .eq("user_id", user.id)
        .eq("version", CURRENT_TERMS_VERSION)
        .maybeSingle();
      if (!ignore) setNeedsAccept(!data);
    })();
    return () => { ignore = true; };
  }, [user, loading]);

  if (!user || !needsAccept) return null;

  async function accept() {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("terms_acceptances")
      .insert({ user_id: user.id, version: CURRENT_TERMS_VERSION });
    setSubmitting(false);
    if (error) { toast.error("Não foi possível registrar o aceite."); return; }
    toast.success("Aceite registrado. Obrigado!");
    setNeedsAccept(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass max-w-lg rounded-3xl p-6 md:p-8 shadow-elegant">
        <h2 className="text-2xl font-bold text-gradient">Atualizamos nossos Termos</h2>
        <p className="mt-3 text-foreground/85">
          Para continuar usando a plataforma, você precisa revisar e aceitar nossos{" "}
          <Link to="/termos" className="font-medium text-[var(--rose)] hover:underline">
            Termos e Condições
          </Link>{" "}
          atualizados. Eles definem regras de conduta, requisitos para uso e
          diretrizes da comunidade cristã.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Versão atual: <span className="font-mono">{CURRENT_TERMS_VERSION}</span>
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link to="/termos">Ler Termos</Link>
          </Button>
          <Button onClick={accept} disabled={submitting} className="bg-gradient-love">
            {submitting ? "Registrando..." : "Aceito"}
          </Button>
        </div>
      </div>
    </div>
  );
}