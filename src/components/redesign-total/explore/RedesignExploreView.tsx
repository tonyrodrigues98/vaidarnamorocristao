import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookHeart,
  CircleHelp,
  Gamepad2,
  HeartHandshake,
  Newspaper,
  Package,
  PawPrint,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  UserRound,
} from "lucide-react";

import { NativeExploreContinue } from "@/components/explore/native/NativeExploreContinue";
import type { NativeExploreIconKey, NativeExploreItem } from "@/config/native-explore-registry";

import { RedesignBadge, RedesignCard, RedesignPage, RedesignSection } from "../primitives";

const icons = {
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

const groups = [
  { id: "people", title: "Descobrir pessoas", ids: ["dating"] },
  {
    id: "faith",
    title: "Fé e conteúdo",
    ids: ["devotional", "bible-quiz", "news", "prayers", "live"],
  },
  { id: "identity", title: "Expressão e identidade", ids: ["avatar"] },
  { id: "pets", title: "Pets e jogos", ids: ["my-pet", "pet-arcade"] },
  { id: "rewards", title: "Loja e recompensas", ids: ["store", "boxes", "achievements"] },
] as const;

export function RedesignExploreView({ items }: { items: readonly NativeExploreItem[] }) {
  return (
    <RedesignPage className="rd-explore">
      <header className="rd-page-heading">
        <RedesignBadge>Experiências reais</RedesignBadge>
        <h1>Explorar</h1>
        <p>Encontre pessoas, conteúdos e recursos organizados pelo que você quer fazer.</p>
      </header>

      <RedesignSection className="rd-explore__continue" aria-labelledby="rd-explore-continue">
        <div className="rd-section-heading">
          <div>
            <span className="rd-eyebrow">Retomar</span>
            <h2 id="rd-explore-continue">Continuar</h2>
          </div>
        </div>
        <NativeExploreContinue />
      </RedesignSection>

      {groups.map((group) => {
        const groupItems = group.ids
          .map((id) => items.find((item) => item.id === id))
          .filter((item): item is NativeExploreItem => Boolean(item));
        if (groupItems.length === 0) return null;
        return (
          <RedesignSection key={group.id} className="rd-explore__group">
            <div className="rd-section-heading">
              <h2>{group.title}</h2>
            </div>
            <div className="rd-explore__list">
              {groupItems.map((item) => {
                const Icon = icons[item.icon];
                return (
                  <Link key={item.id} to={item.path as never}>
                    <span className="rd-explore__icon">
                      <Icon aria-hidden />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    {item.relationshipOptional ? <RedesignBadge>Opcional</RedesignBadge> : null}
                    <ArrowRight aria-hidden />
                  </Link>
                );
              })}
            </div>
          </RedesignSection>
        );
      })}

      <RedesignSection className="rd-explore__group">
        <div className="rd-section-heading">
          <h2>Segurança e conta</h2>
        </div>
        <div className="rd-explore__list">
          <Link to="/verificacao">
            <span className="rd-explore__icon">
              <ShieldCheck aria-hidden />
            </span>
            <span>
              <strong>Verificação</strong>
              <small>Acompanhe a verificação do seu perfil.</small>
            </span>
            <ArrowRight aria-hidden />
          </Link>
          <Link to="/conta">
            <span className="rd-explore__icon">
              <Settings aria-hidden />
            </span>
            <span>
              <strong>Configurações</strong>
              <small>Conta, privacidade e preferências.</small>
            </span>
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </RedesignSection>
    </RedesignPage>
  );
}
