import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, HeartHandshake, Users, Compass, Smile, Music, Clock, MessageCircleHeart, Search, BookHeart, Quote } from "lucide-react";
import {
  type AdvancedProfile,
  FAITH_MOMENT, PARTICIPATES, SPIRITUAL_ROUTINE, CHURCH_FREQUENCY,
  MINISTRY, HAS_CALLING, SEEKING, PACE, LOVE_LANGUAGE,
  SIM_NAO_TALVEZ, LIVING_PLACE, LIFE_GOALS,
  INTROVERSION, ENERGY, COMMUNICATION, STYLE,
  WORSHIP_STYLE, ROUTINE, AVAILABLE_TIME,
  labelOf, labelsOf, hasAny,
} from "@/lib/profileAdvanced";

type Tone = "rose" | "sky" | "violet" | "amber" | "emerald" | "indigo" | "pink" | "teal" | "fuchsia" | "orange";

const TONE_BG: Record<Tone, string> = {
  rose: "bg-[var(--rose)]/10 text-[var(--rose)]",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const TONE_RING: Record<Tone, string> = {
  rose: "ring-[var(--rose)]/15",
  sky: "ring-sky-500/15",
  violet: "ring-violet-500/15",
  amber: "ring-amber-500/20",
  emerald: "ring-emerald-500/15",
  indigo: "ring-indigo-500/15",
  pink: "ring-pink-500/15",
  teal: "ring-teal-500/15",
  fuchsia: "ring-fuchsia-500/15",
  orange: "ring-orange-500/15",
};

function Card({
  icon,
  title,
  subtitle,
  tone = "rose",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <section className={`glass animate-fade-up rounded-2xl p-6 shadow-soft ring-1 ${TONE_RING[tone]}`}>
      <header className="mb-5 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE_BG[tone]}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      <div className="space-y-4 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-relaxed text-foreground/90">{value}</dd>
    </div>
  );
}

function Tags({ items, tone = "rose" }: { items: string[]; tone?: Tone }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TONE_BG[tone]} ${TONE_RING[tone]}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function ProfileAdvancedView({ userId }: { userId: string }) {
  const [d, setD] = useState<AdvancedProfile | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("profile_advanced").select("*").eq("user_id", userId).maybeSingle();
      if (!alive) return;
      setD((data ?? null) as AdvancedProfile | null);
    })();
    return () => { alive = false; };
  }, [userId]);

  if (d === undefined) return null;
  if (!d) return null;

  const showSpiritual = hasAny(d.life_verse, d.faith_moment, d.testimony);
  const showLifestyle = hasAny(d.participates, d.spiritual_routine, d.church_frequency);
  const showMinistry = hasAny(d.ministry, d.has_calling, d.calling_description);
  const showRel = hasAny(d.seeking, d.pace, d.love_language);
  const showFuture = hasAny(d.wants_marriage, d.wants_children, d.living_place, d.life_goals);
  const showPersonality = hasAny(d.introversion, d.energy, d.communication, d.style);
  const showLikes = hasAny(d.hobbies, d.favorite_worships, d.worship_style, d.free_time);
  const showRoutine = hasAny(d.routine, d.available_time);
  const showEmotional = hasAny(d.in_relationship_iam);
  const showSeeking = hasAny(d.essential_quality, d.non_negotiable, d.willing_to_build);

  const anything = showSpiritual || showLifestyle || showMinistry || showRel || showFuture || showPersonality || showLikes || showRoutine || showEmotional || showSeeking;
  if (!anything) return null;

  return (
    <div className="space-y-5">
      {showSpiritual && (
        <Card icon={<BookHeart className="h-5 w-5" />} title="Identidade Espiritual" subtitle="Fé e caminhada" tone="violet">
          {d.life_verse && (
            <div className="rounded-xl bg-violet-500/5 p-4 ring-1 ring-violet-500/15 text-foreground/90">
              <Quote className="mb-1.5 h-4 w-4 text-violet-500" />
              <p className="italic leading-relaxed">{d.life_verse}</p>
            </div>
          )}
          <dl className="space-y-2">
            <Row label="Momento da fé" value={labelOf(FAITH_MOMENT, d.faith_moment)} />
            <Row label="Testemunho" value={d.testimony} />
          </dl>
        </Card>
      )}

      {showLifestyle && (
        <Card icon={<HeartHandshake className="h-5 w-5" />} title="Estilo de Vida Cristão" subtitle="Rotina e prática" tone="emerald">
          <dl className="space-y-3">
            <Row label="Participa de" value={<Tags items={labelsOf(PARTICIPATES, d.participates)} tone="emerald" />} />
            <Row label="Rotina espiritual" value={<Tags items={labelsOf(SPIRITUAL_ROUTINE, d.spiritual_routine)} tone="emerald" />} />
            <Row label="Frequência na igreja" value={labelOf(CHURCH_FREQUENCY, d.church_frequency)} />
          </dl>
        </Card>
      )}

      {showMinistry && (
        <Card icon={<Users className="h-5 w-5" />} title="Ministério e Chamado" subtitle="Serviço e propósito" tone="indigo">
          <dl className="space-y-2">
            <Row label="Ministério" value={d.ministry === "outro" ? d.ministry_other ?? labelOf(MINISTRY, d.ministry) : labelOf(MINISTRY, d.ministry)} />
            <Row label="Sente um chamado?" value={labelOf(HAS_CALLING, d.has_calling)} />
            <Row label="Sobre o chamado" value={d.calling_description} />
          </dl>
        </Card>
      )}

      {showRel && (
        <Card icon={<MessageCircleHeart className="h-5 w-5" />} title="Relacionamento e Intenção" subtitle="Como se relaciona" tone="pink">
          <dl className="space-y-2">
            <Row label="O que busca" value={labelOf(SEEKING, d.seeking)} />
            <Row label="Tempo / objetivo" value={labelOf(PACE, d.pace)} />
            <Row label="Linguagem do amor" value={labelOf(LOVE_LANGUAGE, d.love_language)} />
          </dl>
        </Card>
      )}

      {showFuture && (
        <Card icon={<Compass className="h-5 w-5" />} title="Visão de Futuro" subtitle="Sonhos e planos" tone="sky">
          <dl className="space-y-3">
            <Row label="Quer casar?" value={labelOf(SIM_NAO_TALVEZ, d.wants_marriage)} />
            <Row label="Quer filhos?" value={
              d.wants_children
                ? `${labelOf(SIM_NAO_TALVEZ, d.wants_children)}${d.children_count ? ` · ${d.children_count}` : ""}`
                : null
            } />
            <Row label="Onde deseja viver" value={labelOf(LIVING_PLACE, d.living_place)} />
            <Row label="Objetivos de vida" value={<Tags items={labelsOf(LIFE_GOALS, d.life_goals)} tone="sky" />} />
          </dl>
        </Card>
      )}

      {showPersonality && (
        <Card icon={<Smile className="h-5 w-5" />} title="Personalidade" subtitle="Jeito de ser" tone="amber">
          <div className="grid grid-cols-2 gap-3">
            {d.introversion && <PersonalityChip label="Social" value={labelOf(INTROVERSION, d.introversion)!} />}
            {d.energy && <PersonalityChip label="Energia" value={labelOf(ENERGY, d.energy)!} />}
            {d.communication && <PersonalityChip label="Comunicação" value={labelOf(COMMUNICATION, d.communication)!} />}
            {d.style && <PersonalityChip label="Estilo" value={labelOf(STYLE, d.style)!} />}
          </div>
        </Card>
      )}

      {showLikes && (
        <Card icon={<Music className="h-5 w-5" />} title="Gostos e Interesses" subtitle="Vida pessoal" tone="fuchsia">
          <dl className="space-y-2">
            <Row label="Hobbies" value={d.hobbies} />
            <Row label="Louvores favoritos" value={d.favorite_worships} />
            <Row label="Estilo de culto" value={labelOf(WORSHIP_STYLE, d.worship_style)} />
            <Row label="Tempo livre" value={d.free_time} />
          </dl>
        </Card>
      )}

      {showRoutine && (
        <Card icon={<Clock className="h-5 w-5" />} title="Rotina" subtitle="Dia a dia" tone="teal">
          <dl className="space-y-2">
            <Row label="Rotina" value={labelOf(ROUTINE, d.routine)} />
            <Row label="Tempo para relacionamento" value={labelOf(AVAILABLE_TIME, d.available_time)} />
          </dl>
        </Card>
      )}

      {showEmotional && (
        <Card icon={<Sparkles className="h-5 w-5" />} title="Em um relacionamento" subtitle="Como ama" tone="rose">
          <p className="leading-relaxed text-foreground/90">{d.in_relationship_iam}</p>
        </Card>
      )}

      {showSeeking && (
        <Card icon={<Search className="h-5 w-5" />} title="O que busco" subtitle="Valores no outro" tone="orange">
          <dl className="space-y-2">
            <Row label="Qualidade essencial" value={d.essential_quality} />
            <Row label="Não abre mão" value={d.non_negotiable} />
            <Row label="Disposto a construir" value={d.willing_to_build} />
          </dl>
        </Card>
      )}
    </div>
  );
}

function PersonalityChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}