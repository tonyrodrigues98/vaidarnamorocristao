import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const TYPING_CHANNEL = "global-chat-typing";
export const TYPING_TTL_MS = 2500;

/**
 * Broadcast a "typing" ping on the given channel. Throttle yourself —
 * the channel debounces nothing.
 */
export function useTypingBroadcaster(userId: string | null | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(TYPING_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      void supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [userId]);

  return (now = Date.now()) => {
    if (!userId) return;
    // Throttle: at most one event every 1.5s per user
    if (now - lastSentRef.current < 1500) return;
    lastSentRef.current = now;
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, at: now },
    });
  };
}

export function TypingIndicator({ selfId }: { selfId: string | null | undefined }) {
  const [typers, setTypers] = useState<Record<string, number>>({});

  useEffect(() => {
    const ch = supabase.channel(TYPING_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "typing" }, (msg) => {
      const payload = msg.payload as { userId?: string; at?: number } | undefined;
      const uid = payload?.userId;
      if (!uid || uid === selfId) return;
      setTypers((prev) => ({ ...prev, [uid]: Date.now() }));
    });
    ch.subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [selfId]);

  // Sweep stale typers
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTypers((prev) => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v < TYPING_TTL_MS) next[k] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 500);
    return () => clearInterval(t);
  }, []);

  const visible = Object.keys(typers).length > 0;

  return (
    <div className="pointer-events-none px-3 sm:px-4" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-1.5 sm:gap-2 py-1 sm:py-1.5 text-[11px] sm:text-xs text-muted-foreground/80 will-change-transform"
            style={{ contain: "layout style paint" }}
          >
            <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary/10 backdrop-blur">
              <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary/70" />
            </span>
            <span className="font-medium tracking-tight">Alguém está digitando</span>
            <span className="inline-flex items-end gap-0.5 pb-0.5" aria-hidden="true">
              <Dot delay={0} />
              <Dot delay={0.15} />
              <Dot delay={0.3} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-full bg-primary/60"
      animate={{ y: [0, -2, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}
