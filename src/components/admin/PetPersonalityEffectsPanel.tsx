import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Save,
  Smile,
  Sun,
  Moon,
  CloudSun,
  Trash2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAll } from "@/lib/petCatalog";
import type { PetPersonality } from "@/types/petCatalog";
import { cn } from "@/lib/utils";

// ─── tipos ────────────────────────────────────────────────────────────────────

const KINDS = ["all", "feed", "play", "hygiene", "sleep", "affection", "energy"] as const;
type Kind = (typeof KINDS)[number];
const KIND_LABEL: Record<Kind, string> = {
  all: "Todas as barras",
  feed: "Fome",
  play: "Humor",
  hygiene: "Higiene",
  sleep: "Sono",
  affection: "Carência",
  energy: "Energia",
};

const DAYPARTS = ["any", "day", "night"] as const;
type Daypart = (typeof DAYPARTS)[number];
const DAYPART_LABEL: Record<Daypart, string> = {
  any: "Sempre",
  day: "Apenas de dia",
  night: "Apenas de noite",
};
const DAYPART_ICON: Record<Daypart, typeof Sun> = {
  any: CloudSun,
  day: Sun,
  night: Moon,
};

const COND_OPS = ["gte", "lte", "gt", "lt", "eq"] as const;
type CondOp = (typeof COND_OPS)[number];
const COND_OP_LABEL: Record<CondOp, string> = {
  gte: "≥",
  lte: "≤",
  gt: ">",
  lt: "<",
  eq: "=",
};

type EffectRow = {
  id: string;
  personality_id: string;
  kind: Kind;
  restore_mult: number;
  energy_cost_mult: number;
  decay_mult: number;
  cap_max: number | null;
  daypart: Daypart;
  condition_kind: Kind | null;
  condition_op: CondOp | null;
  condition_value: number | null;
  note: string | null;
  active: boolean;
  sort_order: number;
};

type Draft = Omit<EffectRow, "id"> & { id?: string };

function emptyDraft(personality_id: string): Draft {
  return {
    personality_id,
    kind: "all",
    restore_mult: 1,
    energy_cost_mult: 1,
    decay_mult: 1,
    cap_max: null,
    daypart: "any",
    condition_kind: null,
    condition_op: null,
    condition_value: null,
    note: "",
    active: true,
    sort_order: 0,
  };
}

// ─── helpers numéricos (text + inputMode, regra do projeto) ───────────────────

function NumberField({
  value,
  onChange,
  step = 0.05,
  placeholder,
  decimal = true,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  placeholder?: string;
  decimal?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => {
    setText(value === null ? "" : String(value));
  }, [value]);
  return (
    <Input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      placeholder={placeholder}
      className={cn("h-9", className)}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        if (raw === "") {
          setText("");
          onChange(null);
          return;
        }
        const re = decimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
        if (!re.test(raw)) return;
        setText(raw);
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onBlur={() => {
        if (text === "" || text === "-" || text === ".") {
          setText(value === null ? "" : String(value));
        }
      }}
    />
  );
}

