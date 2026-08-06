import { Link } from "@tanstack/react-router";

import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { ConversationItem } from "@/hooks/useConversationsList";

export type NativeConversationRowProps = {
  item: ConversationItem;
};

export function NativeConversationRow({ item }: NativeConversationRowProps) {
  const firstName = item.partner.full_name.split(" ")[0];

  return (
    <Link
      to="/conversas/$matchId"
      params={{ matchId: item.matchId }}
      className="group flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`${item.unread ? "Não lida: " : ""}Conversa com ${firstName}`}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        <DecoratedAvatar
          photoUrl={item.partner.photo_url}
          fallback={item.partner.full_name.charAt(0)}
          size={44}
          frameId={item.partner.equipped_frame_id ?? null}
          auraId={item.partner.equipped_aura_id ?? null}
          isCommitted={item.partner.committed}
        />
        <span className="absolute bottom-0 right-0">
          <OnlineDot userId={item.partner.id} size="sm" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold">
            <span className="truncate">{firstName}</span>
            {item.partner.verified && <VerifiedBadge size="sm" />}
          </span>
          <time dateTime={item.lastAt} className="shrink-0 text-[11px] text-muted-foreground">
            {new Date(item.lastAt).toLocaleDateString("pt-BR")}
          </time>
        </span>
        <UserBadges userId={item.partner.id} size="xs" max={2} className="mt-0.5" />
        <span
          className={`mt-0.5 block truncate text-sm ${
            item.unread ? "font-semibold text-foreground" : "text-muted-foreground"
          }`}
        >
          {item.lastMessage ?? "Diga olá"}
        </span>
      </span>
      {item.unread && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="sr-only">Mensagem não lida</span>
        </span>
      )}
    </Link>
  );
}
