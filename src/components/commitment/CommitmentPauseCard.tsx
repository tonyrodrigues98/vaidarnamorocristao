import { Link } from "@tanstack/react-router";
import { ArrowRight, Gem, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type CommitmentPauseCardProps = {
  matchId: string;
  description?: string;
  className?: string;
};

export function CommitmentPauseCard({
  matchId,
  description = "Você está em um propósito ativo. Por isso, esta área fica pausada enquanto esse compromisso estiver firmado.",
  className = "",
}: CommitmentPauseCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-8 text-center shadow-soft backdrop-blur dark:border-emerald-800/40 dark:from-emerald-950/30 dark:via-background dark:to-rose-950/20 sm:p-12 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent dark:via-emerald-700/60" />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/15 to-rose-500/15 ring-1 ring-emerald-300/50 dark:ring-emerald-700/50">
        <Gem className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          <Lock className="h-3.5 w-3.5" />
          Área pausada com cuidado
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Propósito Firmado
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="rounded-2xl shadow-glow">
          <Link to="/proposito/$matchId" params={{ matchId }}>
            Ver Página do Casal
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          Tudo volta ao normal quando o propósito for interrompido.
        </span>
      </div>
    </section>
  );
}
