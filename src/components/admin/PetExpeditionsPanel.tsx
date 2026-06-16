import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Compass,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  ImageOff,
} from "lucide-react";

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
import {
  createExpedition,
  deleteExpedition,
  listExpeditionsAdmin,
  updateExpedition,
} from "@/lib/petExpeditions";
import {
  DIFFICULTY_DEFAULTS,
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  type ExpeditionDifficulty,
  type PetExpedition,
  type PetExpeditionWritable,
} from "@/types/petExpedition";
import { slugify } from "@/lib/petCatalog";
import { cn } from "@/lib/utils";
import { uploadExpeditionImage, useSignedExpeditionUrl } from "@/lib/expeditionImageUrl";

type Draft = PetExpeditionWritable & { id?: string };

function emptyDraft(): Draft {
  const d = DIFFICULTY_DEFAULTS.easy;
  return {
    slug: "",
    title: "",
    description: null,
    icon: "Compass",
    image_url: null,
    difficulty: "easy",
    item_reward_label: null,
    active: true,
    sort_order: 0,
    ...d,
  };
}

function intOr(v: string, fallback: number): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function PetExpeditionsPanel() {
  const [rows, setRows] = useState<PetExpedition[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      setRows(await listExpeditionsAdmin());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error("Título obrigatório");
    setBusy(true);
    try {
      const payload: PetExpeditionWritable = {
        ...draft,
        title: draft.title.trim(),
        slug: draft.slug.trim() || slugify(draft.title),
        description: draft.description?.trim() || null,
        icon: draft.icon.trim() || "Compass",
        item_reward_label: draft.item_reward_label?.trim() || null,
      };
      if (draft.id) await updateExpedition(draft.id, payload);
      else await createExpedition(payload);
      toast.success("Salvo");
      setDraft(null);
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta expedição?")) return;
    try {
      await deleteExpedition(id);
      toast.success("Excluída");
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Expedições de pet</h2>
          <p className="text-xs text-muted-foreground">
            Locais que aparecem no card de expedições em /meu-pet. 3 são sorteadas por dia.
          </p>
        </div>
        <Button onClick={() => setDraft(emptyDraft())} size="sm" className="rounded-full">
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {loading ? (
        <div className="grid h-32 place-items-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma expedição cadastrada ainda.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-muted-foreground" />
                  <span className="font-medium">{row.title}</span>
                </div>
                {!row.active && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">inativo</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium ring-1",
                    DIFFICULTY_TONE[row.difficulty],
                  )}
                >
                  {DIFFICULTY_LABEL[row.difficulty]}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {formatDuration(row.duration_minutes)}
                </span>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-800">
                  -{row.energy_cost} energia
                </span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800">
                  +{row.xp_reward} XP
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                  +{row.coin_reward} moedas
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  lvl ≥ {row.min_user_level}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  sucesso {row.success_rate}% / crit {row.crit_rate}%
                </span>
              </div>
              {row.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{row.description}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDraft({ ...row })}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void remove(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{draft?.id ? "Editar expedição" : "Nova expedição"}</DialogTitle>
          {draft && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        title: e.target.value,
                        slug: draft.slug || slugify(e.target.value),
                      })
                    }
                    placeholder="Caverna de Tundra"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Ícone (lucide)</Label>
                  <Input
                    value={draft.icon}
                    onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                    placeholder="Mountain"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Imagem</Label>
                  <ImageUploader
                    value={draft.image_url}
                    slugHint={draft.slug || slugify(draft.title)}
                    onChange={(path) => setDraft({ ...draft, image_url: path })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ordem</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={draft.sort_order}
                    onChange={(e) =>
                      setDraft({ ...draft, sort_order: intOr(e.target.value, 0) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Dificuldade</Label>
                <Select
                  value={draft.difficulty}
                  onValueChange={(v) => {
                    const diff = v as ExpeditionDifficulty;
                    setDraft({ ...draft, difficulty: diff, ...DIFFICULTY_DEFAULTS[diff] });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DIFFICULTY_LABEL) as ExpeditionDifficulty[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {DIFFICULTY_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Alterar a dificuldade preenche valores padrão — você pode ajustar abaixo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <NumField
                  label="Duração (min)"
                  value={draft.duration_minutes}
                  onChange={(n) => setDraft({ ...draft, duration_minutes: n })}
                />
                <NumField
                  label="Custo energia"
                  value={draft.energy_cost}
                  onChange={(n) => setDraft({ ...draft, energy_cost: n })}
                />
                <NumField
                  label="Nível mín."
                  value={draft.min_user_level}
                  onChange={(n) => setDraft({ ...draft, min_user_level: n })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <NumField
                  label="XP base"
                  value={draft.xp_reward}
                  onChange={(n) => setDraft({ ...draft, xp_reward: n })}
                />
                <NumField
                  label="Moedas base"
                  value={draft.coin_reward}
                  onChange={(n) => setDraft({ ...draft, coin_reward: n })}
                />
                <div className="space-y-1.5">
                  <Label>Item (rótulo)</Label>
                  <Input
                    value={draft.item_reward_label ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, item_reward_label: e.target.value || null })
                    }
                    placeholder="Cristal de gelo"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <NumField
                  label="Taxa sucesso (%)"
                  value={draft.success_rate}
                  onChange={(n) => setDraft({ ...draft, success_rate: n })}
                />
                <NumField
                  label="Chance crítico (%)"
                  value={draft.crit_rate}
                  onChange={(n) => setDraft({ ...draft, crit_rate: n })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.active}
                  onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                />
                <Label className="m-0">Ativa</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
                  Cancelar
                </Button>
                <Button onClick={() => void save()} disabled={busy}>
                  {busy && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                  <Sparkles className="mr-1 size-3.5" />
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(intOr(e.target.value, 0))}
      />
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}