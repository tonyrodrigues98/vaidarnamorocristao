import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  BellRing,
  Blocks,
  LifeBuoy,
  MessageSquareWarning,
  ShieldCheck,
  VolumeX,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import {
  canDisablePreference,
  type NotificationPreference,
  type TrustCenterRepository,
} from "./contracts";

type TrustTab = "notifications" | "preferences" | "trust" | "support";

export function V2TrustCenter({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: TrustCenterRepository;
}) {
  const [tab, setTab] = useState<TrustTab>("notifications");
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["v2", "trust-center", userId] as const, [userId]);
  const center = useQuery({
    queryKey,
    queryFn: () => repository.loadCenter(userId),
    staleTime: 15_000,
  });
  const markRead = useMutation({
    mutationFn: (id: string) => repository.markRead(userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const savePreference = useMutation({
    mutationFn: (preference: NotificationPreference) =>
      repository.savePreference(userId, preference),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (center.isPending) {
    return (
      <V2Surface className="vdn-v2-trust__state" aria-live="polite">
        <V2LoadingIndicator label="Carregando sua Central" />
      </V2Surface>
    );
  }
  if (center.isError || !center.data) {
    return (
      <V2Surface className="vdn-v2-trust__state" role="alert">
        <ShieldCheck aria-hidden="true" />
        <V2Heading level={2} size="small">
          Central temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Suas preferências, bloqueios e tickets permanecem intactos.</V2Text>
        <V2Button variant="secondary" onClick={() => void center.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = center.data;
  return (
    <div className="vdn-v2-trust" aria-labelledby="vdn-v2-trust-title">
      <V2Surface className="vdn-v2-trust__hero" elevation="one">
        <ShieldCheck aria-hidden="true" />
        <div>
          <V2Text variant="caption" tone="muted">
            Notificações, privacidade e atendimento
          </V2Text>
          <V2Heading id="vdn-v2-trust-title" level={2} size="medium">
            Sua Central
          </V2Heading>
          <V2Text tone="muted">
            Controle o que recebe e encontre ajuda sem misturar regras dos domínios.
          </V2Text>
        </div>
        <V2StatusBadge tone={snapshot.unreadCount ? "info" : "neutral"}>
          {snapshot.unreadCount} não lidas
        </V2StatusBadge>
      </V2Surface>

      <div className="vdn-v2-trust__tabs" role="tablist" aria-label="Sua Central">
        {(
          [
            ["notifications", "Notificações", BellRing],
            ["preferences", "Preferências", Bell],
            ["trust", "Confiança", ShieldCheck],
            ["support", "Suporte", LifeBuoy],
          ] as const
        ).map(([value, label, Icon]) => (
          <V2Button
            key={value}
            role="tab"
            size="small"
            variant={tab === value ? "secondary" : "ghost"}
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            <Icon aria-hidden="true" />
            {label}
          </V2Button>
        ))}
      </div>

      {tab === "notifications" ? (
        <section className="vdn-v2-trust__notifications" aria-label="Notificações recentes">
          {snapshot.notifications.length ? (
            snapshot.notifications.map((notification) => (
              <V2Surface key={notification.id} as="article" elevation="one">
                <div>
                  <V2StatusBadge tone={notification.readAt ? "neutral" : "info"}>
                    {notification.category}
                  </V2StatusBadge>
                  <V2Heading level={3} size="small">
                    {notification.title}
                  </V2Heading>
                  <V2Text tone="muted">
                    {notification.sensitive
                      ? "Abra para ver esta atualização com segurança."
                      : notification.body}
                  </V2Text>
                </div>
                <div>
                  {!notification.readAt ? (
                    <V2Button
                      size="small"
                      variant="ghost"
                      loading={markRead.isPending && markRead.variables === notification.id}
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Marcar como lida
                    </V2Button>
                  ) : null}
                  {notification.destination ? (
                    <V2Button asChild size="small" variant="outline">
                      <a href={notification.destination}>Abrir</a>
                    </V2Button>
                  ) : null}
                </div>
              </V2Surface>
            ))
          ) : (
            <V2Surface className="vdn-v2-trust__state">
              <Bell aria-hidden="true" />
              <V2Text tone="muted">Nenhuma notificação recente.</V2Text>
            </V2Surface>
          )}
        </section>
      ) : null}

      {tab === "preferences" ? (
        <section className="vdn-v2-trust__preferences" aria-label="Preferências por categoria">
          {snapshot.preferences.map((preference) => {
            const canDisable = canDisablePreference(preference);
            return (
              <V2Surface key={preference.category} elevation="one">
                <div>
                  <V2Text variant="label">{preference.category}</V2Text>
                  <V2Text tone="muted">
                    {preference.essential
                      ? "Avisos essenciais permanecem no inbox."
                      : "Escolha os canais usados para esta categoria."}
                  </V2Text>
                </div>
                <V2Button
                  size="small"
                  variant={preference.pushEnabled ? "secondary" : "outline"}
                  disabled={!canDisable && preference.pushEnabled}
                  loading={
                    savePreference.isPending &&
                    savePreference.variables?.category === preference.category
                  }
                  onClick={() =>
                    savePreference.mutate({
                      ...preference,
                      pushEnabled: !preference.pushEnabled,
                    })
                  }
                >
                  {preference.pushEnabled ? "Push ligado" : "Push desligado"}
                </V2Button>
              </V2Surface>
            );
          })}
        </section>
      ) : null}

      {tab === "trust" ? (
        <div className="vdn-v2-trust__grid">
          <V2Surface elevation="one">
            <Blocks aria-hidden="true" />
            <V2Heading level={3} size="small">
              Bloqueios globais
            </V2Heading>
            <V2Text tone="muted">{snapshot.blockedCount} pessoas bloqueadas.</V2Text>
            <V2Button asChild variant="outline">
              <a href="/bloqueados">Gerenciar bloqueios</a>
            </V2Button>
          </V2Surface>
          <V2Surface elevation="one">
            <VolumeX aria-hidden="true" />
            <V2Heading level={3} size="small">
              Silenciamentos
            </V2Heading>
            <V2Text tone="muted">
              {snapshot.mutedCount} silenciamentos. Silenciar não substitui bloquear.
            </V2Text>
          </V2Surface>
          <V2Surface elevation="one">
            <BadgeCheck aria-hidden="true" />
            <V2Heading level={3} size="small">
              Verificação de foto
            </V2Heading>
            <V2Text tone="muted">Estado: {snapshot.photoVerification}.</V2Text>
            <V2Button asChild variant="outline">
              <a href="/verificacao">Abrir verificação</a>
            </V2Button>
          </V2Surface>
          <V2Surface elevation="one">
            <MessageSquareWarning aria-hidden="true" />
            <V2Heading level={3} size="small">
              Denúncia e recurso
            </V2Heading>
            <V2Text tone="muted">
              Denunciar abre um caso; não bloqueia automaticamente e preserva evidências restritas.
            </V2Text>
          </V2Surface>
        </div>
      ) : null}

      {tab === "support" ? (
        <section className="vdn-v2-trust__support" aria-label="Atendimento">
          <V2Surface elevation="one">
            <LifeBuoy aria-hidden="true" />
            <div>
              <V2Heading level={3} size="small">
                Ajuda antes de abrir um ticket
              </V2Heading>
              <V2Text tone="muted">
                Consulte respostas e, se necessário, envie um pedido contextual pelo fluxo
                preservado.
              </V2Text>
            </div>
            <V2Button asChild variant="outline">
              <a href="/suporte/ajuda">Buscar ajuda</a>
            </V2Button>
            <V2Button asChild variant="secondary">
              <a href="/suporte">Abrir atendimento</a>
            </V2Button>
          </V2Surface>
          {snapshot.supportTickets.map((ticket) => (
            <V2Surface key={ticket.id} elevation="one">
              <div>
                <V2StatusBadge tone="neutral">{ticket.status}</V2StatusBadge>
                <V2Text variant="label">{ticket.title}</V2Text>
                <V2Text tone="muted">{ticket.category}</V2Text>
              </div>
              <V2Button asChild variant="ghost" size="small">
                <a href={`/suporte/${ticket.id}`}>Ver protocolo</a>
              </V2Button>
            </V2Surface>
          ))}
        </section>
      ) : null}
    </div>
  );
}
