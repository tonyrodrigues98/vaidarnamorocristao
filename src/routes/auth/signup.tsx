import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";

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
    if (!acceptedTerms) { toast.error("Você precisa aceitar os Termos e Condições."); return; }
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const uid = signUpData.user?.id;
    if (uid) {
      await supabase.from("terms_acceptances").insert({ user_id: uid, version: CURRENT_TERMS_VERSION });
    }
    toast.success("Conta criada! Vamos montar seu perfil.");
    navigate({ to: "/onboarding/etapa-1" });
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="glass animate-fade-up rounded-3xl p-8 shadow-elegant">
          <h1 className="text-3xl font-semibold">Criar conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comece sua jornada em poucos passos.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-border bg-card/40 p-3 text-sm">
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
            <Button type="submit" className="w-full" size="lg" disabled={loading || !acceptedTerms}>
              {loading ? "Criando..." : "Criar minha conta"}
            </Button>
          </form>
          {acceptedTerms ? (
            <SocialAuthButtons mode="signup" />
          ) : (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Aceite os Termos para liberar o login com Google ou Apple.
            </p>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/auth/login" className="font-medium text-[var(--rose)] hover:underline">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
