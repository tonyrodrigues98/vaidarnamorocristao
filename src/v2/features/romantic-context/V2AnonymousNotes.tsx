import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Flag, Lightbulb, Reply, Send, ShieldCheck, UserRoundX } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
} from "@/v2/design-system";
import { sanitizeRomanticText, type RomanticContextRepository } from "./contracts";

const HINTS = [
  { category: "fe", text: "Minha fé é muito importante para mim" },
  { category: "personalidade", text: "Gosto de conversas profundas" },
  { category: "compatibilidade", text: "Temos valores parecidos" },
] as const;

export function V2AnonymousNotes({
  userId,
  repository,
  onOpenConversations,
}: {
  readonly userId: string;
  readonly repository: RomanticContextRepository;
  readonly onOpenConversations: () => void;
}) {
  const queryClient = useQueryClient();
  const key = ["v2", "anonymous-notes", userId] as const;
  const center = useQuery({ queryKey: key, queryFn: () => repository.loadAnonymousCenter(userId) });
  const [feedback, setFeedback] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [response, setResponse] = useState("");
  const refresh = async () => queryClient.invalidateQueries({ queryKey: key });

  const optIn = useMutation({
    mutationFn: (accepting: boolean) => repository.setAnonymousOptIn(userId, accepting),
    onSuccess: async (_data, accepting) => {
      setFeedback(
        accepting
          ? "Você escolheu receber recados anônimos."
          : "Novos recados foram interrompidos. O histórico permanece.",
      );
      await refresh();
    },
    onError: () => setFeedback("Não foi possível atualizar essa preferência."),
  });
  const send = useMutation({
    mutationFn: () =>
      repository.sendAnonymousNote(userId, receiverId, sanitizeRomanticText(content, 280)),
    onSuccess: async () => {
      setContent("");
      setReceiverId("");
      setFeedback("Recado enviado sem revelar sua identidade ao destinatário.");
      await refresh();
    },
    onError: () =>
      setFeedback("O recado não foi enviado. Verifique elegibilidade, limite e consentimento."),
  });
  const action = useMutation({
    mutationFn: ({
      messageId,
      noteAction,
    }: {
      messageId: string;
      noteAction: Parameters<RomanticContextRepository["actOnAnonymousNote"]>[2];
    }) => repository.actOnAnonymousNote(userId, messageId, noteAction),
    onSuccess: async (_data, variables) => {
      setResponse("");
      setFeedback(
        variables.noteAction.kind === "request-reveal"
          ? "Seu pedido foi registrado. A identidade só aparece com consentimento mútuo."
          : "Ação registrada com segurança.",
      );
      await refresh();
    },
    onError: () => setFeedback("Essa ação não está disponível no estado atual do recado."),
  });

  if (center.isPending) {
    return (
      <V2Surface className="vdn-v2-romantic-state">
        <V2LoadingIndicator label="Carregando recados anônimos" />
      </V2Surface>
    );
  }
  if (center.isError || !center.data) {
    return (
      <V2Surface className="vdn-v2-romantic-state" role="alert">
        <ShieldCheck aria-hidden="true" />
        <V2Heading level={2} size="small">
          Recados indisponíveis
        </V2Heading>
        <V2Text tone="muted">O recurso permaneceu fechado e nenhum conteúdo foi enviado.</V2Text>
        <V2Button variant="secondary" onClick={() => void center.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <section className="vdn-v2-romantic" aria-labelledby="vdn-v2-anonymous-title">
      <p className="vdn-v2-romantic__announcement" role="status" aria-live="polite">
        {feedback}
      </p>
      <V2Surface className="vdn-v2-romantic__hero" elevation="one">
        <ShieldCheck aria-hidden="true" />
        <div>
          <V2StatusBadge tone="brand">Somente no Modo Namoro</V2StatusBadge>
          <V2Heading id="vdn-v2-anonymous-title" level={2} size="medium">
            Recados anônimos
          </V2Heading>
          <V2Text tone="secondary">
            Anônimo para participantes, nunca para moderação. O padrão é desligado e a revelação
            exige consentimento mútuo.
          </V2Text>
        </div>
      </V2Surface>

      <V2Surface className="vdn-v2-romantic__section">
        <div className="vdn-v2-romantic__setting">
          <div>
            <V2Heading level={3} size="small">
              Receber recados anônimos?
            </V2Heading>
            <V2Text tone="muted">
              Desligar impede novos recados sem apagar recebidos, respostas ou denúncias.
            </V2Text>
          </div>
          <V2Button
            variant={center.data.accepting ? "outline" : "primary"}
            loading={optIn.isPending}
            aria-pressed={center.data.accepting}
            onClick={() => optIn.mutate(!center.data.accepting)}
          >
            {center.data.accepting ? "Desativar recebimento" : "Ativar voluntariamente"}
          </V2Button>
        </div>
        <V2Text variant="caption" tone="muted">
          Hoje: {center.data.dailyUsed}/{center.data.dailyFree} gratuitos · {center.data.extras}{" "}
          extras preservados
        </V2Text>
      </V2Surface>

      <V2Surface className="vdn-v2-romantic__section">
        <V2Heading level={3} size="small">
          Enviar um recado
        </V2Heading>
        {center.data.recipients.length === 0 ? (
          <V2Text tone="muted">
            Nenhum participante elegível com recebimento ativo está disponível agora.
          </V2Text>
        ) : (
          <>
            <label>
              <span>Destinatário elegível</span>
              <select
                value={receiverId}
                onChange={(event) => setReceiverId(event.currentTarget.value)}
              >
                <option value="">Escolha uma pessoa</option>
                {center.data.recipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.displayName}
                  </option>
                ))}
              </select>
            </label>
            <V2TextArea
              label="Recado"
              value={content}
              maxLength={280}
              description="Não inclua telefone, e-mail ou outra forma de identificação."
              onChange={(event) => setContent(event.currentTarget.value)}
            />
            <V2Button
              leadingIcon={<Send />}
              loading={send.isPending}
              disabled={!receiverId || !sanitizeRomanticText(content, 280)}
              onClick={() => send.mutate()}
            >
              Enviar recado
            </V2Button>
          </>
        )}
      </V2Surface>

      <div className="vdn-v2-romantic__notes">
        {center.data.notes.length === 0 ? (
          <V2Surface className="vdn-v2-romantic-state">
            <V2Heading level={3} size="small">
              Nenhum recado
            </V2Heading>
            <V2Text tone="muted">Quando houver atividade consentida, ela aparecerá aqui.</V2Text>
          </V2Surface>
        ) : (
          center.data.notes.map((note) => (
            <V2Surface key={note.id} as="article" className="vdn-v2-romantic-note">
              <div className="vdn-v2-romantic-note__meta">
                <V2StatusBadge tone="neutral">
                  {note.direction === "incoming" ? "Recebido" : "Enviado"}
                </V2StatusBadge>
                <V2StatusBadge tone={note.state === "revealed" ? "success" : "neutral"}>
                  {note.state}
                </V2StatusBadge>
              </div>
              <V2Text>{note.content}</V2Text>
              {note.reply ? (
                <V2Text tone="secondary">
                  <Reply aria-hidden="true" /> {note.reply}
                </V2Text>
              ) : null}
              {note.state === "revealed" && note.matchId ? (
                <V2Button leadingIcon={<Eye />} onClick={onOpenConversations}>
                  Abrir conversa revelada
                </V2Button>
              ) : (
                <div className="vdn-v2-romantic-note__actions">
                  {note.direction === "incoming" &&
                  ["pending", "hint_sent"].includes(note.state) ? (
                    <>
                      <V2TextArea
                        label="Resposta"
                        value={response}
                        maxLength={280}
                        onChange={(event) => setResponse(event.currentTarget.value)}
                      />
                      <V2Button
                        size="small"
                        disabled={!sanitizeRomanticText(response, 280)}
                        onClick={() =>
                          action.mutate({
                            messageId: note.id,
                            noteAction: {
                              kind: "reply",
                              content: sanitizeRomanticText(response, 280),
                            },
                          })
                        }
                      >
                        Responder
                      </V2Button>
                      {note.hintCount < 2 ? (
                        <V2Button
                          size="small"
                          variant="outline"
                          leadingIcon={<Lightbulb />}
                          onClick={() =>
                            action.mutate({
                              messageId: note.id,
                              noteAction: { kind: "request-hint" },
                            })
                          }
                        >
                          Pedir dica ({note.hintCount}/2)
                        </V2Button>
                      ) : null}
                    </>
                  ) : null}
                  {note.direction === "outgoing" && note.state === "hint_requested"
                    ? HINTS.map((hint) => (
                        <V2Button
                          key={hint.text}
                          size="small"
                          variant="outline"
                          onClick={() =>
                            action.mutate({
                              messageId: note.id,
                              noteAction: {
                                kind: "send-hint",
                                category: hint.category,
                                content: hint.text,
                              },
                            })
                          }
                        >
                          {hint.text}
                        </V2Button>
                      ))
                    : null}
                  {["replied", "hint_sent", "reveal_requested"].includes(note.state) ? (
                    <V2Button
                      size="small"
                      variant="outline"
                      leadingIcon={<Eye />}
                      onClick={() =>
                        action.mutate({
                          messageId: note.id,
                          noteAction: { kind: "request-reveal" },
                        })
                      }
                    >
                      Solicitar revelação
                    </V2Button>
                  ) : null}
                  {note.direction === "incoming" ? (
                    <>
                      <V2Button
                        size="small"
                        variant="ghost"
                        leadingIcon={<UserRoundX />}
                        onClick={() =>
                          action.mutate({
                            messageId: note.id,
                            noteAction: { kind: "ignore" },
                          })
                        }
                      >
                        Ignorar
                      </V2Button>
                      <V2Button
                        size="small"
                        variant="ghost"
                        leadingIcon={<Flag />}
                        onClick={() =>
                          action.mutate({
                            messageId: note.id,
                            noteAction: { kind: "report", reason: "inappropriate_content" },
                          })
                        }
                      >
                        Denunciar
                      </V2Button>
                    </>
                  ) : null}
                </div>
              )}
            </V2Surface>
          ))
        )}
      </div>
    </section>
  );
}
