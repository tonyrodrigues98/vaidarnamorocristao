import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type Warning = {
  id: string;
  message: string;
  severity: string;
  acknowledged_at: string | null;
  created_at: string;
};

/**
 * Banner exibido no topo da página de perfil quando o usuário tem
 * avisos administrativos não reconhecidos. Severidade `severe` usa
 * destaque vermelho; `amber` usa âmbar.
 */
export function AdminWarningBanner() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("user_admin_warnings")
        .select("id, message, severity, acknowledged_at, created_at")
        .eq("user_id", user.id)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false });
      if (!alive) return;
      setWarnings((data ?? []) as Warning[]);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function acknowledge(id: string) {
    await supabase
      .from("user_admin_warnings")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }

  if (warnings.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {warnings.map((w) => {
        const severe = w.severity === "severe";
        const Icon = severe ? ShieldAlert : AlertTriangle;
        return (
          <div
            key={w.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-soft ${
              severe
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            }`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">
                {severe ? "Aviso importante da equipe" : "Aviso da equipe"}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{w.message}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => acknowledge(w.id)}
              className="shrink-0"
            >
              <Check className="mr-1 h-4 w-4" /> Entendi
            </Button>
          </div>
        );
      })}
    </div>
  );
}
