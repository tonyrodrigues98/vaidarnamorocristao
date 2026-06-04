import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Ctx = {
  online: Set<string>;
  isOnline: (id: string) => boolean;
};

const PresenceCtx = createContext<Ctx>({ online: new Set(), isOnline: () => false });

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [online, setOnline] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) {
      setOnline(new Set());
      return;
    }
    const channel = supabase.channel("global-presence", {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, at: Date.now() });
        }
      });

    // Heartbeat: touch activity + presence row every 60s
    const touch = () => {
      supabase.rpc("touch_my_activity").then(() => {});
    };
    touch();
    const iv = window.setInterval(touch, 60_000);

    return () => {
      window.clearInterval(iv);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = useMemo<Ctx>(
    () => ({
      online,
      isOnline: (id: string) => online.has(id),
    }),
    [online],
  );

  return <PresenceCtx.Provider value={value}>{children}</PresenceCtx.Provider>;
}

export function usePresence() {
  return useContext(PresenceCtx);
}
