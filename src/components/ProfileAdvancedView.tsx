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

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="glass animate-fade-up rounded-2xl p-5 shadow-soft">
      <header className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rose)]/10 text-[var(--rose)]">{icon}</div>
        <h3 className="text-base font-semibold leading-none">{title}</h3>
      </header>
      <div className="space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 leading-relaxed text-foreground/90">{value}</dd>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs">{t}</span>
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
    <div className="space-y-4">
      {showSpiritual && (
        <Card icon={<BookHeart className="h-4 w-4" />} title="Identidade Espiritual">
          {d.life_verse && (
            <div className="rounded-xl bg-[var(--rose)]/5 p-3 text-foreground/90">
              <Quote className="mb-1 h-3.5 w-3.5 text-[var(--rose)]" />
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
        <Card icon={<HeartHandshake className="h-4 w-4" />} title="Estilo de Vida Cristão">
          <dl className="space-y-3">
            <Row label="Participa de" value={<Tags items={labelsOf(PARTICIPATES, d.participates)} />} />
            <Row label="Rotina espiritual" value={<Tags items={labelsOf(SPIRITUAL_ROUTINE, d.spiritual_routine)} />} />
            <Row label="Frequência na igreja" value={labelOf(CHURCH_FREQUENCY, d.church_frequency)} />
          </dl>
        </Card>
      )}

      {showMinistry && (
        <Card icon={<Users className="h-4 w-4" />} title="Ministério e Chamado">
          <dl className="space-y-2">
            <Row label="Ministério" value={d.ministry === "outro" ? d.ministry_other ?? labelOf(MINISTRY, d.ministry) : labelOf(MINISTRY, d.ministry)} />
            <Row label="Sente um chamado?" value={labelOf(HAS_CALLING, d.has_calling)} />
            <Row label="Sobre o chamado" value={d.calling_description} />
          </dl>
        </Card>
      )}

      {showRel && (
        <Card icon={<MessageCircleHeart className="h-4 w-4" />} title="Relacionamento e Intenção">
          <dl className="space-y-2">
            <Row label="O que busca" value={labelOf(SEEKING, d.seeking)} />
            <Row label="Tempo / objetivo" value={labelOf(PACE, d.pace)} />
            <Row label="Linguagem do amor" value={labelOf(LOVE_LANGUAGE, d.love_language)} />
          </dl>
        </Card>
      )}

      {showFuture && (
        <Card icon={<Compass className="h-4 w-4" />} title="Visão de Futuro">
          <dl className="space-y-3">
            <Row label="Quer casar?" value={labelOf(SIM_NAO_TALVEZ, d.wants_marriage)} />
            <Row label="Quer filhos?" value={
              d.wants_children
                ? `${labelOf(SIM_NAO_TALVEZ, d.wants_children)}${d.children_count ? ` · ${d.children_count}` : ""}`
                : null
            } />
            <Row label="Onde deseja viver" value={labelOf(LIVING_PLACE, d.living_place)} />
            <Row label="Objetivos de vida" value={<Tags items={labelsOf(LIFE_GOALS, d.life_goals)} />} />
          </dl>
        </Card>
      )}

      {showPersonality && (
        <Card icon={<Smile className="h-4 w-4" />} title="Personalidade">
          <div className="grid grid-cols-2 gap-3">
            {d.introversion && <PersonalityChip label="Social" value={labelOf(INTROVERSION, d.introversion)!} />}
            {d.energy && <PersonalityChip label="Energia" value={labelOf(ENERGY, d.energy)!} />}
            {d.communication && <PersonalityChip label="Comunicação" value={labelOf(COMMUNICATION, d.communication)!} />}
            {d.style && <PersonalityChip label="Estilo" value={labelOf(STYLE, d.style)!} />}
          </div>
        </Card>
      )}

      {showLikes && (
        <Card icon={<Music className="h-4 w-4" />} title="Gostos e Interesses">
          <dl className="space-y-2">
            <Row label="Hobbies" value={d.hobbies} />
            <Row label="Louvores favoritos" value={d.favorite_worships} />
            <Row label="Estilo de culto" value={labelOf(WORSHIP_STYLE, d.worship_style)} />
            <Row label="Tempo livre" value={d.free_time} />
          </dl>
        </Card>
      )}

      {showRoutine && (
        <Card icon={<Clock className="h-4 w-4" />} title="Rotina">
          <dl className="space-y-2">
            <Row label="Rotina" value={labelOf(ROUTINE, d.routine)} />
            <Row label="Tempo para relacionamento" value={labelOf(AVAILABLE_TIME, d.available_time)} />
          </dl>
        </Card>
      )}

      {showEmotional && (
        <Card icon={<Sparkles className="h-4 w-4" />} title="Em um relacionamento">
          <p className="leading-relaxed text-foreground/90">{d.in_relationship_iam}</p>
        </Card>
      )}

      {showSeeking && (
        <Card icon={<Search className="h-4 w-4" />} title="O que busco">
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
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}