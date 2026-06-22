import { Link } from "@tanstack/react-router";
import { ArrowRight, Gamepad2, Gem, Rocket } from "lucide-react";

export function PetArcadeEntryCard() {
  return (
    <Link
      to="/pet-arcade"
      className="app-pressable group block overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/70 to-amber-50 p-5 shadow-[0_18px_50px_rgba(244,63,94,0.10)]"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase text-rose-500">Aventuras do pet</p>
              <h3 className="mt-1 text-lg font-bold text-neutral-950">Pet Arcade</h3>
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-rose-500" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Explore tesouros e voe pelas estrelas usando apenas moedas internas do app.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
              <Gem className="h-3.5 w-3.5 text-amber-500" /> Campo de Tesouros
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
              <Rocket className="h-3.5 w-3.5 text-sky-500" /> Voo Estelar
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
