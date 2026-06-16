import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, Pencil, X, Gift, Percent } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createGrabPool, createGrabPrize, deleteGrabPool, deleteGrabPrize,
  getGrabConfig, listGrabPoolPrizes, listGrabPools, listPrizeCatalog,
  updateGrabConfig, updateGrabPool, updateGrabPrize,
  type PrizeCatalogItem,
} from "@/lib/petGrab";
import type { GrabConfig, GrabPool, GrabPoolPrize, GrabPrizeKind } from "@/types/petGrab";
import { GRAB_PRIZE_KIND_LABEL } from "@/types/petGrab";
import { cn } from "@/lib/utils";

const ALL_KINDS: GrabPrizeKind[] = ["care_item","pet_background","decoration","name_gradient","coins","xp"];

function toInt(v: string): number {
  const n = parseInt(v.replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function PetGrabPanel() {
  const [cfg, setCfg] = useState<GrabConfig | null>(null);
  const [cfgBusy, setCfgBusy] = useState(false);
  const [pools, setPools] = useState<GrabPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GrabPool | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getGrabConfig(), listGrabPools()]);
      setCfg(c);
      setPools(p);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);

  async function saveCfg() {
    if (!cfg) return;
    setCfgBusy(true);
    try {
      await updateGrabConfig({
        default_free_daily: cfg.default_free_daily,
        default_paid_cost_coins: cfg.default_paid_cost_coins,
      });
      toast.success("Configuração salva");
    } catch (e) { toast.error((e as Error).message); }
    finally { setCfgBusy(false); }
  }

  async function addPool() {
    try {
      const p = await createGrabPool({
        slug: `pool-${Date.now()}`, name: "Novo pool", description: null,
        active: false, sort_order: pools.length, cost_coins: null,
        free_daily_uses: null, weight: 1,
      });
      setPools((arr) => [...arr, p]);
      setEditing(p);
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      {/* Config global */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Configuração geral</h2>
        </div>
        {!cfg ? (
          <div className="grid place-items-center py-6"><Loader2 className="size-4 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Grátis por dia (padrão)</Label>
              <Input value={String(cfg.default_free_daily)} inputMode="numeric"
                onChange={(e) => setCfg({ ...cfg, default_free_daily: toInt(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Custo extra em moedas</Label>
              <Input value={String(cfg.default_paid_cost_coins)} inputMode="numeric"
                onChange={(e) => setCfg({ ...cfg, default_paid_cost_coins: toInt(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void saveCfg()} disabled={cfgBusy} className="w-full">
                {cfgBusy ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4 mr-1.5" />Salvar</>}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Pools */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Pools (caixas)</h2>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void addPool()}>
            <Plus className="size-4 mr-1" />Novo pool
          </Button>
        </div>
        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-4 animate-spin text-neutral-400" /></div>
        ) : pools.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
            Nenhum pool criado ainda.
          </p>
        ) : (
          <ul className="grid gap-2">
            {pools.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                <div className={cn("size-2 rounded-full", p.active ? "bg-emerald-500" : "bg-neutral-300")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-neutral-500">{p.slug}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600"
                  onClick={async () => {
                    if (!confirm(`Excluir pool "${p.name}"?`)) return;
                    try { await deleteGrabPool(p.id); await reload(); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <PoolEditorDialog
          pool={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { void reload(); }}
        />
      )}
    </div>
  );
}

/* ============================ POOL EDITOR ============================ */

function PoolEditorDialog({ pool, onClose, onSaved }: { pool: GrabPool; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<GrabPool>(pool);
  const [prizes, setPrizes] = useState<GrabPoolPrize[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listGrabPoolPrizes(pool.id)
      .then(setPrizes)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [pool.id]);

  const totalWeight = useMemo(
    () => prizes.filter((p) => p.active).reduce((s, p) => s + (p.weight || 0), 0),
    [prizes],
  );

  async function savePool() {
    setBusy(true);
    try {
      await updateGrabPool(pool.id, {
        slug: draft.slug || slugify(draft.name),
        name: draft.name,
        description: draft.description,
        active: draft.active,
        sort_order: draft.sort_order,
        cost_coins: draft.cost_coins,
        free_daily_uses: draft.free_daily_uses,
        weight: draft.weight,
      });
      toast.success("Pool salvo");
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function addPrize() {
    try {
      const p = await createGrabPrize({
        pool_id: pool.id, prize_kind: "care_item", prize_ref_id: null,
        prize_amount: 1, weight: 10, active: true, sort_order: prizes.length,
      });
      setPrizes((arr) => [...arr, p]);
    } catch (e) { toast.error((e as Error).message); }
  }

  async function patchPrize(id: string, patch: Partial<GrabPoolPrize>) {
    setPrizes((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try { await updateGrabPrize(id, patch); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function removePrize(id: string) {
    if (!confirm("Remover prêmio?")) return;
    try { await deleteGrabPrize(id); setPrizes((a) => a.filter((p) => p.id !== id)); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Gift className="size-5" /> Editar pool
        </DialogTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={2} value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value || null })} />
          </div>
          <div>
            <Label className="text-xs">Custo extra (override)</Label>
            <Input value={draft.cost_coins == null ? "" : String(draft.cost_coins)} inputMode="numeric"
              placeholder="padrão da config"
              onChange={(e) => setDraft({ ...draft, cost_coins: e.target.value === "" ? null : toInt(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Grátis/dia (override)</Label>
            <Input value={draft.free_daily_uses == null ? "" : String(draft.free_daily_uses)} inputMode="numeric"
              placeholder="padrão da config"
              onChange={(e) => setDraft({ ...draft, free_daily_uses: e.target.value === "" ? null : toInt(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Ordem</Label>
            <Input value={String(draft.sort_order)} inputMode="numeric"
              onChange={(e) => setDraft({ ...draft, sort_order: toInt(e.target.value) })} />
          </div>
          <div className="flex items-end gap-2">
            <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
            <Label className="text-xs">Ativo</Label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <h3 className="text-sm font-semibold">Prêmios</h3>
          <span className="text-[11px] text-neutral-500">Peso total ativo: {totalWeight}</span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void addPrize()}>
            <Plus className="size-4 mr-1" />Adicionar
          </Button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-6"><Loader2 className="size-4 animate-spin text-neutral-400" /></div>
        ) : prizes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
            Nenhum prêmio. O sorteio não funciona sem prêmios.
          </p>
        ) : (
          <ul className="space-y-2">
            {prizes.map((pr) => (
              <PrizeRow key={pr.id} prize={pr} totalWeight={totalWeight}
                onChange={(patch) => void patchPrize(pr.id, patch)}
                onRemove={() => void removePrize(pr.id)} />
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}><X className="size-4 mr-1" />Fechar</Button>
          <Button onClick={() => void savePool()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4 mr-1.5" />Salvar pool</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrizeRow({
  prize, totalWeight, onChange, onRemove,
}: {
  prize: GrabPoolPrize;
  totalWeight: number;
  onChange: (patch: Partial<GrabPoolPrize>) => void;
  onRemove: () => void;
}) {
  const needsRef = ["care_item","pet_background","decoration","name_gradient"].includes(prize.prize_kind);
  const [catalog, setCatalog] = useState<PrizeCatalogItem[]>([]);
  useEffect(() => {
    if (!needsRef) { setCatalog([]); return; }
    listPrizeCatalog(prize.prize_kind).then(setCatalog).catch(() => setCatalog([]));
  }, [prize.prize_kind, needsRef]);

  const pct = totalWeight > 0 && prize.active ? ((prize.weight / totalWeight) * 100).toFixed(1) : "0";

  return (
    <li className="grid grid-cols-12 items-end gap-2 rounded-xl border border-neutral-200 p-2">
      <div className="col-span-12 sm:col-span-3">
        <Label className="text-[11px]">Tipo</Label>
        <Select value={prize.prize_kind} onValueChange={(v) =>
          onChange({ prize_kind: v as GrabPrizeKind, prize_ref_id: null })
        }>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_KINDS.map((k) => <SelectItem key={k} value={k}>{GRAB_PRIZE_KIND_LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-12 sm:col-span-4">
        <Label className="text-[11px]">Item</Label>
        {needsRef ? (
          <Select value={prize.prize_ref_id ?? ""} onValueChange={(v) => onChange({ prize_ref_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
            <SelectContent>
              {catalog.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input disabled placeholder="—" />
        )}
      </div>

      <div className="col-span-4 sm:col-span-1">
        <Label className="text-[11px]">Qtd</Label>
        <Input value={String(prize.prize_amount)} inputMode="numeric"
          onChange={(e) => onChange({ prize_amount: Math.max(1, toInt(e.target.value)) })} />
      </div>

      <div className="col-span-4 sm:col-span-1">
        <Label className="text-[11px]">Peso</Label>
        <Input value={String(prize.weight)} inputMode="numeric"
          onChange={(e) => onChange({ weight: Math.max(1, toInt(e.target.value)) })} />
      </div>

      <div className="col-span-4 sm:col-span-1 text-center">
        <Label className="text-[11px]">%</Label>
        <div className="flex h-9 items-center justify-center rounded-md bg-neutral-50 text-xs font-semibold">
          <Percent className="size-3 mr-0.5 text-neutral-400" />{pct}
        </div>
      </div>

      <div className="col-span-8 sm:col-span-1 flex items-center gap-1">
        <Switch checked={prize.active} onCheckedChange={(v) => onChange({ active: v })} />
        <Label className="text-[11px]">on</Label>
      </div>

      <div className="col-span-4 sm:col-span-1 flex justify-end">
        <Button size="sm" variant="ghost" className="text-red-600" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}