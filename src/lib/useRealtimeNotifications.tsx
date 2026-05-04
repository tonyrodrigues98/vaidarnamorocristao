import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@tanstack/react-router";

/**
 * Subscribes to realtime events and shows toasts for:
 *  - New interest received
 *  - New match
 *  - New message in any of the user's matches
 * Mounted once at the app root.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const router = useRouter();
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
          toast("✨ + Interesse", {
            description: `${prof?.full_name?.split(" ")[0] ?? "Alguém"} demonstrou interesse em você.`,
            action: {
              label: "Ver",
              onClick: () => router.navigate({ to: "/interesses" }),
            },
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profile_views", filter: `viewed_id=eq.${user.id}` },
        async (payload) => {
          const v = payload.new as { viewer_id: string };
          // Notify only the first time this viewer appears in the current session
          const key = `pv-notif:${user.id}:${v.viewer_id}`;
          if (typeof window !== "undefined") {
            if (window.sessionStorage.getItem(key)) return;
            window.sessionStorage.setItem(key, "1");
          }
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", v.viewer_id)
            .maybeSingle();
          toast("👀 Visualizou seu perfil", {
            description: `${prof?.full_name?.split(" ")[0] ?? "Alguém"} acabou de ver seu perfil.`,
            action: {
              label: "Ver dashboard",
              onClick: () => router.navigate({ to: "/dashboard" }),
            },
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
            action: {
              label: "Conversar",
              onClick: () => router.navigate({ to: "/conversas/$matchId", params: { matchId: m.id } }),
            },
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
            action: {
              label: "Abrir",
              onClick: () =>
                router.navigate({ to: "/conversas/$matchId", params: { matchId: m.match_id } }),
            },
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "daily_posts" },
        (payload) => {
          const p = payload.new as { published: boolean; kind: string; title: string };
          if (!p.published) return;
          const label = p.kind === "devotional" ? "📖 Novo devocional" : "📰 Nova notícia";
          toast(label, {
            description: p.title,
            action: { label: "Ler", onClick: () => router.navigate({ to: "/noticias" }) },
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        async (payload) => {
          const m = payload.new as { sender_id: string; content: string };
          if (m.sender_id === user.id) return;
          // Suppress when the user is already on the community page.
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/comunidade")) return;
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", m.sender_id)
            .maybeSingle();
          toast("🌐 Comunidade", {
            description: `${prof?.full_name?.split(" ")[0] ?? "Alguém"}: ${m.content.slice(0, 60)}`,
            action: { label: "Abrir", onClick: () => router.navigate({ to: "/comunidade" }) },
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "verification_requests", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { status: string; admin_notes: string | null };
          const o = payload.old as { status: string };
          if (n.status === o.status) return;
          if (n.status === "approved") {
            toast.success("✔ Verificação aprovada!", {
              description: "Seu perfil agora exibe o selo de verificado.",
              action: { label: "Ver perfil", onClick: () => router.navigate({ to: "/perfil" }) },
            });
          } else if (n.status === "rejected") {
            toast.error("Verificação rejeitada", {
              description: n.admin_notes || "Sua solicitação foi rejeitada.",
              action: { label: "Detalhes", onClick: () => router.navigate({ to: "/verificacao" }) },
            });
          } else if (n.status === "more_info") {
            toast("ℹ Mais informações necessárias", {
              description: n.admin_notes || "Por favor, envie informações adicionais.",
              action: { label: "Abrir", onClick: () => router.navigate({ to: "/verificacao" }) },
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { verified: boolean };
          const o = payload.old as { verified: boolean };
          if (!o.verified && n.verified) {
            toast.success("✔ Perfil verificado!", {
              description: "Um administrador verificou seu perfil.",
              action: { label: "Ver perfil", onClick: () => router.navigate({ to: "/perfil" }) },
            });
          }
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