import { Link } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";

export function NativeCommunityConversationRow() {
  return (
    <Link
      to="/conversas/comunidade"
      className="group flex min-h-16 items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <UsersRound className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">Chat geral</span>
          <span className="shrink-0 rounded-full border border-primary/30 px-2 py-0.5 text-[11px] font-semibold text-primary">
            Fixado
          </span>
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          Conversa coletiva da comunidade
        </span>
      </span>
    </Link>
  );
}
