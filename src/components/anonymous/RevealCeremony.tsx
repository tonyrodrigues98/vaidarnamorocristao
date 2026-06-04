import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Sparkles, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSignedPhotoUrlResult } from "@/lib/photoUrl";

export type RevealTarget = {
  messageId: string;
  matchId: string;
  otherUserId: string;
};

type Profile = { full_name: string; photo_url: string | null };

export function RevealCeremony({
  target,
  onClose,
}: {
  target: RevealTarget | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phase, setPhase] = useState<"loading" | "revealing" | "done">("loading");

  useEffect(() => {
    if (!target) return;
    setProfile(null);
    setPhase("loading");
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, photo_url")
        .eq("id", target.otherUserId)
        .maybeSingle();
      if (cancelled) return;
      setProfile((data as Profile) ?? { full_name: "Pretendente", photo_url: null });
      // Pequena respiração antes de iniciar a revelação
      setTimeout(() => !cancelled && setPhase("revealing"), 450);
      // Conclusão da revelação (sincronizado com blur 2.2s)
      setTimeout(() => !cancelled && setPhase("done"), 2700);
    })();
    return () => { cancelled = true; };
  }, [target]);

  // Vibração leve no mobile ao iniciar
  useEffect(() => {
    if (phase === "revealing" && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.([12, 40, 18]); } catch { /* noop */ }
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          key="reveal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 40%, rgba(20,10,30,0.72), rgba(0,0,0,0.88))",
            backdropFilter: "blur(22px) saturate(140%)",
            WebkitBackdropFilter: "blur(22px) saturate(140%)",
          }}
          aria-modal
          role="dialog"
        >
          {/* Partículas discretas */}
          <Particles />

          <motion.button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <X className="h-5 w-5" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm rounded-3xl p-6 text-center"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow:
                "0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mb-5"
            >
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70">
                <Sparkles className="h-3.5 w-3.5" />
                Revelação mútua
              </div>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Vocês decidiram se conhecer.
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Agora vocês podem conversar livremente.
              </p>
            </motion.div>

            <RevealPhoto photoUrl={profile?.photo_url ?? null} phase={phase} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "done" ? 1 : 0.6 }}
              transition={{ duration: 0.5 }}
              className="mt-4"
            >
              <div className="text-base font-medium text-white">
                {profile?.full_name ?? "Carregando…"}
              </div>
            </motion.div>

            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6"
                >
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-white text-black hover:bg-white/90 transition-transform hover:scale-[1.02]"
                    onClick={onClose}
                  >
                    <Link to="/conversas/$matchId" params={{ matchId: target.matchId }}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Começar conversa
                    </Link>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RevealPhoto({ photoUrl, phase }: { photoUrl: string | null; phase: "loading" | "revealing" | "done" }) {
  const { url: resolvedPhoto, loading: photoLoading, refresh: refreshPhoto } = useSignedPhotoUrlResult(photoUrl);
  const blur =
    phase === "loading" ? 38 : phase === "revealing" ? 0 : 0;
  const scale = phase === "loading" ? 1.08 : 1;

  return (
    <div className="relative mx-auto h-48 w-48">
      {/* Glow pulsante */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: phase === "done" ? 0.85 : [0.45, 0.8, 0.45],
          scale: phase === "done" ? 1.08 : [1, 1.06, 1],
        }}
        transition={{ duration: 2.4, repeat: phase === "done" ? 0 : Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle, rgba(255,180,210,0.55), rgba(255,140,120,0.25) 55%, transparent 70%)",
          filter: "blur(22px)",
        }}
      />
      {/* Moldura glass */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))",
          padding: 2,
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-full"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.25), 0 10px 40px rgba(0,0,0,0.4)",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          {resolvedPhoto ? (
            <motion.img
              src={resolvedPhoto}
              alt=""
              className="h-full w-full object-cover"
              initial={{ filter: "blur(38px)", scale: 1.08, opacity: 0.6 }}
              animate={{
                filter: `blur(${blur}px)`,
                scale,
                opacity: 1,
              }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
              draggable={false}
              onError={refreshPhoto}
            />
          ) : photoUrl && photoLoading ? (
            <div className="h-full w-full animate-pulse bg-white/10" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40">
              <Sparkles className="h-10 w-10" />
            </div>
          )}
          {/* Reflexo sutil */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.18), transparent 45%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Particles() {
  // 14 partículas discretas
  const items = Array.from({ length: 14 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 7) * 0.4;
        const size = 2 + (i % 3);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/60"
            style={{ left: `${left}%`, top: "100%", width: size, height: size, filter: "blur(0.4px)" }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -window.innerHeight * 0.9, opacity: [0, 0.7, 0] }}
            transition={{ duration: 6 + (i % 4), repeat: Infinity, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