function multBadge(v: number, kind: "restore" | "decay" | "energy") {
  if (Math.abs(v - 1) < 0.001) return null;
  const pct = Math.round((v - 1) * 100);
  const positive = kind === "decay" ? pct < 0 : pct > 0;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

// ─── painel ───────────────────────────────────────────────────────────────────

export function PetPersonalityEffectsPanel() {
  const [personalities, setPersonalities] = useState<PetPersonality[]>([]);
  const [rows, setRows] = useState<EffectRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [pers, eff] = await Promise.all([
        listAll<PetPersonality>("pet_personalities"),
        supabase
          .from("pet_personality_effects" as never)
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);
      setPersonalities(pers);
      if (eff.error) throw eff.error;
      setRows((eff.data ?? []) as unknown as EffectRow[]);
      if (!selected && pers.length) setSelected(pers[0].id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => r.personality_id === selected),
    [rows, selected],
  );

  async function save() {
    if (!draft) return;
    if (!draft.personality_id) return toast.error("Selecione a personalidade");
    setBusy(true);
    try {
      const payload = {
        personality_id: draft.personality_id,
        kind: draft.kind,
        restore_mult: draft.restore_mult,
        energy_cost_mult: draft.energy_cost_mult,
        decay_mult: draft.decay_mult,
        cap_max: draft.cap_max,
        daypart: draft.daypart,
        condition_kind: draft.condition_kind,
        condition_op: draft.condition_op,
        condition_value: draft.condition_value,
        note: draft.note?.trim() || null,
        active: draft.active,
        sort_order: draft.sort_order,
      };
      if (draft.id) {
        const { error } = await supabase
          .from("pet_personality_effects" as never)
          .update(payload as never)
          .eq("id", draft.id);
        if (error) throw error;
        toast.success("Regra atualizada");
      } else {
        const { error } = await supabase
          .from("pet_personality_effects" as never)
          .insert(payload as never);
        if (error) throw error;
        toast.success("Regra criada");
      }
      setDraft(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta regra?")) return;
    try {
      const { error } = await supabase
        .from("pet_personality_effects" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Regra excluída");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleActive(row: EffectRow) {
    try {
      const { error } = await supabase
        .from("pet_personality_effects" as never)
        .update({ active: !row.active } as never)
        .eq("id", row.id);
      if (error) throw error;
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Bônus de personalidade</h2>
          <p className="text-xs text-muted-foreground">
            Regras que aplicam multiplicadores às barras (restauro, decay, custo de energia) e
            limites máximos por personalidade.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => selected && setDraft(emptyDraft(selected))}
          disabled={!selected}
        >
          <Plus className="mr-1 h-4 w-4" /> Nova regra
        </Button>
      </div>

      {/* Seletor de personalidade */}
      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
          {personalities.map((p) => {
            const active = selected === p.id;
            const count = rows.filter((r) => r.personality_id === p.id).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground hover:ring-foreground/30",
                )}
              >
                <Smile className="h-4 w-4" />
                {p.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listagem */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/30 p-8 text-center">
          <Smile className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhuma regra para esta personalidade.</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Crie regras para definir como esta personalidade afeta as barras do pet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => {
            const DaypartIcon = DAYPART_ICON[r.daypart];
            return (
              <li
                key={r.id}
                className={cn(
                  "group rounded-2xl border bg-card/50 p-3 shadow-soft transition hover:bg-card/80",
                  !r.active && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {KIND_LABEL[r.kind]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    <DaypartIcon className="h-3 w-3" />
                    {DAYPART_LABEL[r.daypart]}
                  </span>
                  {multBadge(r.restore_mult, "restore") && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      Restauro
                      {multBadge(r.restore_mult, "restore")}
                    </span>
                  )}
                  {multBadge(r.decay_mult, "decay") && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      Decay
                      {multBadge(r.decay_mult, "decay")}
                    </span>
                  )}
                  {multBadge(r.energy_cost_mult, "energy") && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      Energia
                      {multBadge(r.energy_cost_mult, "energy")}
                    </span>
                  )}
                  {r.cap_max !== null && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Cap {r.cap_max}
                    </span>
                  )}
                  {r.condition_kind && r.condition_op && r.condition_value !== null && (
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      se {KIND_LABEL[r.condition_kind]} {COND_OP_LABEL[r.condition_op]}{" "}
                      {r.condition_value}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      title={r.active ? "Desativar" : "Ativar"}
                      onClick={() => void toggleActive(r)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {r.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => setDraft({ ...r })}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      onClick={() => void remove(r.id)}
                      className="rounded-full p-1.5 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {r.note && <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {/* Editor */}
      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{draft?.id ? "Editar regra" : "Nova regra"}</DialogTitle>
          {draft && (
            <div className="mt-2 space-y-4">
              {/* Personalidade + Barra + Período */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Personalidade</Label>
                  <Select
                    value={draft.personality_id}
                    onValueChange={(v) => setDraft({ ...draft, personality_id: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {personalities.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Barra alvo</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(v) => setDraft({ ...draft, kind: v as Kind })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Período do dia</Label>
                  <Select
                    value={draft.daypart}
                    onValueChange={(v) => setDraft({ ...draft, daypart: v as Daypart })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYPARTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {DAYPART_LABEL[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Multiplicadores */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Multiplicador de restauro (1.0 = neutro)</Label>
                  <NumberField
                    value={draft.restore_mult}
                    onChange={(v) => setDraft({ ...draft, restore_mult: v ?? 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Multiplicador de decay</Label>
                  <NumberField
                    value={draft.decay_mult}
                    onChange={(v) => setDraft({ ...draft, decay_mult: v ?? 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Custo de energia ×</Label>
                  <NumberField
                    value={draft.energy_cost_mult}
                    onChange={(v) => setDraft({ ...draft, energy_cost_mult: v ?? 1 })}
                  />
                </div>
              </div>

              {/* Cap + Sort */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cap máximo da barra (opcional)</Label>
                  <NumberField
                    value={draft.cap_max}
                    onChange={(v) => setDraft({ ...draft, cap_max: v })}
                    decimal={false}
                    placeholder="Sem limite"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Ordem</Label>
                  <NumberField
                    value={draft.sort_order}
                    onChange={(v) => setDraft({ ...draft, sort_order: v ?? 0 })}
                    decimal={false}
                  />
                </div>
              </div>

              {/* Condição opcional */}
              <div className="rounded-2xl border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Condição (opcional) — aplica a regra apenas se outra barra estiver em certo valor
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Select
                    value={draft.condition_kind ?? "__none"}
                    onValueChange={(v) =>
                      setDraft({
                        ...draft,
                        condition_kind: v === "__none" ? null : (v as Kind),
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Barra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sem condição</SelectItem>
                      {KINDS.filter((k) => k !== "all").map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draft.condition_op ?? "gte"}
                    onValueChange={(v) => setDraft({ ...draft, condition_op: v as CondOp })}
                    disabled={!draft.condition_kind}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COND_OPS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {COND_OP_LABEL[o]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <NumberField
                    value={draft.condition_value}
                    onChange={(v) => setDraft({ ...draft, condition_value: v })}
                    decimal={false}
                    placeholder="0–100"
                  />
                </div>
              </div>

              {/* Nota */}
              <div className="space-y-1">
                <Label className="text-xs">Nota (exibida ao jogador)</Label>
                <Textarea
                  rows={2}
                  value={draft.note ?? ""}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  placeholder="Ex.: Energia regenera mais rápido"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.active}
                    onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                  />
                  <Label className="text-xs">Ativa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                    <X className="mr-1 h-4 w-4" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={() => void save()} disabled={busy}>
                    {busy ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
