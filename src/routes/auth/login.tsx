import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { AuthShell } from "@/components/shells/AuthShell";
import { AuthPage } from "@/components/auth/AuthPage";
import { useAuth } from "@/lib/auth";
import { readSafeReturnTo } from "@/lib/safeRedirect";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(1, "Informe sua senha").max(72),
});

export const Route = createFileRoute("/auth/login")({ component: Login });

function Login() {
  const { user, loading: authLoading, signInWithPassword } = useAuth();
  const returnTo =
    typeof window === "undefined" ? "/inicio" : readSafeReturnTo(window.location.search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("Email ou senha incorretos");
      return;
    }
    toast.success("Bem-vindo(a) de volta!");
  }

  if (!authLoading && user) return <Navigate to={returnTo} replace />;

  return (
    <AuthShell>
      <AuthPage
        eyebrow="QUE BOM VER VOCÊ"
        title="Que bom te ver por aqui."
        description="Entre para continuar suas conexões, conversas e momentos na ORHA."
        footer={
          <p>
            Ainda não faz parte?{" "}
            <Link to="/auth/signup" className="orha-auth-link">
              Criar conta
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="/auth/forgot-password" className="orha-auth-utility">
                Esqueci a senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="orha-auth-primary" size="lg" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <SocialAuthButtons mode="login" />
      </AuthPage>
    </AuthShell>
  );
}
