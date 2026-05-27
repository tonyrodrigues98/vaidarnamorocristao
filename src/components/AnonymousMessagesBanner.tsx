import { Link } from "@tanstack/react-router";
import { VenetianMask, Heart, Lock, ArrowRight } from "lucide-react";
import letterImage from "@/assets/anonymous-letter.png";

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
        <div className="relative h-[320px] sm:h-[420px] md:h-[520px] xl:h-[560px] mt-2 md:mt-0">
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

      {/* Letter illustration with subtle float */}
      <img
        src={letterImage}
        alt="Envelope com carta anônima"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain"
        style={{ animation: "anon-float 7s ease-in-out infinite" }}
      />
    </div>
  );
}
