import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { AuthShell } from "@/components/shells/AuthShell";
import { AuthPage } from "@/components/auth/AuthPage";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export const Route = createFileRoute("/auth/signup")({ component: Signup });

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os Termos e Condições.");
      return;
    }
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const uid = signUpData.user?.id;
    if (uid) {
      await supabase
        .from("terms_acceptances")
        .insert({ user_id: uid, version: CURRENT_TERMS_VERSION });
    }
    toast.success("Conta criada! Vamos montar seu perfil.");
    navigate({ to: "/onboarding" });
  }

  return (
    <AuthShell>
      <AuthPage
        backTo="/auth/login"
        eyebrow="BEM-VINDO À ORHA"
        title="Comece do seu jeito."
        description="Crie a sua conta em poucos segundos. Depois, montamos seu perfil juntos."
        footer={
          <p>
            Já tem uma conta?{" "}
            <Link to="/auth/login" className="orha-auth-link">
              Entrar
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="orha-auth-form">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Crie uma senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>
          <label className="orha-auth-terms">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--rose)]"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span className="text-foreground/85">
              Li e concordo com os{" "}
              <Link to="/termos" className="font-medium text-[var(--rose)] hover:underline">
                Termos e Condições
              </Link>{" "}
              da comunidade.
            </span>
          </label>
          <Button
            type="submit"
            className="orha-auth-primary"
            size="lg"
            disabled={loading || !acceptedTerms}
          >
            {loading ? "Criando..." : "Criar minha conta"}
          </Button>
        </form>
        {acceptedTerms ? (
          <SocialAuthButtons mode="signup" />
        ) : (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Aceite os Termos para liberar o acesso com Google.
          </p>
        )}
      </AuthPage>
    </AuthShell>
  );
}
