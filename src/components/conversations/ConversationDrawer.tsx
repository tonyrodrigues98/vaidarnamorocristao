import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, Search, UsersRound } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { OnlineDot } from "@/components/OnlineDot";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/lib/auth";
import { useConversationsList, type ConversationItem } from "@/hooks/useConversationsList";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMatchId?: string;
  currentType?: "private" | "community";
};

const COMMUNITY_KEYWORDS = ["comunidade", "geral", "chat", "comunidade geral", "global"];

/**
 * Reusable drawer that lists the user's conversations with the global
 * community pinned at the top. Loads its own data lazily when opened.
 */
export function ConversationDrawer({
  open,
  onOpenChange,
  currentMatchId,
  currentType,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { items: rawItems, commitment, loading } = useConversationsList(user?.id);

  // If user is in an active commitment, only show that match.
  const items = useMemo(
    () =>
      commitment
        ? rawItems.filter((i) => i.matchId === commitment.match_id)
        : rawItems,
    [rawItems, commitment],
  );

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q ? items.filter((i) => i.partner.full_name.toLowerCase().includes(q)) : items,
    [items, q],
  );
  const showCommunity = !q || COMMUNITY_KEYWORDS.some((k) => k.includes(q) || q.includes(k));
  const communityActive = currentType === "community";

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const goCommunity = useCallback(() => {
    if (communityActive) {
      close();
      return;
    }
    close();
    void navigate({ to: "/conversas/comunidade" });
  }, [communityActive, close, navigate]);

  const goPrivate = useCallback(
    (matchId: string) => {
      if (currentType === "private" && matchId === currentMatchId) {
        close();
        return;
      }
      close();
      void navigate({ to: "/conversas/$matchId", params: { matchId } });
    },
    [close, currentMatchId, currentType, navigate],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border px-4 pb-3 pt-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversas
          </SheetTitle>
        </SheetHeader>
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="mobile-chat-scroll flex-1 overflow-y-auto p-3 space-y-2">
          {showCommunity && (
            <button
              type="button"
              onClick={goCommunity}
              className={`tap flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                communityActive
                  ? "border-primary/40 bg-primary/10"
                  : "border-[var(--rose)]/15 bg-gradient-to-br from-[oklch(0.98_0.02_25)] to-[oklch(0.97_0.03_20)] hover:bg-muted/40 dark:from-[oklch(0.22_0.04_20)] dark:to-[oklch(0.18_0.03_20)]"
              } w-full text-left`}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rose)] to-[oklch(0.72_0.15_30)] text-white shadow-sm">
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">Comunidade Geral</p>
                  <span className="shrink-0 rounded-full bg-[var(--rose)]/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                    Fixado
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  Chat global do VaiDarNamoro
                </p>
              </div>
            </button>
          )}

          {loading && items.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : filtered.length === 0 && !showCommunity ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              <MessageCircle className="mb-3 h-8 w-8 text-muted-foreground/60" />
              Nenhuma conversa encontrada.
            </div>
          ) : filtered.length === 0 ? null : (
            filtered.map((item) => (
              <ConversationRow
                key={item.matchId}
                item={item}
                active={currentType === "private" && item.matchId === currentMatchId}
                onSelect={goPrivate}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type RowProps = {
  item: ConversationItem;
  active: boolean;
  onSelect: (matchId: string) => void;
};

const ConversationRow = memo(function ConversationRow({ item, active, onSelect }: RowProps) {
  const handle = useCallback(() => onSelect(item.matchId), [item.matchId, onSelect]);
  return (
    <button
      type="button"
      onClick={handle}
      className={`tap flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
        active
          ? "border-primary/40 bg-primary/10"
          : "border-transparent hover:border-border hover:bg-muted/50"
      }`}
    >
      <div className="relative shrink-0">
        <DecoratedAvatar
          photoUrl={item.partner.photo_url}
          fallback={item.partner.full_name?.charAt(0) ?? "?"}
          size={36}
          frameId={item.partner.equipped_frame_id ?? null}
          auraId={item.partner.equipped_aura_id ?? null}
        />
        <OnlineDot userId={item.partner.id} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{item.partner.full_name}</p>
          {item.partner.verified && <VerifiedBadge size="sm" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {item.lastMessage ?? "Nenhuma mensagem ainda"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-muted-foreground">
          {new Date(item.lastAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        {item.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
      </div>
    </button>
  );
});