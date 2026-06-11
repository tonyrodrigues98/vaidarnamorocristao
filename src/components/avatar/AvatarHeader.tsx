import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CoinIcon } from "@/components/icons/CoinIcon";

type Props = {
  coins: number;
  backTo?: string;
};

export function AvatarHeader({ coins, backTo = "/inicio" }: Props) {
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#FFF7F3]/80 px-4 pb-3 backdrop-blur-md"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
    >
      <Link
        to={backTo}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </Link>
      <h1 className="flex items-center gap-1.5 font-serif text-xl font-semibold text-primary">
        <span className="text-primary">♥+</span>
        VaiDarNamoro
      </h1>
      <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
        <CoinIcon className="h-5 w-5" />
        <span className="text-sm font-semibold text-foreground">
          {coins.toLocaleString("pt-BR")}
        </span>
        <button
          type="button"
          aria-label="Adicionar moedas"
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 text-primary"
        >
          +
        </button>
      </div>
    </div>
  );
}
