import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Smile, Coins, Zap, MessageCircleHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FloatingSticker = {
  url: string;
  // position (percent) and size for the absolute composition
  top: string;
  left: string;
  size: number;
  rotate: number;
  delay: number;
  duration: number;
  z: number;
};

const SLOTS: Omit<FloatingSticker, "url">[] = [
  { top: "10%", left: "18%", size: 78, rotate: -8, delay: 0, duration: 6, z: 20 },
  { top: "4%", left: "55%", size: 64, rotate: 6, delay: 0.6, duration: 7, z: 15 },
  { top: "8%", left: "82%", size: 70, rotate: -4, delay: 1.2, duration: 6.5, z: 18 },
  { top: "52%", left: "8%", size: 72, rotate: 10, delay: 0.3, duration: 7.5, z: 22 },
  { top: "58%", left: "44%", size: 84, rotate: -6, delay: 0.9, duration: 6.2, z: 25 },
  { top: "48%", left: "78%", size: 68, rotate: 8, delay: 1.5, duration: 7.2, z: 16 },
  { top: "28%", left: "30%", size: 56, rotate: -12, delay: 0.2, duration: 6.8, z: 19 },
  { top: "72%", left: "24%", size: 62, rotate: 14, delay: 0.7, duration: 7.0, z: 21 },
  { top: "34%", left: "62%", size: 52, rotate: -10, delay: 1.0, duration: 6.5, z: 17 },
  { top: "76%", left: "72%", size: 58, rotate: 5, delay: 1.3, duration: 7.3, z: 20 },
  { top: "18%", left: "92%", size: 50, rotate: -15, delay: 0.4, duration: 6.0, z: 15 },
];

export function StickersChatBanner() {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("stickers")
        .select("public_url")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .limit(6);
      if (!cancel && data) setUrls(data.map((s) => s.public_url));
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const stickers: FloatingSticker[] = SLOTS.map((slot, i) => ({
    ...slot,
    url: urls[i] ?? "",
  })).filter((s) => s.url);

  return (
    <section
      aria-label="Novidade: stickers no chat global"
      className="relative isolate overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-[oklch(0.96_0.03_20)] via-[oklch(0.95_0.04_330)] to-[oklch(0.94_0.05_290)] shadow-soft dark:border-white/5 dark:from-[oklch(0.24_0.05_310)] dark:via-[oklch(0.22_0.06_330)] dark:to-[oklch(0.20_0.06_290)]"
    >
      {/* glow/blur backdrops */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-16 h-64 w-64 rounded-full bg-[oklch(0.88_0.10_20)]/45 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-[oklch(0.85_0.10_310)]/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 h-56 w-56 -translate-y-1/2 rounded-full bg-[oklch(0.90_0.08_350)]/35 blur-3xl"
      />
      {/* tiny sparkles */}
      {[
        { top: "18%", left: "62%", d: "0s" },
        { top: "70%", left: "58%", d: "1.1s" },
        { top: "32%", left: "90%", d: "0.6s" },
        { top: "82%", left: "84%", d: "1.6s" },
        { top: "12%", left: "74%", d: "2.1s" },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute h-1.5 w-1.5 animate-pulse rounded-full bg-white/80 shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}

      <div className="relative grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:p-10">
        {/* LEFT — content */}
        <div className="relative z-10 flex flex-col justify-center">
          <div className="animate-fade-up inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--rose)]/25 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rose)] backdrop-blur dark:bg-white/10">
            <Sparkles className="h-3 w-3" /> Novo no chat global
          </div>

          <h2
            className="animate-fade-up mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem]"
            style={{ animationDelay: "60ms" }}
          >
            Agora temos{" "}
            <MessageCircleHeart
              aria-hidden
              className="mx-1 -mt-1 inline-block h-7 w-7 text-[var(--rose)] sm:h-8 sm:w-8"
            />
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[oklch(0.62_0.18_290)] via-[oklch(0.65_0.22_340)] to-[oklch(0.66_0.22_20)] bg-clip-text text-transparent">
              stickers no chat global!
            </span>
          </h2>

          <p
            className="animate-fade-up mt-3 max-w-md text-sm text-muted-foreground sm:text-base"
            style={{ animationDelay: "140ms" }}
          >
            Expresse suas emoções, espalhe alegria e torne as conversas ainda
            mais divertidas.
          </p>

          {/* mini features */}
          <ul
            className="animate-fade-up mt-5 flex flex-wrap items-center gap-2.5 text-xs sm:gap-3 sm:text-sm"
            style={{ animationDelay: "220ms" }}
          >
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 font-medium text-foreground/80 backdrop-blur dark:bg-white/10">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.92_0.08_20)]/80 text-[var(--rose)]">
                <Smile className="h-3 w-3" />
              </span>
              Stickers exclusivos
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 font-medium text-foreground/80 backdrop-blur dark:bg-white/10">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.92_0.10_340)]/80 text-[oklch(0.55_0.20_340)]">
                <Coins className="h-3 w-3" />
              </span>
              Custa apenas 1 moeda
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 font-medium text-foreground/80 backdrop-blur dark:bg-white/10">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.92_0.08_290)]/80 text-[oklch(0.55_0.20_290)]">
                <Zap className="h-3 w-3" />
              </span>
              Anime o chat global
            </li>
          </ul>

          {/* CTA */}
          <div
            className="animate-fade-up mt-6"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              to="/comunidade"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.22_340)] to-[oklch(0.62_0.20_20)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.65_0.22_340/0.6)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
            >
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              <Smile className="h-4 w-4" />
              Ver stickers disponíveis
            </Link>
          </div>
        </div>

        {/* RIGHT — sticker composition */}
        <div className="relative h-[220px] sm:h-[260px] lg:h-[300px]">
          {/* soft inner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_60%_50%,oklch(0.95_0.06_330)/0.65,transparent_70%)]"
          />
          {stickers.map((s, i) => (
            <img
              key={i}
              src={s.url}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                ["--r" as never]: `${s.rotate}deg`,
                animation: `sticker-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
                zIndex: s.z,
                filter: "drop-shadow(0 8px 16px rgba(120,80,160,0.18))",
              }}
              className="pointer-events-none absolute select-none object-contain transition-transform"
            />
          ))}
          {/* fallback emoji placeholders while loading */}
          {stickers.length === 0 &&
            ["😊", "🌹", "⭐", "💖", "🍦", "😎"].map((e, i) => (
              <span
                key={i}
                aria-hidden
                className="pointer-events-none absolute select-none"
                style={{
                  top: SLOTS[i].top,
                  left: SLOTS[i].left,
                  fontSize: SLOTS[i].size,
                  ["--r" as never]: `${SLOTS[i].rotate}deg`,
                  animation: `sticker-float ${SLOTS[i].duration}s ease-in-out ${SLOTS[i].delay}s infinite`,
                  filter: "drop-shadow(0 8px 16px rgba(120,80,160,0.18))",
                }}
              >
                {e}
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}