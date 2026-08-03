import {
  BookHeart,
  Box,
  CircleHelp,
  Gamepad2,
  HeartHandshake,
  LockKeyhole,
  Newspaper,
  Package,
  PawPrint,
  Radio,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  UserRound,
  Wrench,
} from "lucide-react";

import type { NativeExploreIconKey, NativeExploreItem } from "@/config/native-explore-registry";

import {
  VisualZeroActionRow,
  VisualZeroGroupedList,
  VisualZeroHeader,
  VisualZeroHero,
  VisualZeroIconTile,
  VisualZeroScreen,
  VisualZeroSection,
  VisualZeroStatusPill,
} from "../primitives";

const ICONS = {
  "book-heart": BookHeart,
  "paw-print": PawPrint,
  gamepad: Gamepad2,
  "circle-help": CircleHelp,
  store: Store,
  "user-round": UserRound,
  package: Package,
  trophy: Trophy,
  newspaper: Newspaper,
  sparkles: Sparkles,
  "heart-handshake": HeartHandshake,
  radio: Radio,
} satisfies Record<NativeExploreIconKey, typeof BookHeart>;

const GROUPS = [
  { title: "Pessoas", ids: ["dating"] },
  { title: "Fé e conteúdo", ids: ["devotional", "bible-quiz", "news", "prayers", "live"] },
  { title: "Identidade", ids: ["avatar"] },
  { title: "Pets e jogos", ids: ["my-pet", "pet-arcade"] },
  { title: "Loja e recompensas", ids: ["store", "boxes", "achievements"] },
] as const;

const ACCOUNT_ITEMS = [
  { title: "Conta", description: "Dados, preferências e acesso.", path: "/conta", icon: Wrench },
  {
    title: "Verificação",
    description: "Acompanhe a verificação do perfil.",
    path: "/verificacao",
    icon: ShieldCheck,
  },
  {
    title: "Bloqueados",
    description: "Revise pessoas bloqueadas.",
    path: "/bloqueados",
    icon: LockKeyhole,
  },
  { title: "Suporte", description: "Abra a central de ajuda.", path: "/suporte", icon: CircleHelp },
] as const;

function ExploreRow({ item }: { item: NativeExploreItem }) {
  const Icon = ICONS[item.icon];
  return (
    <VisualZeroActionRow
      to={item.path}
      leading={
        <VisualZeroIconTile tone={item.relationshipOptional ? "coral" : "neutral"}>
          <Icon aria-hidden />
        </VisualZeroIconTile>
      }
      title={item.title}
      description={item.description}
      metadata={
        item.relationshipOptional ? (
          <VisualZeroStatusPill tone="coral">Opcional</VisualZeroStatusPill>
        ) : null
      }
    />
  );
}

export function VisualZeroExplore({ items }: { items: readonly NativeExploreItem[] }) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const devotional = byId.get("devotional");
  const pet = byId.get("my-pet");

  return (
    <VisualZeroScreen className="vz-explore">
      <VisualZeroHeader
        eyebrow="Descobrir"
        title="Explorar"
        description="Ferramentas, experiências e caminhos reais do VaiDarNamoro."
      />

      <VisualZeroHero className="vz-explore__hero">
        <div>
          <Sparkles aria-hidden />
          <span>Para você</span>
          <h2>Continue de onde faz sentido hoje.</h2>
          <p>Fé, companhia e relacionamento opcional no mesmo espaço.</p>
        </div>
        <VisualZeroGroupedList>
          {devotional ? <ExploreRow item={devotional} /> : null}
          {pet ? <ExploreRow item={pet} /> : null}
        </VisualZeroGroupedList>
      </VisualZeroHero>

      {GROUPS.map((group) => {
        const groupItems = group.ids
          .map((id) => byId.get(id))
          .filter(Boolean) as NativeExploreItem[];
        if (!groupItems.length) return null;
        return (
          <VisualZeroSection key={group.title} title={group.title}>
            <VisualZeroGroupedList>
              {groupItems.map((item) => (
                <ExploreRow key={item.id} item={item} />
              ))}
            </VisualZeroGroupedList>
          </VisualZeroSection>
        );
      })}

      <VisualZeroSection title="Conta e segurança">
        <VisualZeroGroupedList>
          {ACCOUNT_ITEMS.map((item) => (
            <VisualZeroActionRow
              key={item.path}
              to={item.path}
              leading={
                <VisualZeroIconTile tone="neutral">
                  <item.icon aria-hidden />
                </VisualZeroIconTile>
              }
              title={item.title}
              description={item.description}
            />
          ))}
        </VisualZeroGroupedList>
      </VisualZeroSection>
    </VisualZeroScreen>
  );
}
