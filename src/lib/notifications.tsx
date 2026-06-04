import { useEffect, useState, useCallback, useRef } from "react";
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
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    setItems((data ?? []) as AppNotification[]);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`notifications-${user.id}-${instanceIdRef.current}`);
    ch.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
      () => load(),
    );
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  const unread = items.filter((n) => !n.read_at).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  };
  const markAllRead = async () => {
    await supabase.rpc("mark_all_notifications_read");
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
  };

  return { items, unread, loading, markRead, markAllRead, remove, reload: load };
}
