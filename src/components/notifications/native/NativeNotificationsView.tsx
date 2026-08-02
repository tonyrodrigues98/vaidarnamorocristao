import { Bell, BellOff, BellRing, CheckCheck } from "lucide-react";

import { EnableNotificationsCard } from "@/components/EnableNotificationsCard";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { NotificationSkeleton } from "@/components/ui/AppSkeletons";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { OfflineState } from "@/components/ui/OfflineState";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import type { AppNotification } from "@/lib/notifications";

import { NativeNotificationRow } from "./NativeNotificationRow";

export type NativeNotificationGroup = {
  label: string;
  items: AppNotification[];
};

export type NativeNotificationsViewProps = {
  visibleCount: number;
  unreadCount: number;
  loading: boolean;
  isOnline: boolean;
  markingAll: boolean;
  filter: "all" | "unread";
  groups: NativeNotificationGroup[];
  onFilterChange(filter: "all" | "unread"): void;
  onMarkAll(): void;
  onOpen(notification: AppNotification): void;
  onDelete(notification: AppNotification): void;
  onRefresh(): Promise<void> | void;
};

export function NativeNotificationsView({
  visibleCount,
  unreadCount,
  loading,
  isOnline,
  markingAll,
  filter,
  groups,
  onFilterChange,
  onMarkAll,
  onOpen,
  onDelete,
  onRefresh,
}: NativeNotificationsViewProps) {
  const filteredCount = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <PullToRefresh onRefresh={onRefresh} disabled={!isOnline}>
      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe suas atividades recentes.</p>
        </header>

        {!isOnline && visibleCount > 0 ? (
          <StaleDataNotice message="Você está offline. Mostrando atividades carregadas anteriormente." />
        ) : null}

        <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            {unreadCount > 0 ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-foreground">
              {unreadCount > 0
                ? `${unreadCount} novidade${unreadCount > 1 ? "s" : ""}`
                : "Tudo em dia"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Contagens baseadas nas atividades reais.
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAll}
              disabled={markingAll || !isOnline}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Marcar todas
            </button>
          ) : null}
        </section>

        <div className="flex gap-2" aria-label="Filtros de notificações">
          {(
            [
              ["all", "Todas", visibleCount],
              ["unread", "Não lidas", unreadCount],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => onFilterChange(id)}
              className="min-h-11 rounded-full border border-border px-4 text-sm font-medium data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
              data-active={filter === id}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <EnableNotificationsCard />

        {loading ? (
          <NotificationSkeleton rows={6} />
        ) : visibleCount === 0 && !isOnline ? (
          <OfflineState actionLabel="Tentar novamente" onAction={() => onRefresh()} />
        ) : visibleCount === 0 ? (
          <AppEmptyState
            icon={<BellOff className="h-5 w-5" />}
            title="Nenhuma notificação por enquanto"
            description="Quando houver uma atividade, ela aparecerá aqui."
            actionLabel="Explorar"
            actionTo="/explorar"
          />
        ) : filteredCount === 0 ? (
          <AppEmptyState
            icon={<CheckCheck className="h-5 w-5" />}
            title="Tudo em dia"
            description="Você já viu todas as suas novidades."
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) =>
              group.items.length > 0 ? (
                <section key={group.label}>
                  <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {group.label}
                  </h2>
                  <ul className="space-y-2" aria-live="polite">
                    {group.items.map((notification) => (
                      <NativeNotificationRow
                        key={notification.id}
                        notification={notification}
                        onOpen={onOpen}
                        onDelete={onDelete}
                      />
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
          </div>
        )}
      </main>
    </PullToRefresh>
  );
}
