import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shows a friendly nudge when the user's profile is incomplete.
 * Score is based on key fields from `profiles` and `profile_advanced`.
 */
export function ProfileCompletenessAlert() {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase
          .from("profiles")
          .select("photo_url, bio, height_cm, status")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_advanced")
          .select(
            "life_verse, testimony, seeking, essential_quality, hobbies, love_language, wants_marriage, wants_children",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (cancel) return;
      if (!p || p.status !== "approved") {
        setScore(null);
        return;
      }
      const checks: { key: string; label: string; ok: boolean }[] = [
        { key: "photo", label: "Foto de perfil", ok: !!p.photo_url },
        { key: "bio", label: "Sua bio", ok: !!(p.bio && p.bio.trim().length >= 30) },
        { key: "height", label: "Altura", ok: !!p.height_cm },
        { key: "life_verse", label: "Versículo favorito", ok: !!a?.life_verse },
        { key: "testimony", label: "Seu testemunho", ok: !!a?.testimony },
        { key: "seeking", label: "O que você busca", ok: !!a?.seeking },
        { key: "essential_quality", label: "Qualidade essencial", ok: !!a?.essential_quality },
        { key: "hobbies", label: "Hobbies", ok: !!a?.hobbies },
        { key: "love_language", label: "Linguagem do amor", ok: !!a?.love_language },
        { key: "wants_marriage", label: "Visão de casamento", ok: !!a?.wants_marriage },
        { key: "wants_children", label: "Visão sobre filhos", ok: !!a?.wants_children },
      ];
      const done = checks.filter((c) => c.ok).length;
      const pct = Math.round((done / checks.length) * 100);
      setScore(pct);
      setMissing(checks.filter((c) => !c.ok).map((c) => c.label));
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  if (score === null || score >= 90) return null;

  const isLow = score < 60;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        isLow
          ? "border-[color:var(--coral)]/30 bg-[color:var(--coral)]/5"
          : "border-[color:var(--rose)]/30 bg-[color:var(--rose)]/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isLow
              ? "bg-[color:var(--coral)]/15 text-[color:var(--coral)]"
              : "bg-[color:var(--rose)]/15 text-[color:var(--rose)]"
          }`}
        >
          {isLow ? <AlertTriangle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold sm:text-base">
              {isLow
                ? "Seu perfil está sendo pouco exibido"
                : "Complete seu perfil para aumentar suas chances"}
            </h3>
            <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {score}% completo
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Perfis completos recebem até 5x mais interesses. Faltam:{" "}
            {missing.slice(0, 3).join(", ")}
            {missing.length > 3 ? ` e mais ${missing.length - 3}…` : "."}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70">
            <div
              className={`h-full transition-all ${isLow ? "bg-[color:var(--coral)]" : "bg-[color:var(--rose)]"}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="mt-3">
            <Button asChild size="sm">
              <Link to="/perfil">Completar perfil</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
