import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Gamepad2, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminArcadeRounds,
  getAdminArcadeSignals,
  getPetArcadeConfig,
  updatePetArcadeConfig,
  type PetArcadeConfig,
} from "@/lib/petArcade";

export function PetArcadePanel() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PetArcadeConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const configQuery = useQuery({
    queryKey: ["pet-arcade", "admin", "config"],
    queryFn: getPetArcadeConfig,
  });
  const roundsQuery = useQuery({
    queryKey: ["pet-arcade", "admin", "rounds"],
    queryFn: () => getAdminArcadeRounds(100),
  });
  const signalsQuery = useQuery({
    queryKey: ["pet-arcade", "admin", "signals"],
    queryFn: getAdminArcadeSignals,
  });

  useEffect(() => {
    if (configQuery.data) setDraft(configQuery.data);
  }, [configQuery.data]);

  function update<K extends keyof PetArcadeConfig>(key: K, value: PetArcadeConfig[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await updatePetArcadeConfig({
        treasure_active: draft.treasure_active,
        flight_active: draft.flight_active,
        maintenance: draft.maintenance,
        min_entry: draft.min_entry,
        max_entry: draft.max_entry,
        daily_round_limit: draft.daily_round_limit,
        daily_reward_limit: draft.daily_reward_limit,
        max_multiplier: draft.max_multiplier,
        explanatory_text: draft.explanatory_text,
      });
      setDraft(saved);
      await queryClient.invalidateQueries({ queryKey: ["pet-arcade"] });
      toast.success("Configurações do Pet Arcade atualizadas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (configQuery.isLoading) {
    return (
      <div className="grid min-h-56 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (configQuery.isError || !draft) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        A migration do Pet Arcade precisa ser aplicada antes de usar este painel.
      </div>
    );
  }

  const rounds = roundsQuery.data ?? [];
  const signals = signalsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500 text-white">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Pet Arcade</h2>
            <p className="text-sm text-muted-foreground">
              Disponibilidade, economia e limites de proteção.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ToggleRow
            label="Campo de Tesouros"
            checked={draft.treasure_active}
            onCheckedChange={(value) => update("treasure_active", value)}
          />
          <ToggleRow
            label="Voo Estelar"
            checked={draft.flight_active}
            onCheckedChange={(value) => update("flight_active", value)}
          />
          <ToggleRow
            label="Modo manutenção"
            checked={draft.maintenance}
            onCheckedChange={(value) => update("maintenance", value)}
            warning
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <NumberField
            label="Entrada mínima"
            value={draft.min_entry}
            onChange={(value) => update("min_entry", value)}
          />
          <NumberField
            label="Entrada máxima"
            value={draft.max_entry}
            onChange={(value) => update("max_entry", value)}
          />
          <NumberField
            label="Rodadas por dia"
            value={draft.daily_round_limit}
            onChange={(value) => update("daily_round_limit", value)}
          />
          <NumberField
            label="Recompensa diária"
            value={draft.daily_reward_limit}
            onChange={(value) => update("daily_reward_limit", value)}
          />
          <NumberField
            label="Multiplicador máximo"
            value={Number(draft.max_multiplier)}
            step={0.1}
            onChange={(value) => update("max_multiplier", value)}
          />
        </div>

        <div className="mt-5">
          <Label htmlFor="arcade-copy">Texto explicativo</Label>
          <Textarea
            id="arcade-copy"
            value={draft.explanatory_text}
            onChange={(event) => update("explanatory_text", event.target.value)}
            className="mt-2 min-h-24 rounded-2xl"
          />
        </div>

        <Button onClick={() => void save()} disabled={saving} className="mt-5 h-11 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </Button>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Rodadas recentes</h3>
          </div>
          <div className="max-h-[440px] space-y-2 overflow-y-auto">
            {rounds.length === 0 ? (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Nenhuma rodada registrada.
              </p>
            ) : (
              rounds.slice(0, 50).map((round) => (
                <div
                  key={round.id}
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-border/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{round.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {round.game_type === "treasure" ? "Campo de Tesouros" : "Voo Estelar"} ·
                      entrada {round.entry_coins}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold">{Number(round.current_multiplier).toFixed(2)}x</p>
                    <p className="text-muted-foreground">{round.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold">Sinais para revisão</h3>
          </div>
          <div className="space-y-2">
            {signals.length === 0 ? (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Nenhum padrão fora do normal nos últimos 7 dias.
              </p>
            ) : (
              signals.map((signal) => (
                <div
                  key={signal.user_id}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                >
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {signal.user_id}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-600">
                    <span>{signal.rounds_7d} rodadas</span>
                    <span>{signal.total_entries} entradas</span>
                    <span>saldo líquido {signal.net_coins}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
  warning = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  warning?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 ${warning ? "border-amber-200 bg-amber-50/50" : "border-border"}`}
    >
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 rounded-xl"
      />
    </div>
  );
}
