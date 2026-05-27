import { Link } from "@tanstack/react-router";
import { VenetianMask, Heart, MessageCircle, Send, Lock, Sparkles, ArrowRight } from "lucide-react";

/**
 * Premium banner announcing the "Recados Anônimos" feature.
 * Built fully in code (no static screenshot). Responsive: 2 columns on desktop,
 * stacked on mobile. Right side is a real composed illustration (envelope +
 * letter + floating elements) using layered divs and lucide icons.
 */
export function AnonymousMessagesBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] md:rounded-[32px] border border-white/60"
      style={{
        background:
          "linear-gradient(90deg, #FFF0F5 0%, #F8EDFF 50%, #FDEEFF 100%)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
      }}
    >
      {/* soft ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, #FFB6D9 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, #C7B6FF 0%, transparent 70%)" }}
      />

      <div className="relative grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 md:gap-6 px-6 py-8 sm:px-8 md:px-16 md:py-14">
        {/* LEFT — content */}
        <div className="flex flex-col items-start gap-5 md:gap-6">
          {/* badge */}
          <span
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[11px] font-semibold tracking-[0.14em] text-[#7B61FF]"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(123,97,255,0.12)",
            }}
          >
            <VenetianMask className="h-3.5 w-3.5" />
            NOVIDADE NO VAI DAR NAMORO
          </span>

          {/* title */}
          <h2
            className="font-extrabold text-[#111827] leading-[1.02] tracking-tight"
            style={{ fontSize: "clamp(32px, 5.2vw, 52px)" }}
          >
            Chegaram os{" "}
            <span className="inline-flex items-center gap-2">
              <span
                style={{
                  background: "linear-gradient(90deg, #FF5EA8, #7B61FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                recados anônimos!
              </span>
              <VenetianMask
                className="hidden sm:inline-block shrink-0 text-[#7B61FF]"
                style={{ width: "1em", height: "1em", maxWidth: 44, maxHeight: 44 }}
              />
            </span>
          </h2>

          {/* description */}
          <p
            className="text-[#6B7280]"
            style={{ fontSize: "clamp(15px, 1.6vw, 18px)", lineHeight: 1.7, maxWidth: 520 }}
          >
            Receba mensagens especiais de forma anônima. Surpresas, elogios e
            declarações no seu cantinho.
          </p>

          {/* chips */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { icon: VenetianMask, label: "100% anônimo" },
              { icon: Heart, label: "Mensagens especiais" },
              { icon: Lock, label: "Seguro e privado" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-[#374151]"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(123,97,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Icon className="h-4 w-4 text-[#7B61FF]" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/recados"
            className="group inline-flex items-center gap-2 mt-1 h-[54px] md:h-[58px] px-7 md:px-8 rounded-full text-white font-bold text-base md:text-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "linear-gradient(90deg, #FF5EA8, #7B61FF)",
              boxShadow: "0 12px 30px rgba(255,94,168,0.25)",
            }}
          >
            Ver meus recados
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* RIGHT — illustration */}
        <div className="relative h-[260px] sm:h-[320px] md:h-[400px] mt-2 md:mt-0">
          <Illustration />
        </div>
      </div>
    </div>
  );
}

function Illustration() {
  return (
    <div className="absolute inset-0">
      {/* glow halo behind envelope */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 md:h-72 md:w-72 rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, #C7B6FF 0%, transparent 70%)" }}
      />

      {/* Envelope + letter, centered, with subtle float */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: "anon-float 7s ease-in-out infinite" }}
      >
        <Envelope />
      </div>

      {/* Floating elements */}
      <FloatingBubble
        className="left-[6%] top-[14%] hidden sm:flex"
        size={48}
        delay={0}
        color="linear-gradient(135deg, #FF5EA8, #FFB6D9)"
      >
        <Heart className="h-5 w-5 text-white" fill="white" />
      </FloatingBubble>

      <FloatingBubble
        className="right-[4%] top-[10%]"
        size={54}
        delay={1.2}
        color="linear-gradient(135deg, #7B61FF, #9C7CFF)"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </FloatingBubble>

      <FloatingBubble
        className="left-[2%] bottom-[16%]"
        size={44}
        delay={0.6}
        color="linear-gradient(135deg, #9C7CFF, #C7B6FF)"
      >
        <Lock className="h-5 w-5 text-white" />
      </FloatingBubble>

      <FloatingBubble
        className="right-[8%] bottom-[12%]"
        size={50}
        delay={1.8}
        color="linear-gradient(135deg, #FF5EA8, #7B61FF)"
      >
        <Send className="h-5 w-5 text-white" />
      </FloatingBubble>

      {/* sparkle particles */}
      <Sparkles
        aria-hidden
        className="absolute left-[20%] top-[8%] h-4 w-4 text-[#FF5EA8]/70"
        style={{ animation: "anon-twinkle 3s ease-in-out infinite" }}
      />
      <Sparkles
        aria-hidden
        className="absolute right-[24%] bottom-[6%] h-3 w-3 text-[#7B61FF]/70"
        style={{ animation: "anon-twinkle 3.6s ease-in-out infinite 0.8s" }}
      />
      <Sparkles
        aria-hidden
        className="absolute right-[36%] top-[18%] h-3 w-3 text-[#9C7CFF]/60"
        style={{ animation: "anon-twinkle 4s ease-in-out infinite 1.4s" }}
      />
    </div>
  );
}

function Envelope() {
  return (
    <div className="relative" style={{ width: 260, height: 200 }}>
      {/* Letter — peeking out behind */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-2xl bg-white"
        style={{
          width: 210,
          height: 150,
          bottom: 70,
          boxShadow:
            "0 20px 40px -10px rgba(123,97,255,0.35), 0 4px 12px rgba(0,0,0,0.06)",
          transform: "translateX(-50%) rotate(-3deg)",
          border: "1px solid rgba(123,97,255,0.08)",
        }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2.5 px-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #FF5EA8, #7B61FF)" }}
          >
            <VenetianMask className="h-5 w-5 text-white" />
          </div>
          <div className="w-full space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[#EFEAFF]" />
            <div className="h-1.5 w-[85%] rounded-full bg-[#F4E6F0]" />
            <div className="h-1.5 w-[70%] rounded-full bg-[#EFEAFF]" />
          </div>
        </div>
      </div>

      {/* Envelope body */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-2xl"
        style={{
          height: 130,
          background: "linear-gradient(160deg, #9C7CFF 0%, #7B61FF 60%, #6B4FE8 100%)",
          boxShadow:
            "0 30px 50px -15px rgba(123,97,255,0.55), inset 0 -2px 6px rgba(0,0,0,0.12)",
        }}
      />
      {/* Envelope flap (open) */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: 90,
          height: 80,
          background:
            "linear-gradient(180deg, #8B6FFF 0%, #7B61FF 100%)",
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          opacity: 0.35,
          transform: "translateY(-30px) scaleY(0.6)",
          transformOrigin: "top",
        }}
      />
      {/* Envelope front lip */}
      <div
        className="absolute left-0 right-0 bottom-0 rounded-b-2xl"
        style={{
          height: 70,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08))",
          clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
        }}
      />

      {/* Wax seal */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          bottom: 36,
          background: "linear-gradient(135deg, #FF5EA8, #E8458F)",
          boxShadow:
            "0 6px 16px rgba(255,94,168,0.45), inset 0 -2px 4px rgba(0,0,0,0.15)",
        }}
      >
        <Heart className="h-5 w-5 text-white" fill="white" />
      </div>
    </div>
  );
}

function FloatingBubble({
  children,
  className = "",
  size,
  delay,
  color,
}: {
  children: React.ReactNode;
  className?: string;
  size: number;
  delay: number;
  color: string;
}) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-2xl ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: "0 10px 24px -6px rgba(123,97,255,0.35)",
        animation: `anon-float 6s ease-in-out infinite ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}