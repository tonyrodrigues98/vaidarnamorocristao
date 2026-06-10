import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";

/**
 * Shared, in-memory cache for the user's conversation list. Used by
 * /conversas (full list page) and ConversationDrawer (in-chat shortcut)
 * so the drawer opens instantly with cached data while a background
 * refresh keeps it fresh. A single realtime subscription per user is
 * shared between consumers via refcount.
 */
export type ConversationItem = {
  matchId: string;
  partner: {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
    verified?: boolean | null;
    equipped_frame_id?: string | null;
    equipped_aura_id?: string | null;
    committed?: boolean;
  };
  lastMessage: string | null;
  lastAt: string;
  unread: boolean;
};

type State = {
  items: ConversationItem[];
  commitment: RelationshipCommitment | null;
  loadedAt: number;
  loading: boolean;
};

const STALE_MS = 30_000;

const state: Record<string, State> = {};
const listeners: Record<string, Set<() => void>> = {};
const inflight: Record<string, Promise<void> | null> = {};
const channels: Record<string, { ch: ReturnType<typeof supabase.channel>; refs: number }> = {};
const debouncers: Record<string, ReturnType<typeof setTimeout> | null> = {};

function snapshot(uid: string): State {
  if (!state[uid])
    state[uid] = { items: [], commitment: null, loadedAt: 0, loading: false };
  return state[uid];
}

function emit(uid: string) {
  const set = listeners[uid];
  if (set) set.forEach((l) => l());
}

async function loadFor(userId: string): Promise<void> {
  if (inflight[userId]) return inflight[userId]!;
  const cur = snapshot(userId);
  cur.loading = true;
  emit(userId);
  const p = (async () => {
    const commitment = await getActiveCommitmentByUser(userId);
    if (commitment) {
      state[userId] = {
        items: [],
        commitment,
        loadedAt: Date.now(),
        loading: false,
      };
      emit(userId);
      return;
    }
    const { data: bl } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    const blockedSet = new Set((bl ?? []).map((b) => b.blocked_id as string));
    const { data: matches } = await supabase
      .from("matches")
      .select("id, user_a, user_b, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("created_at", { ascending: false });
    const visible = (matches ?? []).filter((m) => {
      const pid = m.user_a === userId ? m.user_b : m.user_a;
      return !blockedSet.has(pid);
    });
    if (!visible.length) {
      state[userId] = { items: [], commitment: null, loadedAt: Date.now(), loading: false };
      emit(userId);
      return;
    }
    const partnerIds = visible.map((m) => (m.user_a === userId ? m.user_b : m.user_a));
    const [{ data: profs }, { data: commitments }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,full_name,photo_url,city,state,verified,equipped_frame_id,equipped_aura_id",
        )
        .in("id", partnerIds),
      supabase
        .from("relationship_commitments")
        .select("user_a,user_b,status")
        .eq("status", "active"),
    ]);
    const committedUsers = new Set<string>();
    (commitments ?? []).forEach((c) => {
      committedUsers.add(c.user_a);
      committedUsers.add(c.user_b);
    });
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
    const items: ConversationItem[] = await Promise.all(
      visible.map(async (m) => {
        const pid = m.user_a === userId ? m.user_b : m.user_a;
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, sender_id, created_at, read_at")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const last = msgs?.[0];
        const p = profMap.get(pid);
        return {
          matchId: m.id,
          partner: {
            id: pid,
            full_name: p?.full_name ?? "—",
            photo_url: p?.photo_url ?? null,
            city: p?.city ?? "",
            state: p?.state ?? "",
            verified: p?.verified ?? null,
            equipped_frame_id: p?.equipped_frame_id ?? null,
            equipped_aura_id: p?.equipped_aura_id ?? null,
            committed: committedUsers.has(pid),
          },
          lastMessage: last?.content ?? null,
          lastAt: last?.created_at ?? m.created_at,
          unread: !!last && last.sender_id !== userId && !last.read_at,
        };
      }),
    );
    items.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    state[userId] = {
      items,
      commitment: null,
      loadedAt: Date.now(),
      loading: false,
    };
    emit(userId);
  })()
    .catch(() => {
      const s = snapshot(userId);
      s.loading = false;
      emit(userId);
    })
    .finally(() => {
      inflight[userId] = null;
    });
  inflight[userId] = p;
  return p;
}

function scheduleRefresh(userId: string) {
  if (debouncers[userId]) clearTimeout(debouncers[userId]!);
  debouncers[userId] = setTimeout(() => {
    void loadFor(userId);
  }, 400);
}

function subscribe(userId: string) {
  const entry = channels[userId];
  if (entry) {
    entry.refs += 1;
    return;
  }
  const ch = supabase
    .channel(`conv-list-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      () => scheduleRefresh(userId),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matches" },
      () => scheduleRefresh(userId),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "relationship_commitments" },
      () => scheduleRefresh(userId),
    )
    .subscribe();
  channels[userId] = { ch, refs: 1 };
}

function unsubscribe(userId: string) {
  const entry = channels[userId];
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    supabase.removeChannel(entry.ch);
    delete channels[userId];
  }
}

export function useConversationsList(userId: string | undefined) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!userId) return;
    const set = (listeners[userId] ??= new Set<() => void>());
    const listener = () => setTick((t) => t + 1);
    set.add(listener);
    subscribe(userId);
    const cur = snapshot(userId);
    if (Date.now() - cur.loadedAt > STALE_MS || cur.items.length === 0) {
      void loadFor(userId);
    }
    return () => {
      set.delete(listener);
      unsubscribe(userId);
    };
  }, [userId]);
  const s = userId
    ? snapshot(userId)
    : { items: [], commitment: null, loadedAt: 0, loading: false };
  return {
    items: s.items,
    commitment: s.commitment,
    loading: s.loading && s.items.length === 0,
    isRefreshing: s.loading && s.items.length > 0,
    loadedAt: s.loadedAt,
    refetch: () => (userId ? loadFor(userId) : Promise.resolve()),
  };
}