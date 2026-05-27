import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Sparkles, Plus, Trophy } from "lucide-react";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";
import { getMyCoins } from "@/lib/coins";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

const EXTRA_COST = 10;

type Quota = {
  daily_free: number;
  daily_used: number;
  free_remaining: number;
  extras: number;
  total_remaining: number;
};

export function AnonymousExtrasCard() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: q, error: qe }, c] = await Promise.all([
      supabase.rpc("get_anonymous_quota"),
      getMyCoins().catch(() => ({ balance: 0 } as any)),
    ]);
    if (!qe && q && (q as any)[0]) setQuota((q as any)[0] as Quota);
    setCoins(c.balance ?? 0);
  }, []);

  useEffect(() => { load(); }, [load]);

  const insufficient = coins < EXTRA_COST;

  const buy = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("buy_anonymous_extra");
    setBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success("✨ Recado extra adicionado com sucesso");
    setOpen(false);
    await load();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--rose)]/20 bg-gradient-to-br from-[var(--rose)]/5 via-background to-background p-5 shadow-soft">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--rose)]/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--rose)]" />
            <h3 className="text-base font-semibold">Recados Extras</h3>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <CoinIcon className="h-3.5 w-3.5" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={coins}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {coins}
              </motion.span>
            </AnimatePresence>
            <span className="opacity-70">moedas</span>
          </div>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Gratuitos resetam diariamente. Extras comprados são permanentes até serem utilizados.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            label="Gratuitos hoje"
            value={quota ? `${quota.free_remaining}/${quota.daily_free}` : "—"}
            icon={<Mail className="h-3.5 w-3.5" />}
          />
          <Stat
            label="Extras"
            value={quota ? String(quota.extras) : "—"}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            highlight
          />
          <Stat
            label="Disponíveis"
            value={quota ? String(quota.total_remaining) : "—"}
            icon={<Plus className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Cada recado extra custa{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <CoinIcon className="h-3.5 w-3.5" /> {EXTRA_COST} moedas
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            disabled={insufficient}
            className="bg-[var(--rose)] text-white hover:bg-[var(--rose)]/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Comprar +1 recado extra
          </Button>
        </div>
        {insufficient && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs">
            <span className="text-amber-700 dark:text-amber-300">Você não possui moedas suficientes.</span>
            <Link to="/inicio" className="inline-flex items-center gap-1 font-medium text-[var(--rose)] hover:underline">
              <Trophy className="h-3.5 w-3.5" /> Ir para Conquistas
            </Link>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--rose)]" /> Comprar recado extra?
            </DialogTitle>
            <DialogDescription>
              Deseja utilizar <strong>{EXTRA_COST} moedas</strong> para adicionar +1 recado anônimo extra à sua conta?
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Os recados extras comprados são permanentes até serem utilizados.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              onClick={buy}
              disabled={busy || insufficient}
              className="bg-[var(--rose)] text-white hover:bg-[var(--rose)]/90"
            >
              {busy ? "Processando…" : "Confirmar compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-background/60 px-3 py-2 backdrop-blur ${
        highlight ? "border-[var(--rose)]/30" : "border-border"
      }`}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 4, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`mt-0.5 text-lg font-semibold ${highlight ? "text-[var(--rose)]" : ""}`}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}