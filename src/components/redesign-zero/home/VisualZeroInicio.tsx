import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  HeartHandshake,
  MessageCircle,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  getNativeInicioPriority,
  type NativeInicioViewModel,
} from "@/components/home/native/native-inicio-model";

import {
  VisualZeroActionRow,
  VisualZeroGroupedList,
  VisualZeroHeader,
  VisualZeroIconTile,
  VisualZeroInlineProgress,
  VisualZeroPrimaryAction,
  VisualZeroRow,
  VisualZeroScreen,
  VisualZeroSection,
  VisualZeroStatusPill,
} from "../primitives";

function currentDateLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function VisualZeroInicio({ model }: { model: NativeInicioViewModel }) {
  const priority = getNativeInicioPriority(model);

  return (
    <VisualZeroScreen className="vz-home">
      <VisualZeroHeader
        eyebrow={currentDateLabel()}
        title={model.greeting}
        description={model.greetingDetail}
      />

      {model.devotional ? (
        <Link to="/devocional" className="vz-home__word">
          <div className="vz-home__word-heading">
            <span>
              <BookOpen aria-hidden /> Palavra do dia
            </span>
            <ArrowRight aria-hidden />
          </div>
          {model.devotional.bibleText ? (
            <blockquote>“{model.devotional.bibleText}”</blockquote>
          ) : (
            <h2>{model.devotional.title}</h2>
          )}
          <small>{model.devotional.bibleReference ?? model.devotional.title}</small>
        </Link>
      ) : null}

      <section className="vz-home__priority" aria-label="Prioridade atual">
        <div className="vz-home__priority-icon">
          <Sparkles aria-hidden />
        </div>
        <div className="vz-home__priority-copy">
          <span className="vz-eyebrow">{priority.eyebrow}</span>
          <h2>{priority.title}</h2>
          <p>{priority.description}</p>
          {priority.progress !== undefined ? (
            <VisualZeroInlineProgress
              label="Força do perfil"
              value={priority.progress}
              metadata={`${priority.progress}%`}
            />
          ) : null}
        </div>
        <VisualZeroPrimaryAction to={priority.to}>
          Continuar <ArrowRight aria-hidden />
        </VisualZeroPrimaryAction>
      </section>

      <VisualZeroSection title="Seu momento" eyebrow="Resumo">
        <VisualZeroGroupedList className="vz-home__metrics">
          <VisualZeroActionRow
            to="/conversas"
            leading={
              <VisualZeroIconTile tone="coral">
                <MessageCircle aria-hidden />
              </VisualZeroIconTile>
            }
            title="Conversas não lidas"
            description="Mensagens esperando por você"
            trailing={
              <strong className="vz-home__metric-value">{model.unreadConversations}</strong>
            }
          />
          <VisualZeroActionRow
            to="/pretendentes"
            leading={
              <VisualZeroIconTile tone="violet">
                <UsersRound aria-hidden />
              </VisualZeroIconTile>
            }
            title="Novos perfis"
            description="Descobertas recentes em Explorar"
            trailing={<strong className="vz-home__metric-value">{model.newProfiles}</strong>}
          />
          <VisualZeroActionRow
            to="/perfil"
            leading={
              <VisualZeroIconTile tone="mint">
                <UserRound aria-hidden />
              </VisualZeroIconTile>
            }
            title="Força do perfil"
            description={model.strengthLabel}
            trailing={<strong className="vz-home__metric-value">{model.strength}%</strong>}
          />
          <VisualZeroActionRow
            to={model.commitment ? `/proposito/${model.commitment.matchId}` : "/pretendentes"}
            leading={
              <VisualZeroIconTile tone="amber">
                <HeartHandshake aria-hidden />
              </VisualZeroIconTile>
            }
            title={model.commitment ? "Propósito ativo" : "Relacionamento opcional"}
            description={
              model.commitment
                ? `${model.commitment.days} dias de caminhada`
                : "Acesse quando fizer sentido"
            }
            trailing={
              model.commitment ? (
                <VisualZeroStatusPill tone="violet">Ativo</VisualZeroStatusPill>
              ) : undefined
            }
          />
        </VisualZeroGroupedList>
      </VisualZeroSection>

      {model.suggestion ? (
        <VisualZeroSection title="Uma descoberta para você" eyebrow="Sugestão real">
          <VisualZeroGroupedList>
            <VisualZeroActionRow
              to={`/pretendentes/${model.suggestion.id}`}
              leading={
                <VisualZeroIconTile tone="violet">
                  <UserRound aria-hidden />
                </VisualZeroIconTile>
              }
              title={model.suggestion.firstName}
              description={[
                model.suggestion.age && `${model.suggestion.age} anos`,
                model.suggestion.location,
              ]
                .filter(Boolean)
                .join(" · ")}
              trailing={<VisualZeroStatusPill tone="neutral">Ver perfil</VisualZeroStatusPill>}
            />
          </VisualZeroGroupedList>
        </VisualZeroSection>
      ) : null}

      {model.warnings.length > 0 || model.requests.length > 0 ? (
        <VisualZeroSection title="Da equipe" eyebrow="Atenção">
          <VisualZeroGroupedList>
            {model.warnings.map((warning) => (
              <VisualZeroRow
                key={warning.id}
                leading={
                  <VisualZeroIconTile tone={warning.severity === "severe" ? "coral" : "amber"}>
                    <AlertTriangle aria-hidden />
                  </VisualZeroIconTile>
                }
                title={warning.severity === "severe" ? "Aviso importante" : "Aviso da moderação"}
                description={warning.message}
                trailing={
                  <button
                    className="vz-home__inline-action"
                    type="button"
                    onClick={() => model.onAcknowledgeWarning(warning.id)}
                  >
                    <Check aria-hidden /> Entendi
                  </button>
                }
              />
            ))}
            {model.requests.map((request) => (
              <VisualZeroRow
                key={request.id}
                leading={
                  <VisualZeroIconTile tone="violet">
                    <Send aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Solicitação da equipe"
                description={request.message}
                metadata={new Date(request.createdAt).toLocaleDateString("pt-BR")}
                trailing={
                  <button
                    className="vz-home__inline-action"
                    type="button"
                    onClick={() => model.onResolveRequest(request.id)}
                  >
                    <Check aria-hidden /> Resolvida
                  </button>
                }
              />
            ))}
          </VisualZeroGroupedList>
        </VisualZeroSection>
      ) : null}

      {model.canAppeal || model.canReverify ? (
        <VisualZeroSection title="Fale com a equipe" eyebrow="Revisão da conta">
          <form
            className="vz-home__appeal"
            onSubmit={(event) => {
              event.preventDefault();
              model.onSubmitAppeal(model.status === "banned" ? "ban" : "rejection");
            }}
          >
            <label htmlFor="vz-home-appeal">Explique sua solicitação</label>
            <textarea
              id="vz-home-appeal"
              rows={4}
              value={model.appealText}
              onChange={(event) => model.onAppealTextChange(event.target.value)}
            />
            <VisualZeroPrimaryAction
              type="submit"
              disabled={model.appealBusy || !model.appealText.trim()}
            >
              <Send aria-hidden /> Enviar solicitação
            </VisualZeroPrimaryAction>
          </form>
        </VisualZeroSection>
      ) : null}
    </VisualZeroScreen>
  );
}
