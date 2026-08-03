import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookHeart,
  Compass,
  MessageCircle,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  getNativeInicioPriority,
  type NativeInicioViewModel,
} from "@/components/home/native/NativeInicioView";
import { MissionsTodayCard } from "@/components/pet/MissionsTodayCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  RedesignActionCard,
  RedesignBadge,
  RedesignCard,
  RedesignPage,
  RedesignProgress,
  RedesignSection,
} from "../primitives";

const shortcuts = [
  { label: "Comunidade", to: "/comunidade", Icon: UsersRound },
  { label: "Explorar", to: "/explorar", Icon: Compass },
  { label: "Conversas", to: "/conversas", Icon: MessageCircle },
  { label: "Perfil", to: "/perfil", Icon: UserRound },
] as const;

export function RedesignInicioView({ model }: { model: NativeInicioViewModel }) {
  const priority = getNativeInicioPriority(model);

  return (
    <RedesignPage className="rd-home">
      <header className="rd-page-heading">
        <RedesignBadge>Comunidade cristã 18+</RedesignBadge>
        <h1>{model.greeting}</h1>
        <p>{model.greetingDetail}</p>
      </header>

      {model.devotional ? (
        <Link to="/devocional" className="rd-home__devotional">
          <span className="rd-eyebrow">
            <BookHeart aria-hidden /> Palavra do dia
          </span>
          {model.devotional.bibleText ? (
            <blockquote>“{model.devotional.bibleText}”</blockquote>
          ) : (
            <h2>{model.devotional.title}</h2>
          )}
          <div>
            <span>{model.devotional.bibleReference ?? model.devotional.title}</span>
            <strong>
              Abrir devocional <ArrowRight aria-hidden />
            </strong>
          </div>
        </Link>
      ) : (
        <RedesignCard tone="subtle" className="rd-home__empty-devotional">
          <BookHeart aria-hidden />
          <div>
            <strong>Palavra do dia</strong>
            <p>Nenhum devocional foi publicado para hoje.</p>
          </div>
        </RedesignCard>
      )}

      <RedesignActionCard className="rd-home__priority">
        <div>
          <span className="rd-eyebrow">{priority.eyebrow}</span>
          <h2>{priority.title}</h2>
          <p>{priority.description}</p>
          {priority.progress !== undefined ? (
            <RedesignProgress
              label="Força do perfil"
              value={priority.progress}
              metadata={`${priority.progress}%`}
            />
          ) : null}
        </div>
        <Button asChild className="rd-primary-button">
          <Link to={priority.to as never}>
            Continuar <ArrowRight aria-hidden />
          </Link>
        </Button>
      </RedesignActionCard>

      <RedesignSection className="rd-home__shortcuts" aria-labelledby="rd-home-shortcuts">
        <div className="rd-section-heading">
          <div>
            <span className="rd-eyebrow">Acesso rápido</span>
            <h2 id="rd-home-shortcuts">Seus atalhos</h2>
          </div>
        </div>
        <div className="rd-home__shortcut-grid">
          {shortcuts.map(({ label, to, Icon }) => (
            <Link key={to} to={to} className="rd-home__shortcut">
              <span>
                <Icon aria-hidden />
              </span>
              <strong>{label}</strong>
              {label === "Conversas" && model.unreadConversations > 0 ? (
                <RedesignBadge>{model.unreadConversations}</RedesignBadge>
              ) : null}
            </Link>
          ))}
        </div>
      </RedesignSection>

      <RedesignSection className="rd-home__summary" aria-labelledby="rd-home-summary">
        <div className="rd-section-heading">
          <div>
            <span className="rd-eyebrow">Agora</span>
            <h2 id="rd-home-summary">Seu resumo</h2>
          </div>
        </div>
        <div className="rd-home__summary-grid">
          <RedesignCard tone="subtle">
            <MessageCircle aria-hidden />
            <strong>{model.unreadConversations}</strong>
            <span>conversas não lidas</span>
          </RedesignCard>
          <RedesignCard tone="violet">
            <UsersRound aria-hidden />
            <strong>{model.newProfiles}</strong>
            <span>novos perfis</span>
          </RedesignCard>
          <RedesignCard tone="coral">
            <UserRound aria-hidden />
            <strong>{model.strength}%</strong>
            <span>{model.strengthLabel}</span>
          </RedesignCard>
        </div>
      </RedesignSection>

      {model.status === "approved" ? <MissionsTodayCard className="rd-home__missions" /> : null}

      {model.suggestion ? (
        <RedesignCard className="rd-home__suggestion">
          <span className="rd-eyebrow">Uma descoberta para quando quiser</span>
          <h2>{model.suggestion.firstName}</h2>
          <p>{[model.suggestion.age, model.suggestion.location].filter(Boolean).join(" · ")}</p>
          <Link to="/pretendentes/$id" params={{ id: model.suggestion.id }}>
            Ver perfil <ArrowRight aria-hidden />
          </Link>
        </RedesignCard>
      ) : null}

      {model.warnings.length > 0 ? (
        <section className="rd-home__alerts" aria-label="Avisos da moderação">
          {model.warnings.map((warning) => (
            <RedesignCard key={warning.id} className="rd-home__alert">
              <AlertTriangle aria-hidden />
              <div>
                <strong>
                  {warning.severity === "severe"
                    ? "Aviso importante da moderação"
                    : "Aviso da moderação"}
                </strong>
                <p>{warning.message}</p>
                <Button variant="outline" onClick={() => model.onAcknowledgeWarning(warning.id)}>
                  Entendi
                </Button>
              </div>
            </RedesignCard>
          ))}
        </section>
      ) : null}

      {model.requests.length > 0 ? (
        <RedesignCard className="rd-home__requests">
          <span className="rd-eyebrow">Solicitações da equipe</span>
          {model.requests.map((request) => (
            <article key={request.id}>
              <div>
                <strong>{request.kind}</strong>
                <span>{new Date(request.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <p>{request.message}</p>
              <Button onClick={() => model.onResolveRequest(request.id)}>
                Marcar como resolvida
              </Button>
            </article>
          ))}
        </RedesignCard>
      ) : null}

      {model.canAppeal || model.canReverify ? (
        <RedesignCard className="rd-home__appeal">
          <span className="rd-eyebrow">Revisão da conta</span>
          <h2>Fale com a equipe</h2>
          <Textarea
            value={model.appealText}
            onChange={(event) => model.onAppealTextChange(event.target.value)}
            rows={4}
            placeholder="Explique sua solicitação"
          />
          <Button
            disabled={model.appealBusy || !model.appealText.trim()}
            onClick={() => model.onSubmitAppeal(model.status === "banned" ? "ban" : "rejection")}
          >
            <Send aria-hidden /> Enviar solicitação
          </Button>
        </RedesignCard>
      ) : null}
    </RedesignPage>
  );
}
