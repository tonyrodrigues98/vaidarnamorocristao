import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Sparkles,
  HeartHandshake,
  Users,
  Compass,
  Target,
  Smile,
  Music,
  Clock,
  MessageCircleHeart,
  Search,
  BookHeart,
} from "lucide-react";
import {
  EMPTY_ADVANCED,
  type AdvancedProfile,
  FAITH_MOMENT,
  PARTICIPATES,
  SPIRITUAL_ROUTINE,
  CHURCH_FREQUENCY,
  MINISTRY,
  HAS_CALLING,
  SEEKING,
  PACE,
  LOVE_LANGUAGE,
  SIM_NAO_TALVEZ,
  LIVING_PLACE,
  LIFE_GOALS,
  INTROVERSION,
  ENERGY,
  COMMUNICATION,
  STYLE,
  WORSHIP_STYLE,
  ROUTINE,
  AVAILABLE_TIME,
} from "@/lib/profileAdvanced";
import { recomputeMyBadges } from "@/lib/recomputeBadges";

type Form = Omit<AdvancedProfile, "user_id">;

type Opt = { v: string; l: string };

function ChipSingle({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: Opt[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const sel = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(sel ? null : o.v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${sel ? "border-[var(--rose)] bg-[var(--rose)] text-white shadow-soft" : "border-border bg-card/60 text-muted-foreground hover:border-[var(--rose-soft)]"}`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function ChipMulti({
  values,
  options,
  onChange,
}: {
  values: string[];
  options: Opt[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const sel = values.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => toggle(o.v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${sel ? "border-[var(--rose)] bg-[var(--rose)] text-white shadow-soft" : "border-border bg-card/60 text-muted-foreground hover:border-[var(--rose-soft)]"}`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass animate-fade-up rounded-3xl p-5 shadow-soft sm:p-6">
      <header className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--rose)]/10 text-[var(--rose)]">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export type AdvancedSection =
  | "identity"
  | "lifestyle"
  | "ministry"
  | "future"
  | "personality"
  | "tastes"
  | "routine"
  | "self"
  | "relationship"
  | "seeking";

const ABOUT_SECTIONS: AdvancedSection[] = [
  "identity",
  "lifestyle",
  "ministry",
  "future",
  "personality",
  "tastes",
  "routine",
  "self",
];
const PREFS_SECTIONS: AdvancedSection[] = ["relationship", "seeking"];

export type ProfileAdvancedFormHandle = {
  /** Persist the advanced profile. Returns true on success. */
  saveAdvanced: () => Promise<boolean>;
};

export type ProfileAdvancedFormProps = {
  userId: string;
  mode?: "about" | "prefs" | "all";
  /** When true, the form's own sticky submit button is not rendered. */
  hideSubmit?: boolean;
  /** When true, suppress the success toast (useful when a parent shows its own). */
  silentToast?: boolean;
};

export const ProfileAdvancedForm = forwardRef<ProfileAdvancedFormHandle, ProfileAdvancedFormProps>(
  function ProfileAdvancedForm({ userId, mode = "all", hideSubmit = false, silentToast = false }, ref) {
  const visible: AdvancedSection[] =
    mode === "about"
      ? ABOUT_SECTIONS
      : mode === "prefs"
        ? PREFS_SECTIONS
        : [...ABOUT_SECTIONS, ...PREFS_SECTIONS];
  const show = (s: AdvancedSection) => visible.includes(s);
  const [data, setData] = useState<Form>(EMPTY_ADVANCED);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: row } = await supabase
        .from("profile_advanced")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!alive) return;
      if (row) {
        const r = row as Record<string, unknown>;
        const next: Form = { ...EMPTY_ADVANCED };
        (Object.keys(EMPTY_ADVANCED) as Array<keyof Form>).forEach((k) => {
          if (k in r) {
            (next as any)[k] = (r[k as string] as Form[typeof k]) ?? EMPTY_ADVANCED[k];
          }
        });
        setData(next);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setData((d) => ({ ...d, [k]: v }));

  async function persist(): Promise<boolean> {
    setSaving(true);
    const payload = {
      user_id: userId,
      ...data,
      participates: data.participates ?? [],
      spiritual_routine: data.spiritual_routine ?? [],
      life_goals: data.life_goals ?? [],
      children_count: data.children_count ?? null,
    };
    const { error } = await supabase.from("profile_advanced").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    if (!silentToast) toast.success("Perfil avançado salvo!");
    void recomputeMyBadges(userId);
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await persist();
  }

  useImperativeHandle(ref, () => ({ saveAdvanced: persist }), [data, userId, silentToast]);

  if (loading) return <div className="glass animate-pulse rounded-3xl p-6 shadow-soft h-96" />;

  const saveLabel =
    mode === "prefs"
      ? "Salvar preferências"
      : mode === "about"
        ? "Salvar sobre mim"
        : "Salvar perfil avançado";

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="rounded-2xl border border-[var(--rose)]/20 bg-[var(--rose)]/5 p-4 text-sm">
        <p className="font-medium text-foreground">Tudo opcional ✨</p>
        <p className="mt-1 text-muted-foreground">
          Preencha o que fizer sentido. Seções vazias somem do seu perfil público. Ao completar 8
          das 10 seções você ganha a badge <strong>Perfil Avançado</strong>.
        </p>
      </div>

      {show("identity") && (
        <Section
          icon={<BookHeart className="h-4 w-4" />}
          title="Identidade Espiritual"
          subtitle="Quem você é em Cristo, hoje"
        >
          <Field label="Versículo que define sua vida hoje">
            <Input
              value={data.life_verse ?? ""}
              onChange={(e) => set("life_verse", e.target.value || null)}
              placeholder="Ex: Filipenses 4:13"
              maxLength={120}
            />
          </Field>
          <Field label="Momento da fé">
            <ChipSingle
              value={data.faith_moment}
              options={FAITH_MOMENT}
              onChange={(v) => set("faith_moment", v)}
            />
          </Field>
          <Field label="Pequeno testemunho">
            <Textarea
              rows={3}
              maxLength={500}
              value={data.testimony ?? ""}
              onChange={(e) => set("testimony", e.target.value || null)}
              placeholder="Um momento marcante da sua jornada com Deus..."
            />
          </Field>
        </Section>
      )}

      {show("lifestyle") && (
        <Section
          icon={<HeartHandshake className="h-4 w-4" />}
          title="Estilo de Vida Cristão"
          subtitle="Como sua fé acontece no dia a dia"
        >
          <Field label="Você participa de">
            <ChipMulti
              values={data.participates ?? []}
              options={PARTICIPATES}
              onChange={(v) => set("participates", v)}
            />
          </Field>
          <Field label="Sua rotina espiritual">
            <ChipMulti
              values={data.spiritual_routine ?? []}
              options={SPIRITUAL_ROUTINE}
              onChange={(v) => set("spiritual_routine", v)}
            />
          </Field>
          <Field label="Frequência na igreja">
            <ChipSingle
              value={data.church_frequency}
              options={CHURCH_FREQUENCY}
              onChange={(v) => set("church_frequency", v)}
            />
          </Field>
        </Section>
      )}

      {show("ministry") && (
        <Section icon={<Users className="h-4 w-4" />} title="Ministério e Chamado">
          <Field label="Ministério atual">
            <ChipSingle
              value={data.ministry}
              options={MINISTRY}
              onChange={(v) => set("ministry", v)}
            />
          </Field>
          {data.ministry === "outro" && (
            <Field label="Qual?">
              <Input
                value={data.ministry_other ?? ""}
                onChange={(e) => set("ministry_other", e.target.value || null)}
                maxLength={80}
              />
            </Field>
          )}
          <Field label="Sente um chamado?">
            <ChipSingle
              value={data.has_calling}
              options={HAS_CALLING}
              onChange={(v) => set("has_calling", v)}
            />
          </Field>
          {data.has_calling === "sim" && (
            <Field label="Conte um pouco">
              <Textarea
                rows={2}
                maxLength={300}
                value={data.calling_description ?? ""}
                onChange={(e) => set("calling_description", e.target.value || null)}
              />
            </Field>
          )}
        </Section>
      )}

      {show("relationship") && (
        <Section
          icon={<MessageCircleHeart className="h-4 w-4" />}
          title="Relacionamento e Intenção"
        >
          <Field label="O que busca">
            <ChipSingle
              value={data.seeking}
              options={SEEKING}
              onChange={(v) => set("seeking", v)}
            />
          </Field>
          <Field label="Tempo / objetivo">
            <ChipSingle value={data.pace} options={PACE} onChange={(v) => set("pace", v)} />
          </Field>
          <Field label="Linguagem do amor">
            <ChipSingle
              value={data.love_language}
              options={LOVE_LANGUAGE}
              onChange={(v) => set("love_language", v)}
            />
          </Field>
        </Section>
      )}

      {show("future") && (
        <Section icon={<Compass className="h-4 w-4" />} title="Visão de Futuro">
          <Field label="Quer casar?">
            <ChipSingle
              value={data.wants_marriage}
              options={SIM_NAO_TALVEZ}
              onChange={(v) => set("wants_marriage", v)}
            />
          </Field>
          <Field label="Quer filhos?">
            <ChipSingle
              value={data.wants_children}
              options={SIM_NAO_TALVEZ}
              onChange={(v) => set("wants_children", v)}
            />
          </Field>
          {data.wants_children === "sim" && (
            <Field label="Quantos (opcional)">
              <NumericInput
                min={1}
                max={10}
                maxLength={2}
                value={data.children_count ?? ""}
                onChange={(v) =>
                  set("children_count", v ? Math.max(1, Math.min(10, Number(v))) : null)
                }
                className="max-w-[120px]"
              />
            </Field>
          )}
          <Field label="Onde deseja viver">
            <ChipSingle
              value={data.living_place}
              options={LIVING_PLACE}
              onChange={(v) => set("living_place", v)}
            />
          </Field>
          <Field label="Objetivos de vida">
            <ChipMulti
              values={data.life_goals ?? []}
              options={LIFE_GOALS}
              onChange={(v) => set("life_goals", v)}
            />
          </Field>
        </Section>
      )}

      {show("personality") && (
        <Section icon={<Smile className="h-4 w-4" />} title="Personalidade">
          <Field label="Introversão">
            <ChipSingle
              value={data.introversion}
              options={INTROVERSION}
              onChange={(v) => set("introversion", v)}
            />
          </Field>
          <Field label="Energia">
            <ChipSingle value={data.energy} options={ENERGY} onChange={(v) => set("energy", v)} />
          </Field>
          <Field label="Comunicação">
            <ChipSingle
              value={data.communication}
              options={COMMUNICATION}
              onChange={(v) => set("communication", v)}
            />
          </Field>
          <Field label="Estilo">
            <ChipSingle value={data.style} options={STYLE} onChange={(v) => set("style", v)} />
          </Field>
        </Section>
      )}

      {show("tastes") && (
        <Section icon={<Music className="h-4 w-4" />} title="Gostos e Interesses">
          <Field label="Hobbies">
            <Input
              value={data.hobbies ?? ""}
              onChange={(e) => set("hobbies", e.target.value || null)}
              placeholder="Ex: leitura, esportes, cozinhar..."
              maxLength={200}
            />
          </Field>
          <Field label="Louvores favoritos">
            <Input
              value={data.favorite_worships ?? ""}
              onChange={(e) => set("favorite_worships", e.target.value || null)}
              maxLength={200}
            />
          </Field>
          <Field label="Estilo de culto preferido">
            <ChipSingle
              value={data.worship_style}
              options={WORSHIP_STYLE}
              onChange={(v) => set("worship_style", v)}
            />
          </Field>
          <Field label="Como gosta de passar o tempo livre">
            <Textarea
              rows={2}
              maxLength={300}
              value={data.free_time ?? ""}
              onChange={(e) => set("free_time", e.target.value || null)}
            />
          </Field>
        </Section>
      )}

      {show("routine") && (
        <Section icon={<Clock className="h-4 w-4" />} title="Rotina">
          <Field label="Sua rotina é">
            <ChipSingle
              value={data.routine}
              options={ROUTINE}
              onChange={(v) => set("routine", v)}
            />
          </Field>
          <Field label="Tempo disponível para relacionamento">
            <ChipSingle
              value={data.available_time}
              options={AVAILABLE_TIME}
              onChange={(v) => set("available_time", v)}
            />
          </Field>
        </Section>
      )}

      {show("self") && (
        <Section
          icon={<Sparkles className="h-4 w-4" />}
          title="Em um relacionamento"
          subtitle="Em um relacionamento, eu sou alguém que…"
        >
          <Textarea
            rows={4}
            maxLength={500}
            value={data.in_relationship_iam ?? ""}
            onChange={(e) => set("in_relationship_iam", e.target.value || null)}
            placeholder="Conte de forma sincera..."
          />
        </Section>
      )}

      {show("seeking") && (
        <Section
          icon={<Search className="h-4 w-4" />}
          title="O que busco"
          subtitle="Seja honesto — isso atrai conexões reais"
        >
          <Field label="Uma qualidade essencial">
            <Input
              value={data.essential_quality ?? ""}
              onChange={(e) => set("essential_quality", e.target.value || null)}
              maxLength={120}
            />
          </Field>
          <Field label="Algo que não abre mão">
            <Input
              value={data.non_negotiable ?? ""}
              onChange={(e) => set("non_negotiable", e.target.value || null)}
              maxLength={120}
            />
          </Field>
          <Field label="Algo que está disposto a construir junto">
            <Input
              value={data.willing_to_build ?? ""}
              onChange={(e) => set("willing_to_build", e.target.value || null)}
              maxLength={120}
            />
          </Field>
        </Section>
      )}

      {!hideSubmit && (
        <div className="sticky bottom-4 z-10">
          <Button type="submit" size="lg" className="w-full shadow-glow" disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : saveLabel}
          </Button>
        </div>
      )}

      <Target className="hidden" />
    </form>
  );
});
