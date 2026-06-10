import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  actor_id: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
  image_url?: string | null;
};

export function useNotifications(limit = 50) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));

  // Base key shared across all instances of the same user so realtime/mutations
  // can update Header (limit=20) and the full page (limit=100) cache in lockstep.
  const baseKey = ["notifications", userId] as const;
  const queryKey = [...baseKey, limit] as const;

  const query = useQuery({
    queryKey,
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });

  const items = query.data ?? [];

  // Realtime: mutate every cached limit variant for this user, no refetches.
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`notifications-${userId}-${instanceIdRef.current}`);
    ch.on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload: {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        new: AppNotification | Record<string, never>;
        old: { id?: string } | Record<string, never>;
      }) => {
        const updater = (prev: AppNotification[] | undefined): AppNotification[] => {
          const list = prev ?? [];
          if (payload.eventType === "INSERT") {
            const next = payload.new as AppNotification;
            if (list.some((n) => n.id === next.id)) return list;
            return [next, ...list];
          }
          if (payload.eventType === "UPDATE") {
            const next = payload.new as AppNotification;
            return list.map((n) => (n.id === next.id ? { ...n, ...next } : n));
          }
          // DELETE
          const oldId = (payload.old as { id?: string }).id;
          if (!oldId) return list;
          return list.filter((n) => n.id !== oldId);
        };
        qc.setQueriesData<AppNotification[]>(
          {
            predicate: (q) => {
              const k = q.queryKey;
              return (
                Array.isArray(k) &&
                k[0] === "notifications" &&
                k[1] === userId
              );
            },
          },
          (prev) => updater(prev),
        );
      },
    );
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  const unread = items.filter((n) => !n.read_at).length;

  const patchCache = useCallback(
    (mutate: (prev: AppNotification[]) => AppNotification[]) => {
      if (!userId) return;
      qc.setQueriesData<AppNotification[]>(
        {
          predicate: (q) => {
            const k = q.queryKey;
            return Array.isArray(k) && k[0] === "notifications" && k[1] === userId;
          },
        },
        (prev) => mutate(prev ?? []),
      );
    },
    [userId, qc],
  );

  const markRead = useCallback(
    async (id: string) => {
      const nowIso = new Date().toISOString();
      patchCache((list) => list.map((n) => (n.id === id ? { ...n, read_at: nowIso } : n)));
      await supabase.from("notifications").update({ read_at: nowIso }).eq("id", id);
    },
    [patchCache],
  );

  const markAllRead = useCallback(async () => {
    const nowIso = new Date().toISOString();
    patchCache((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: nowIso })));
    await supabase.rpc("mark_all_notifications_read");
  }, [patchCache]);

  const remove = useCallback(
    async (id: string) => {
      patchCache((list) => list.filter((n) => n.id !== id));
      await supabase.from("notifications").delete().eq("id", id);
    },
    [patchCache],
  );

  const reload = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    items,
    unread,
    loading: query.isLoading,
    markRead,
    markAllRead,
    remove,
    reload,
  };
}
