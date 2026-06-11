import { Link } from "@tanstack/react-router";
import { ArrowLeft, Coins, Plus } from "lucide-react";

type AvatarHeaderProps = {
  coins: number;
};

export function AvatarHeader({ coins }: AvatarHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <Link
          to="/perfil"
          aria-label="Voltar para o perfil"
          className="grid h-11 w-11 place-items-center rounded-full border border-rose-100 bg-white text-stone-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-400">
            Avatar
          </p>
          <h1 className="text-base font-black tracking-tight text-stone-950">VaiDarNamoro</h1>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 py-1 pl-2.5 pr-1 shadow-[0_10px_28px_rgba(251,146,60,0.16)]">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="min-w-10 text-right text-sm font-extrabold text-stone-900">{coins}</span>
          <button
            type="button"
            aria-label="Adicionar moedas"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#ff5c70] text-white shadow-sm transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
