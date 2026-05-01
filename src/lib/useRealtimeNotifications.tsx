import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Subscribes to realtime events and shows toasts for:
 *  - New interest received
 *  - New match
 *  - New message in any of the user's matches
 * Mounted once at the app root.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;
    mountedAt.current = Date.now();
    let matchIds = new Set<string>();

    const refreshMatches = async () => {
      const { data } = await supabase
        .from("matches")
        .select("id")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      matchIds = new Set((data ?? []).map((m) => m.id));
    };
    refreshMatches();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const senderId = (payload.new as { sender_id: string }).sender_id;
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", senderId)
            .maybeSingle();
          toast("✨ Novo interesse!", {
            description: `${prof?.full_name?.split(" ")[0] ?? "Alguém"} demonstrou interesse em você.`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        async (payload) => {
          const m = payload.new as { id: string; user_a: string; user_b: string };
          if (m.user_a !== user.id && m.user_b !== user.id) return;
          const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", partnerId)
            .maybeSingle();
          toast.success("💗 É um match!", {
            description: `Você e ${prof?.full_name?.split(" ")[0] ?? "alguém"} podem conversar agora.`,
          });
          refreshMatches();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const m = payload.new as { match_id: string; sender_id: string; content: string };
          if (m.sender_id === user.id) return;
          if (!matchIds.has(m.match_id)) {
            // It might be a brand new match — refresh and bail
            await refreshMatches();
            if (!matchIds.has(m.match_id)) return;
          }
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", m.sender_id)
            .maybeSingle();
          toast("💬 Nova mensagem", {
            description: `${prof?.full_name?.split(" ")[0] ?? "Alguém"}: ${m.content.slice(0, 60)}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}

export function NotificationsBridge() {
  useRealtimeNotifications();
  return null;
}