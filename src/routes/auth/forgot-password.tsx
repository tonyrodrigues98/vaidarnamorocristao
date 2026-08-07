import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/shells/AuthShell";
import { AuthPage } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth/forgot-password")({ component: Forgot });

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Email enviado, verifique sua caixa.");
  }

  return (
    <AuthShell>
      <AuthPage
        backTo="/auth/login"
        eyebrow="RECUPERAR ACESSO"
        title="Vamos te trazer de volta."
        description="Envie seu email e você receberá um link seguro para criar uma nova senha."
      >
        {sent ? (
          <p className="orha-auth-success">
            Verifique sua caixa de entrada e siga o link recebido.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="orha-auth-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="orha-auth-primary" size="lg" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth/login" className="orha-auth-link">
            Voltar para login
          </Link>
        </p>
      </AuthPage>
    </AuthShell>
  );
}
