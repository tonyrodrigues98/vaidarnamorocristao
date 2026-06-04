import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import { toast } from "sonner";

/**
 * Shows a blocking modal for authenticated users who have not accepted
 * the current Terms version. Pressing "Aceito" records the acceptance.
 */
export function TermsGate() {
  const { user, loading } = useAuth();
  // Optimistic default: assume the user MAY need to accept until we confirm
  // otherwise. This closes the race window where RLS would otherwise reject
  // an action ("new row violates row-level security policy") before this
  // gate has a chance to render.
  const [needsAccept, setNeedsAccept] = useState(true);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setNeedsAccept(false);
      setChecked(true);
      return;
    }
    setChecked(false);
    let ignore = false;
    (async () => {
      // Server-side check: returns current_version + accepted flag + accepted_at
      const { data, error } = await supabase.rpc("get_my_terms_status");
      if (ignore) return;
      if (error) {
        setNeedsAccept(true);
        setChecked(true);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      setNeedsAccept(!row?.accepted);
      setChecked(true);
    })();
    return () => {
      ignore = true;
    };
  }, [user, loading]);

  if (!user || !needsAccept) return null;

  async function accept() {
    if (!user) return;
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("terms_acceptances")
      .insert({ user_id: user.id, version: CURRENT_TERMS_VERSION });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível registrar o aceite.");
      return;
    }
    toast.success("Aceite registrado. Obrigado!");
    setNeedsAccept(false);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
    >
      <div className="glass max-w-lg rounded-3xl p-6 md:p-8 shadow-elegant">
        <h2 id="terms-gate-title" className="text-2xl font-bold text-gradient">
          {checked ? "Atualizamos nossos Termos" : "Verificando seus Termos…"}
        </h2>
        <p className="mt-3 text-foreground/85">
          Para continuar usando a plataforma, você precisa revisar e aceitar nossos{" "}
          <Link to="/termos" className="font-medium text-[var(--rose)] hover:underline">
            Termos e Condições
          </Link>{" "}
          atualizados. Eles definem regras de conduta, requisitos para uso e diretrizes da
          comunidade cristã.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Versão atual: <span className="font-mono">{CURRENT_TERMS_VERSION}</span>
        </p>
        <label
          htmlFor="terms-gate-accept"
          className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-4 transition active:scale-[0.99]"
        >
          <input
            id="terms-gate-accept"
            type="checkbox"
            className="mt-1 h-5 w-5 flex-shrink-0 accent-[var(--rose)]"
            disabled={submitting || !checked}
            onChange={(e) => {
              if (e.target.checked) accept();
            }}
          />
          <span className="text-sm text-foreground/90">
            Li e concordo com os{" "}
            <Link to="/termos" className="font-medium text-[var(--rose)] underline">
              Termos e Condições
            </Link>
            .{" "}
            {submitting ? (
              <span className="text-muted-foreground">Registrando…</span>
            ) : !checked ? (
              <span className="text-muted-foreground">Carregando…</span>
            ) : null}
          </span>
        </label>
      </div>
    </div>
  );
}
