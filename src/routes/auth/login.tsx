import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { AuthShell } from "@/components/shells/AuthShell";
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
      <main className="mx-auto flex w-full max-w-md flex-col px-1 py-4 sm:px-4 sm:py-12">
        <div className="glass animate-fade-up rounded-3xl p-5 shadow-elegant sm:p-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre para continuar sua jornada.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-[var(--rose)] hover:underline"
                >
                  Esqueci a senha
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <SocialAuthButtons mode="login" />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Novo por aqui?{" "}
            <Link to="/auth/signup" className="font-medium text-[var(--rose)] hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </AuthShell>
  );
}
